// ==========================================================================
// בית ומנוחה - מפענח קובצי CSV (בנק וחיובית)
// נבדק מול קבצים אמיתיים (אפיון 04, סעיף 7.4): ראשי תיבות כמו הו"ק ומט"י
// מופיעים בתוך שדות במירכאות בלי הכפלה, ולכן פענוח CSV רגיל נשבר עליהם.
// ==========================================================================
import { toISODate, round2 } from './ledger';

const parseNumber = (s) => parseFloat(String(s ?? '').replace(/[^\d.-]/g, '')) || 0;

// פיצול שורה רגילה: מירכאות כפולות בלבד פותחות/סוגרות שדה, "" = מירכאה בתוך שדה
function splitStandard(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(v => v.trim());
}

// פיצול שורה שכל השדות בה במירכאות ("a","b","c"): לפי הרצף "," —
// עמיד למירכאות שבורות בתוך שדה (למשל "עמלת פעולה בערוץ ישיר- מט", לפי 2 יח'")
function splitAllQuoted(line) {
  let s = line.trim().replace(/,+\s*$/, '');
  if (!s.startsWith('"') || !s.endsWith('"')) return null;
  s = s.slice(1, -1);
  return s.split('","').map(v => v.replace(/""/g, '"').trim());
}

export function splitLines(text) {
  return String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim().length > 0);
}

/**
 * מפענח CSV לטבלה: { headers, rows } — כל שורה אובייקט לפי שמות העמודות
 */
export function parseCSVText(csvText) {
  const lines = splitLines(csvText);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitStandard(lines[0]).map(h => h.trim()).filter((h, i, arr) => h || i < arr.length - 1);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    let values = splitAllQuoted(lines[i]);
    if (!values || values.length < headers.length) values = splitStandard(lines[i]);
    if (values.length < headers.length) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = values[idx] ?? ''; });
    rows.push(obj);
  }
  return { headers, rows };
}

// גיבוב פשוט של תוכן הקובץ — לזיהוי קובץ שכבר נקלט
export function hashText(text) {
  let h = 2166136261;
  const s = String(text || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

const pick = (row, ...keys) => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== '') return row[k];
  }
  return '';
};

/**
 * מפענח דו"ח תנועות עובר ושב מהבנק.
 * מחזיר שורות מהישנה לחדשה: { rowIndex, date, valueDate, description, direction, amount, balance, hasBalance, reference }
 */
export function parseBankReport(csvText) {
  const { headers, rows } = parseCSVText(csvText);
  if (!headers.some(h => h.includes('תאריך'))) {
    throw new Error('לא נמצאה עמודת "תאריך". ודאו שזה קובץ עו״ש מהבנק');
  }
  const parsed = rows.map((r, idx) => {
    const rawAmount = parseNumber(pick(r, 'זכות/חובה ₪', 'זכות/חובה', 'סכום'));
    const balanceRaw = pick(r, 'יתרה ₪', 'יתרה');
    return {
      rowIndex: idx,
      date: toISODate(pick(r, 'תאריך', 'תאריך הפעולה')),
      valueDate: toISODate(pick(r, 'יום ערך')),
      description: pick(r, 'תיאור התנועה', 'תיאור', 'פרטים'),
      direction: rawAmount < 0 ? 'out' : 'in',
      amount: round2(Math.abs(rawAmount)),
      balance: round2(parseNumber(balanceRaw)),
      hasBalance: balanceRaw !== '',
      reference: pick(r, 'אסמכתה', 'אסמכתא').trim()
    };
  }).filter(r => r.date && r.amount > 0);

  // בבנק השורות מהחדשה לישנה — הופכים לסדר כרונולוגי (תוך שמירה על הסדר בתוך אותו יום)
  const newestFirst = parsed.length > 1 && parsed[0].date > parsed[parsed.length - 1].date;
  return newestFirst ? parsed.reverse() : parsed;
}

/**
 * מפענח דו"ח חברת הגבייה 'חיובית'
 */
export function parseHiyuvitReport(csvText) {
  const { headers, rows } = parseCSVText(csvText);
  if (!headers.includes('Amount') && !headers.includes('סכום')) {
    throw new Error('לא נמצאה עמודת סכום. ודאו שזה קובץ חיובית מקורי');
  }
  return rows.map((r, idx) => {
    const details = pick(r, 'Details', 'שם דייר', 'פרטים');
    const tranType = pick(r, 'TranType', 'סוג תנועה');
    const amount = parseNumber(pick(r, 'Amount', 'סכום'));
    const fee = parseNumber(pick(r, 'Amla', 'עמלה'));
    const toPay = pick(r, 'ToPay', 'לתשלום');
    const isFailed = tranType.includes('נכשל');
    const isReturnFee = tranType.includes('החזרת');
    // בחיוב שנכשל הסכום המקורי מופיע בשם: "קניג נחמן - 100.00"
    const failedMatch = details.match(/-\s*([\d.,]+)\s*$/);
    return {
      rowIndex: idx,
      id: pick(r, 'ID') || `row-${idx}`,
      buildingNum: pick(r, 'BuildingNum'),
      clientNumber: pick(r, 'ClientNumber'),
      name: details.replace(/-\s*[\d.,]+\s*$/, '').trim(),
      date: toISODate(pick(r, 'DueDate', 'תאריך')),
      tranType,
      amount: round2(amount),
      fee: round2(fee),
      net: round2(toPay !== '' ? parseNumber(toPay) : amount - fee),
      isFailed,
      isReturnFee,
      isSuccess: !isFailed && !isReturnFee && amount > 0,
      failedAmount: isFailed && failedMatch ? parseNumber(failedMatch[1]) : 0
    };
  });
}
