// ==========================================================================
// בית ומנוחה - מנוע המודעות (אפיון 03): שדות, ערכים אוטומטיים, רינדור, ספרייה
//
// שדות בגוף התבנית (HTML):
//   <span data-field="שם">  — שדה לעריכה; סוג לפי המילה הראשונה (תאריך / שעה / סכום / טקסט)
//   <span data-auto="שם">   — שדה אוטומטי; המערכת ממלאת לפי הבניין, הדירה וההגדרות
// ==========================================================================
import { formatFormattedDate } from './hebrewDate';
import { formatILS, formatMonth, aptDebt } from './format';
import { activeTransactions, round2, nowISO } from './ledger';
import { unitLabel, unitDisplayName, residentialUnits } from './units';
import { addMonths } from './levies';

// --------------------------------------------------------------------------
// שדות לעריכה
// --------------------------------------------------------------------------
export function fieldType(name) {
  const n = String(name || '').trim();
  if (n.startsWith('תאריך')) return 'date';
  if (n.startsWith('שעה') || n.startsWith('שעת')) return 'time';
  if (n.startsWith('סכום') || n.startsWith('עלות')) return 'amount';
  return 'text';
}

export const FIELD_TYPE_LABELS = { date: 'תאריך', time: 'שעה', amount: 'סכום', text: 'טקסט' };

export function formatFieldValue(name, raw, settings = {}) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return '';
  const type = fieldType(name);
  if (type === 'date') {
    const d = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(d.getTime())) return String(raw);
    const day = d.toLocaleDateString('he-IL', { weekday: 'long' });
    return `${day}, ${formatFormattedDate(d, settings.hebrewDateFormat || 'both')}`;
  }
  if (type === 'amount') {
    const n = parseFloat(String(raw).replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? `${n.toLocaleString('he-IL', { maximumFractionDigits: 2 })} ₪` : String(raw);
  }
  return String(raw);
}

// שמות השדות לעריכה שבגוף (לפי סדר הופעה, בלי כפילויות)
export function fieldNames(...htmls) {
  const out = [];
  htmls.forEach(html => {
    String(html || '').replace(/data-field="([^"]*)"/g, (_, n) => {
      const name = decode(n);
      if (!out.includes(name)) out.push(name);
      return _;
    });
  });
  return out;
}

export function autoNames(...htmls) {
  const out = new Set();
  htmls.forEach(html => String(html || '').replace(/data-auto="([^"]*)"/g, (_, n) => { out.add(decode(n)); return _; }));
  return Array.from(out);
}

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s) => escapeHtml(s).replace(/"/g, '&quot;');

// --------------------------------------------------------------------------
// שדות אוטומטיים
// --------------------------------------------------------------------------
export const AUTO_FIELDS = [
  { name: 'שם_בניין', label: 'שם הבניין' },
  { name: 'כתובת_בניין', label: 'כתובת הבניין' },
  { name: 'תאריך', label: 'תאריך היום' },
  { name: 'שם_חברה', label: 'שם החברה' },
  { name: 'שם_מנהל', label: 'שם המנהל' },
  { name: 'טלפון_חברה', label: 'טלפון החברה' },
  { name: 'חשבון_בנק_בניין', label: 'חשבון הבנק של הבניין' },
  { name: 'שם_החייב', label: 'שם הדייר (מהדירה שנבחרה)', needs: 'apartment' },
  { name: 'דירה', label: 'מספר הדירה (מהדירה שנבחרה)', needs: 'apartment' },
  { name: 'חודשי_חוב', label: 'חודשי החוב של הדירה', needs: 'apartment' },
  { name: 'סכום_חוב', label: 'סכום החוב של הדירה', needs: 'apartment' },
  { name: 'תקופה', label: 'תקופת הדוח', needs: 'period' },
  { name: 'טבלת_הוצאות', label: 'טבלת הוצאות חודשיות ממוצעות', needs: 'period', block: true },
  { name: 'הוצאה_חודשית', label: 'הוצאה חודשית ממוצעת', needs: 'period' },
  { name: 'הכנסה_חודשית', label: 'הכנסה חודשית צפויה מדמי ועד', needs: 'period' },
  { name: 'גירעון_חודשי', label: 'גירעון (או עודף) חודשי', needs: 'period' },
  { name: 'מספר_דירות', label: 'מספר הדירות המשלמות' },
  { name: 'דמי_ועד_לדירה', label: 'דמי ועד נפוצים לדירה' }
];
export const AUTO_BY_NAME = Object.fromEntries(AUTO_FIELDS.map(f => [f.name, f]));

// מה הקשר שהתבנית צריכה (דירה / תקופה)
export function contextNeeds(...htmls) {
  const needs = new Set();
  autoNames(...htmls).forEach(n => { if (AUTO_BY_NAME[n]?.needs) needs.add(AUTO_BY_NAME[n].needs); });
  return needs;
}

export function periodMonths(from, to) {
  const out = [];
  if (!from || !to || from > to) return out;
  for (let m = from; m <= to && out.length < 36; m = addMonths(m, 1)) out.push(m);
  return out;
}

function commonDues(building) {
  const counts = {};
  residentialUnits(building).forEach(u => { const k = u.monthlyDues || 0; counts[k] = (counts[k] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? Number(top[0]) : 0;
}

// הוצאות ממוצעות לחודש לפי קטגוריה בתקופה (בלי העברות)
export function periodExpenses(building, months) {
  const set = new Set(months);
  const byCat = {};
  activeTransactions(building)
    .filter(tx => tx.direction === 'out' && !tx.transfer && set.has(tx.month))
    .forEach(tx => { byCat[tx.category] = (byCat[tx.category] || 0) + tx.amount; });
  const n = months.length || 1;
  const rows = Object.entries(byCat).map(([category, sum]) => ({ category, avg: round2(sum / n) })).sort((a, b) => b.avg - a.avg);
  return { rows, total: round2(rows.reduce((s, r) => s + r.avg, 0)) };
}

export function autoValues({ building, apartment = null, settings = {}, period = null, now = new Date() }) {
  const companyPhone = (settings.phoneList || []).map(p => p.number).filter(Boolean).join(' · ') || settings.companyPhone || '';
  const values = {
    'שם_בניין': building?.name || '',
    'כתובת_בניין': building?.address || building?.name || '',
    'תאריך': formatFormattedDate(now, settings.hebrewDateFormat || 'both'),
    'שם_חברה': settings.companyName || 'בית ומנוחה',
    'שם_מנהל': settings.managerName || '',
    'טלפון_חברה': companyPhone,
    'חשבון_בנק_בניין': building?.bankAccount || '',
    'מספר_דירות': String(residentialUnits(building).length),
    'דמי_ועד_לדירה': formatILS(commonDues(building))
  };
  if (apartment) {
    values['שם_החייב'] = unitDisplayName(apartment);
    values['דירה'] = unitLabel(apartment);
    const months = [...(apartment.debtMonths || [])].sort();
    values['חודשי_חוב'] = months.length ? months.map(formatMonth).join(', ') : 'אין חודשי חוב';
    values['סכום_חוב'] = formatILS(aptDebt(apartment));
  }
  if (period?.from && period?.to) {
    const months = periodMonths(period.from, period.to);
    const exp = periodExpenses(building, months);
    const income = round2(residentialUnits(building).reduce((s, u) => s + (u.monthlyDues || 0), 0));
    const gap = round2(income - exp.total);
    values['תקופה'] = `${formatMonth(period.from)} – ${formatMonth(period.to)}`;
    values['הוצאה_חודשית'] = formatILS(exp.total);
    values['הכנסה_חודשית'] = formatILS(income);
    values['גירעון_חודשי'] = gap < 0 ? formatILS(-gap) : `${formatILS(0)} (עודף של ${formatILS(gap)})`;
    values['טבלת_הוצאות'] = exp.rows.length
      ? `<table class="notice-table"><tbody>${exp.rows.map(r => `<tr><td>${escapeHtml(r.category)}</td><td class="num">${formatILS(r.avg)}</td></tr>`).join('')}<tr class="total"><td>סה״כ</td><td class="num">${formatILS(exp.total)}</td></tr></tbody></table>`
      : '<p><i>אין הוצאות רשומות בתקופה שנבחרה.</i></p>';
  }
  return values;
}

// --------------------------------------------------------------------------
// רינדור: תבנית → HTML לעורך / להדפסה
// mode: 'edit' (שדות כ"צ'יפים" צהובים) | 'print' (ערכים בלבד, שדה ריק = קו)
// --------------------------------------------------------------------------
export function renderNotice(html, { values = {}, auto = {}, settings = {}, mode = 'edit' } = {}) {
  let out = String(html || '');
  out = out.replace(/<span data-auto="([^"]*)"[^>]*>[\s\S]*?<\/span>/g, (_, n) => {
    const name = decode(n);
    const v = auto[name];
    if (AUTO_BY_NAME[name]?.block) {
      return `<div class="na-block" data-auto="${escapeAttr(name)}" contenteditable="false">${v || (mode === 'edit' ? `<span class="na-missing">[${escapeHtml(AUTO_BY_NAME[name]?.label || name)}]</span>` : '')}</div>`;
    }
    const shown = v !== undefined && v !== '' ? escapeHtml(v) : (mode === 'edit' ? `[${escapeHtml(AUTO_BY_NAME[name]?.label || name)}]` : '');
    return mode === 'print'
      ? `<span class="na-print">${shown}</span>`
      : `<span class="na${v ? '' : ' na-missing'}" data-auto="${escapeAttr(name)}" contenteditable="false" title="שדה אוטומטי: ${escapeAttr(AUTO_BY_NAME[name]?.label || name)}">${shown}</span>`;
  });
  out = out.replace(/<span data-field="([^"]*)"[^>]*>[\s\S]*?<\/span>/g, (_, n) => {
    const name = decode(n);
    const v = formatFieldValue(name, values[name], settings);
    if (mode === 'print') return v ? escapeHtml(v) : '<span class="nf-blank">&nbsp;</span>';
    return `<span class="nf${v ? ' is-filled' : ''}" data-field="${escapeAttr(name)}" contenteditable="false">${v ? escapeHtml(v) : `‹${escapeHtml(name)}›`}</span>`;
  });
  return out;
}

// HTML מהעורך → גוף תבנית: הצ'יפים חוזרים להיות שדות ריקים.
// keepValues: שדות שמולאו נשמרים כטקסט קבוע במקום כשדה (אפיון 03, סעיף 8.3)
export function serializeEditor(html, { keepValues = false } = {}) {
  let out = String(html || '');
  out = out.replace(/<div class="na-block"[^>]*data-auto="([^"]*)"[^>]*>[\s\S]*?<\/div>/g, (_, n) => `<span data-auto="${n}"></span>`);
  out = out.replace(/<span class="na[^"]*"[^>]*data-auto="([^"]*)"[^>]*>[\s\S]*?<\/span>/g, (_, n) => `<span data-auto="${n}"></span>`);
  out = out.replace(/<span class="nf( is-filled)?"[^>]*data-field="([^"]*)"[^>]*>([\s\S]*?)<\/span>/g, (_, filled, n, text) =>
    (keepValues && filled ? text : `<span data-field="${n}"></span>`));
  return out;
}

// --------------------------------------------------------------------------
// טקסט פשוט (מייל) וטקסט לווצאפ
// --------------------------------------------------------------------------
export function htmlToText(html, { whatsapp = false } = {}) {
  let s = String(html || '');
  s = s.replace(/<table[\s\S]*?<\/table>/g, (t) => t.replace(/<\/td>\s*<td[^>]*>/g, ' — ').replace(/<\/tr>/g, '\n').replace(/<[^>]+>/g, '') + '\n');
  if (whatsapp) {
    s = s.replace(/<(b|strong)>([\s\S]*?)<\/\1>/g, (_, __, t) => (t.trim() ? `*${t.trim()}*` : t));
    s = s.replace(/<(h2|h3)[^>]*>([\s\S]*?)<\/\1>/g, (_, __, t) => `*${t.replace(/<[^>]+>/g, '').trim()}*\n`);
  }
  s = s.replace(/<li[^>]*>/g, '• ').replace(/<\/li>/g, '\n');
  s = s.replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|div|h2|h3|ul|ol)>/g, '\n');
  s = s.replace(/<img[^>]*>/g, '[תמונה]');
  s = s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// --------------------------------------------------------------------------
// ספרייה: קטגוריות ותבניות (נשמרת בדפדפן; נערכת במסך ההגדרות)
// --------------------------------------------------------------------------
export const RECYCLE_DAYS = 30;
export const LIBRARY_VERSION = 1; // מעלים כשתבניות ההתחלה משתנות — ספרייה שלא נערכה מתעדכנת
export const MAX_VERSIONS = 5;

export function initialLibrary(categories, templates) {
  return {
    version: LIBRARY_VERSION,
    categories: categories.map((c, i) => ({ ...c, order: i })),
    templates: templates.map((t, i) => ({ ...t, order: i, isFavorite: false, deletedAt: null, updatedAt: null, versions: [] })),
    recent: []
  };
}

// מחיקה סופית של תבניות שבסל המחזור יותר מ-30 יום
export function purgeRecycle(lib, now = new Date()) {
  const limit = now.getTime() - RECYCLE_DAYS * 86400000;
  return { ...lib, templates: lib.templates.filter(t => !t.deletedAt || new Date(t.deletedAt).getTime() > limit) };
}

export function liveTemplates(lib) {
  return (lib?.templates || []).filter(t => !t.deletedAt);
}

export function addTemplate(lib, data) {
  const t = {
    id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    categoryId: data.categoryId,
    name: data.name.trim(),
    title: data.title || '',
    body: data.body || '<p></p>',
    addressee: data.addressee || 'residents',
    order: lib.templates.length,
    isFavorite: false,
    deletedAt: null,
    updatedAt: nowISO(),
    versions: []
  };
  return { lib: { ...lib, templates: [...lib.templates, t] }, id: t.id };
}

// עדכון תוכן: הגרסה הקודמת נשמרת בהיסטוריה (5 אחרונות)
export function updateTemplateContent(lib, id, { title, body }) {
  return {
    ...lib,
    templates: lib.templates.map(t => (t.id !== id ? t : {
      ...t,
      title,
      body,
      updatedAt: nowISO(),
      versions: [{ title: t.title, body: t.body, savedAt: t.updatedAt || nowISO() }, ...(t.versions || [])].slice(0, MAX_VERSIONS)
    }))
  };
}

export function patchTemplate(lib, id, patch) {
  return { ...lib, templates: lib.templates.map(t => (t.id === id ? { ...t, ...patch } : t)) };
}

export function restoreVersion(lib, id, index) {
  const t = lib.templates.find(x => x.id === id);
  const v = t?.versions?.[index];
  if (!v) return lib;
  return updateTemplateContent(lib, id, { title: v.title, body: v.body });
}

export function touchRecent(lib, id) {
  return { ...lib, recent: [id, ...(lib.recent || []).filter(x => x !== id)].slice(0, 5) };
}

export function uniqueName(lib, categoryId, name, exceptId = null) {
  const taken = new Set(liveTemplates(lib).filter(t => t.categoryId === categoryId && t.id !== exceptId).map(t => t.name));
  if (!taken.has(name)) return name;
  for (let i = 2; i < 100; i++) if (!taken.has(`${name} (${i})`)) return `${name} (${i})`;
  return `${name} (${Date.now()})`;
}

// שורת פרטי הקשר לתחתית הדף: טלפונים ומיילים מההגדרות
export function contactLine(settings = {}) {
  const phones = (settings.phoneList || []).filter(p => p.number?.trim()).map(p => (p.label ? `${p.label}: ${p.number.trim()}` : p.number.trim()));
  const emails = (settings.emailList || []).map(e => e.email?.trim()).filter(Boolean);
  return [...phones, ...emails];
}

// --------------------------------------------------------------------------
// תמונה מצורפת: הקטנה לפני ההטמעה במודעה (שומר על נפח קטן)
// --------------------------------------------------------------------------
export function resizeImage(file, maxSide = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
