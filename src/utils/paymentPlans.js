// ==========================================================================
// בית ומנוחה - פריסות חוב (אפיון 07)
// payable: הבניין חייב לספק (למשל צ'קים דחויים לשינדלר)
// receivable: חייבים לבניין (דייר שמסדיר חוב בתשלומים)
//
// plan: { id, direction, counterparty: { name } | { unitId }, purpose, totalAmount, method, category,
//   debtMonths[], status: 'active' | 'completed' | 'cancelled', notes, createdAt,
//   installments: [{ n, dueDate, amount, checkNumber, status: 'pending' | 'paid' | 'cancelled', transactionId, paidDate, manual }] }
// ==========================================================================
import { round2, nowISO, normalizeText, activeTransactions } from './ledger';
import { unitLabel, unitDisplayName, parsePayerNames } from './units';

export const PLAN_METHODS = {
  checks: "צ'קים דחויים",
  standing_order: 'הוראת קבע',
  transfer: 'העברה בנקאית',
  cash: 'מזומן',
  hiyuvit: 'חיובית'
};
export const PLAN_STATUS = { active: 'פעילה', completed: 'הושלמה', cancelled: 'בוטלה' };
export const LATE_DAYS = 5;
export const MATCH_DAYS = 7;
export const RECEIVABLE_CATEGORY = 'הסדר חוב';

const DAY = 86400000;
const toTime = (iso) => new Date(`${iso}T12:00:00Z`).getTime();
export const daysBetween = (a, b) => Math.round((toTime(b) - toTime(a)) / DAY);

export function addMonthsToDate(dateISO, k) {
  const [y, m, d] = dateISO.split('-').map(Number);
  const last = new Date(Date.UTC(y, m - 1 + k + 1, 0)).getUTCDate();
  const dt = new Date(Date.UTC(y, m - 1 + k, Math.min(d, last)));
  return dt.toISOString().slice(0, 10);
}

// מספר צ'ק הבא ברצף, עם שמירת אפסים מובילים: 0080000047 → 0080000048
export function nextCheckNumber(num, k) {
  if (!num) return '';
  const digits = String(num).replace(/\D/g, '');
  if (!digits) return '';
  const next = (BigInt(digits) + BigInt(k)).toString();
  return next.padStart(digits.length, '0');
}

// לוח תשלומים: סכום שווה לכל תשלום, התשלום האחרון סוגר את העיגול
export function buildSchedule({ totalAmount, count, firstDate, firstCheck = '' }) {
  const n = Math.max(1, parseInt(count, 10) || 1);
  const total = round2(parseFloat(totalAmount) || 0);
  const each = round2(Math.floor((total / n) * 100) / 100);
  return Array.from({ length: n }, (_, i) => ({
    n: i + 1,
    dueDate: addMonthsToDate(firstDate, i),
    amount: i === n - 1 ? round2(total - each * (n - 1)) : each,
    checkNumber: nextCheckNumber(firstCheck, i),
    status: 'pending',
    transactionId: null
  }));
}

export function buildPlan(data) {
  const installments = data.installments || buildSchedule(data);
  return {
    id: data.id || `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    direction: data.direction === 'receivable' ? 'receivable' : 'payable',
    counterparty: data.direction === 'receivable' ? { unitId: data.unitId || data.counterparty?.unitId } : { name: (data.vendorName || data.counterparty?.name || '').trim() },
    purpose: (data.purpose || '').trim(),
    totalAmount: round2(parseFloat(data.totalAmount) || installments.reduce((s, i) => s + i.amount, 0)),
    method: data.method || 'checks',
    category: data.category || '',
    debtMonths: data.debtMonths || [],
    status: data.status || 'active',
    notes: data.notes || '',
    createdAt: data.createdAt || nowISO().slice(0, 10),
    installments
  };
}

export function counterpartyText(plan, building) {
  if (plan.direction === 'payable') return plan.counterparty?.name || 'ספק';
  const unit = (building?.apartments || []).find(u => u.id === plan.counterparty?.unitId);
  return unit ? `${unitLabel(unit)}${unitDisplayName(unit) ? ` · ${unitDisplayName(unit)}` : ''}` : 'יחידה שנמחקה';
}

export function installmentState(inst, today) {
  if (inst.status !== 'pending') return inst.status;
  return daysBetween(inst.dueDate, today) > LATE_DAYS ? 'late' : 'pending';
}

export function planTotals(plan, today) {
  const live = plan.installments.filter(i => i.status !== 'cancelled');
  const paid = round2(live.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0));
  const remaining = round2(live.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0));
  const next = live.filter(i => i.status === 'pending').sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] || null;
  const late = live.filter(i => installmentState(i, today) === 'late');
  return { paid, remaining, paidCount: live.filter(i => i.status === 'paid').length, count: live.length, next, late };
}

// סה"כ התחייבויות / חובות בהסדר שנותרו בבניין
export function plansSummary(building, today) {
  const active = (building?.paymentPlans || []).filter(p => p.status === 'active');
  const sum = (dir) => round2(active.filter(p => p.direction === dir).reduce((s, p) => s + planTotals(p, today).remaining, 0));
  return { payable: sum('payable'), receivable: sum('receivable'), active };
}

// --------------------------------------------------------------------------
// התאמת תנועת בנק לתשלום בלוח (אפיון 07, סעיף 4)
// --------------------------------------------------------------------------
export function checkNumberIn(description) {
  const m = String(description || '').match(/ש[י]?ק\s*:?\s*(\d{4,})/);
  return m ? m[1] : '';
}

export function matchInstallment(building, row, { taken = new Set() } = {}) {
  const plans = (building?.paymentPlans || []).filter(p => p.status === 'active');
  const desc = normalizeText(row.description);
  const check = checkNumberIn(row.description);
  for (const plan of plans) {
    const wantDir = plan.direction === 'payable' ? 'out' : 'in';
    if (row.direction !== wantDir) continue;
    const names = plan.direction === 'payable'
      ? [plan.counterparty?.name].filter(Boolean)
      : parsePayerNames((building.apartments || []).find(u => u.id === plan.counterparty?.unitId)?.bankPayerNames);
    for (const inst of plan.installments) {
      const key = `${plan.id}#${inst.n}`;
      if (inst.status !== 'pending' || taken.has(key)) continue;
      const byCheck = check && inst.checkNumber && check.replace(/^0+/, '') === inst.checkNumber.replace(/^0+/, '');
      const near = Math.abs(daysBetween(inst.dueDate, row.date)) <= MATCH_DAYS && round2(inst.amount) === round2(row.amount);
      const byName = names.some(n => n && desc.includes(normalizeText(n)));
      const isCheckRow = !!check;
      if (byCheck || (near && (byName || (plan.method === 'checks' && isCheckRow)))) {
        return { planId: plan.id, n: inst.n, key, plan, inst, byCheck };
      }
    }
  }
  return null;
}

// תשלומים שכבר נקלטו ומתאימים ללוח של פריסה (פריסה רטרואקטיבית — סעיף 3.2)
export function findPastMatches(building, plan) {
  const linked = new Set((building?.paymentPlans || []).flatMap(p => p.installments.map(i => i.transactionId)).filter(Boolean));
  const shadow = { ...building, paymentPlans: [plan] };
  const taken = new Set();
  const out = [];
  activeTransactions(building)
    .filter(tx => tx.account === 'bank' && !linked.has(tx.id))
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(tx => {
      const m = matchInstallment(shadow, tx, { taken });
      if (m) { taken.add(m.key); out.push({ n: m.n, tx }); }
    });
  return out;
}

// --------------------------------------------------------------------------
// פעולות (טהורות: בניין → בניין)
// --------------------------------------------------------------------------
function withPlans(b, fn) {
  return { ...b, paymentPlans: fn(b.paymentPlans || []) };
}

function completeIfDone(plan) {
  const live = plan.installments.filter(i => i.status !== 'cancelled');
  if (plan.status === 'active' && live.length && live.every(i => i.status === 'paid')) return { ...plan, status: 'completed' };
  return plan;
}

// יצירת פריסה. בחייב לבניין: חודשי החוב עוברים מהדירה לפריסה ("בהסדר")
export function addPlan(b, data, { linkPast = true } = {}) {
  let plan = buildPlan(data);
  let next = b;
  if (plan.direction === 'receivable' && plan.debtMonths.length) {
    const moved = new Set(plan.debtMonths);
    next = { ...next, apartments: (next.apartments || []).map(u => (u.id === plan.counterparty.unitId ? { ...u, debtMonths: (u.debtMonths || []).filter(m => !moved.has(m)) } : u)) };
  }
  if (linkPast) {
    findPastMatches(next, plan).forEach(({ n, tx }) => {
      plan = { ...plan, installments: plan.installments.map(i => (i.n === n ? { ...i, status: 'paid', transactionId: tx.id, paidDate: tx.date } : i)) };
    });
    plan = completeIfDone(plan);
  }
  return withPlans(next, ps => [plan, ...ps]);
}

export function setInstallment(b, planId, n, changes) {
  return withPlans(b, ps => ps.map(p => (p.id !== planId ? p : completeIfDone({
    ...p,
    installments: p.installments.map(i => (i.n === n ? { ...i, ...changes } : i))
  }))));
}

// ביטול פריסה. בחייב לבניין: החודשים שלא נפרעו חוזרים להיות חוב רגיל
export function cancelPlan(b, planId) {
  const plan = (b.paymentPlans || []).find(p => p.id === planId);
  if (!plan) return b;
  let next = b;
  if (plan.direction === 'receivable' && plan.debtMonths.length) {
    const t = planTotals(plan, '9999-12-31');
    const paidShare = plan.totalAmount ? t.paid / plan.totalAmount : 0;
    const settled = Math.floor(plan.debtMonths.length * paidShare + 1e-9);
    const back = [...plan.debtMonths].sort().slice(settled);
    next = { ...next, apartments: (next.apartments || []).map(u => (u.id === plan.counterparty.unitId ? { ...u, debtMonths: Array.from(new Set([...(u.debtMonths || []), ...back])).sort() } : u)) };
  }
  return withPlans(next, ps => ps.map(p => (p.id === planId ? {
    ...p,
    status: 'cancelled',
    installments: p.installments.map(i => (i.status === 'pending' ? { ...i, status: 'cancelled' } : i))
  } : p)));
}

// חודשי החוב שנסגרו בהסדר לפי מה ששולם (הישנים קודם)
export function settledMonths(plan) {
  const t = planTotals(plan, '9999-12-31');
  const share = plan.totalAmount ? t.paid / plan.totalAmount : 0;
  const sorted = [...(plan.debtMonths || [])].sort();
  return sorted.slice(0, Math.floor(sorted.length * share + 1e-9));
}
