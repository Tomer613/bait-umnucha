// ==========================================================================
// בית ומנוחה - ספר תנועות אחיד (אפיון 04)
// כל שקל שנכנס או יצא הוא תנועה. היתרה מחושבת תמיד מהתנועות — לא נשמרת בנפרד.
//
// מבנה תנועה:
// { id, date: 'YYYY-MM-DD', month: 'YYYY-MM' (נגזר מהתאריך), direction: 'in' | 'out',
//   amount (תמיד חיובי), account: 'bank' | 'cash', category, description,
//   source: 'bank_import' | 'hiyuvit_import' | 'manual' | 'recurring',
//   importBatchId, fingerprint, reference, bankBalance, apartmentId, fund: 'current',
//   createdAt, updatedAt, deletedAt, deleteReason }
// ==========================================================================

export const ACCOUNTS = { bank: 'בנק', cash: 'מזומן' };
// "חשבון מנהל" (סעיף 7.5): הוצאות שהמנהל שילם מכיסו — הבניין חייב לו. לא חלק מיתרת הקופה.
export const MANAGER_ACCOUNT = 'manager';
export const MANAGER_TRANSFER_CATEGORY = 'העברה למנהל (החזר הוצאות)';
export const MANAGER_UNDETAILED_CATEGORY = 'החזר הוצאות למנהל (ללא פירוט)';

export const SOURCE_LABELS = {
  bank_import: 'בנק',
  hiyuvit_import: 'חיובית',
  manual: 'ידני',
  recurring: 'קבוע'
};

export function nowISO() {
  return new Date().toISOString();
}

export function monthOfDate(dateISO) {
  return (dateISO || '').slice(0, 7);
}

// תנועה פעילה = לא נמחקה
export function isActive(tx) {
  return !tx.deletedAt;
}

export function activeTransactions(building) {
  return (building?.transactions || []).filter(isActive);
}

// סכום עם סימן: הכנסה חיובית, הוצאה שלילית
export function signedAmount(tx) {
  return tx.direction === 'in' ? tx.amount : -tx.amount;
}

// יתרה מחושבת: יתרת פתיחה + כל התנועות הפעילות (עד תאריך מסוים, אם נתבקש)
export function computeBalance(building, { account = null, asOf = null } = {}) {
  const opening = building?.openingBalance || {};
  const accounts = account ? [account] : Object.keys(ACCOUNTS);
  let total = 0;
  accounts.forEach(acc => {
    const ob = opening[acc];
    if (ob && (!asOf || !ob.date || ob.date <= asOf)) total += ob.amount || 0;
  });
  activeTransactions(building).forEach(tx => {
    if (account ? tx.account !== account : !ACCOUNTS[tx.account]) return;
    if (asOf && tx.date > asOf) return;
    total += signedAmount(tx);
  });
  return round2(total);
}

// כמה הבניין חייב למנהל (הוצאות ששילם מכיסו ועוד לא הוחזרו)
export function managerOwed(building) {
  return round2(-computeBalance(building, { account: MANAGER_ACCOUNT }));
}

export function buildingBalance(building) {
  return computeBalance(building);
}

export function round2(n) {
  return Math.round((n || 0) * 100) / 100;
}

// הכנסות / הוצאות של רשימת תנועות
export function splitInOut(transactions) {
  let income = 0;
  let expenses = 0;
  (transactions || []).forEach(tx => {
    if (!isActive(tx) || tx.transfer) return;
    if (tx.direction === 'in') income += tx.amount;
    else if (tx.direction === 'out') expenses += tx.amount;
  });
  return { income: round2(income), expenses: round2(expenses) };
}

export function transactionsOfMonth(building, month) {
  return activeTransactions(building).filter(tx => tx.month === month);
}

// סך הוצאות לפי קטגוריה וחודש (לדוח ההוצאות השנתי)
export function expenseSum(building, { month, category }) {
  return round2(activeTransactions(building)
    .filter(tx => tx.direction === 'out' && !tx.transfer && tx.month === month && tx.category === category)
    .reduce((s, tx) => s + tx.amount, 0));
}

// --------------------------------------------------------------------------
// טביעת אצבע לזיהוי כפילויות בקליטה (סעיף 5.2)
// --------------------------------------------------------------------------
export function normalizeText(s) {
  return String(s || '').replace(/["'״׳]/g, '').replace(/\s+/g, ' ').trim();
}

export function txFingerprint({ date, direction, amount, reference, description }) {
  return [date, direction, round2(amount).toFixed(2), normalizeText(reference), normalizeText(description)].join('|');
}

// --------------------------------------------------------------------------
// מעבר מהמבנה הישן (building.expenses + currentBalance) לספר התנועות
// --------------------------------------------------------------------------
const LEGACY_SOURCE = { 'בנק': 'bank_import', 'חיובית': 'hiyuvit_import', 'מזומן': 'manual', 'העברה': 'manual', 'קבוע': 'recurring' };

export function legacyExpenseToTx(e) {
  const isIncome = (e.amount || 0) < 0;
  const source = LEGACY_SOURCE[e.source] || 'bank_import';
  const date = toISODate(e.date) || (e.month ? `${e.month}-01` : '');
  return {
    id: e.id,
    date,
    month: monthOfDate(date) || e.month || '',
    direction: isIncome ? 'in' : 'out',
    amount: round2(Math.abs(e.amount || 0)),
    account: source === 'manual' ? 'cash' : 'bank',
    category: e.category || '',
    description: e.description || '',
    source,
    fund: 'current',
    createdAt: date ? `${date}T00:00:00.000Z` : nowISO(),
    legacy: true
  };
}

// היתרה הנוכחית נחשבת נכונה ביום המעבר: יתרת פתיחה = יתרה − סך התנועות הקיימות (סעיף 4.2)
export function migrateBuildingLedger(b) {
  if (Array.isArray(b.transactions)) return b;
  const transactions = (b.expenses || []).map(legacyExpenseToTx);
  const sum = transactions.reduce((s, tx) => s + signedAmount(tx), 0);
  const earliest = transactions.map(tx => tx.date).filter(Boolean).sort()[0] || null;
  const { expenses: _e, currentBalance, ...rest } = b;
  return {
    ...rest,
    transactions,
    openingBalance: {
      bank: { amount: round2((currentBalance || 0) - sum), date: earliest ? dayBefore(earliest) : null },
      cash: { amount: 0, date: null }
    },
    migration: { at: nowISO(), balanceBefore: round2(currentBalance || 0) },
    importBatches: b.importBatches || [],
    auditLog: b.auditLog || [],
    reportLog: b.reportLog || []
  };
}

export function dayBefore(dateISO) {
  const d = new Date(`${dateISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// --------------------------------------------------------------------------
// תאריכים: '22/09/26', '25/09/2026', '2026-09-22' → '2026-09-22'
// --------------------------------------------------------------------------
export function toISODate(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    let year = m[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return '';
}

export function formatDateIL(dateISO) {
  if (!dateISO) return '';
  const [y, m, d] = dateISO.split('-');
  return `${d}.${m}.${y}`;
}

// --------------------------------------------------------------------------
// יומן שינויים (סעיף 9)
// --------------------------------------------------------------------------
export function auditEntry(action, { txId = null, before = null, after = null, reason = '', note = '' } = {}) {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: nowISO(),
    by: 'המנהל',
    action,
    txId,
    before,
    after,
    reason,
    note
  };
}

export const AUDIT_LABELS = {
  tx_add: 'הוספת תנועה',
  tx_edit: 'עריכת תנועה',
  tx_delete: 'מחיקת תנועה',
  tx_restore: 'שחזור תנועה',
  import: 'קליטת קובץ',
  import_undo: 'ביטול קליטה',
  month_close: 'סגירת חודש',
  month_reopen: 'פתיחת חודש מחדש',
  opening_balance: 'שינוי יתרת פתיחה'
};

// השדות שמוצגים ב"לפני ← אחרי"
export const TX_FIELD_LABELS = {
  amount: 'סכום',
  date: 'תאריך',
  category: 'קטגוריה',
  description: 'תיאור',
  direction: 'כיוון',
  apartmentId: 'דירה'
};

export function diffTx(before, after) {
  const changes = {};
  Object.keys(TX_FIELD_LABELS).forEach(k => {
    if ((before?.[k] ?? '') !== (after?.[k] ?? '')) changes[k] = { from: before?.[k] ?? '', to: after?.[k] ?? '' };
  });
  return changes;
}

// תנועה שהגיעה מקובץ: סכום ותאריך נעולים לעריכה (סעיף 6.1)
export function isImported(tx) {
  return tx?.source === 'bank_import' || tx?.source === 'hiyuvit_import';
}
