// ==========================================================================
// בית ומנוחה - תכנון קליטת קובץ לפני שמירה (אפיון 04, סעיף 5)
// שום דבר לא נשמר כאן: נבנית "תוכנית" שמוצגת למנהל בתצוגה המקדימה, והוא מאשר.
// ==========================================================================
import { txFingerprint, computeBalance, monthOfDate, round2, signedAmount, managerOwed, normalizeText, MANAGER_UNDETAILED_CATEGORY } from './ledger';
import { isMonthClosed } from './monthClose';
import { matchUnitByPayer, unitLabel, unitDisplayName } from './units';
import { matchInstallment, counterpartyText, RECEIVABLE_CATEGORY } from './paymentPlans';

export const HIYUVIT_INCOME_CATEGORY = 'גבייה מחיובית';
export const DIRECT_INCOME_CATEGORY = 'הכנסה / העברה ישירה';
export const INCOME_CATEGORIES = [HIYUVIT_INCOME_CATEGORY, DIRECT_INCOME_CATEGORY, RECEIVABLE_CATEGORY, 'הכנסות אחרות'];

// כללי סיווג ברירת מחדל — נטענים להגדרות בפעם הראשונה ונערכים רק שם
export const DEFAULT_CATEGORY_RULES = [
  { id: 'r-elec', contains: 'חשמל', category: 'חשבון חשמל' },
  { id: 'r-lift1', contains: 'שינדלר', category: 'ביטוח מעליות' },
  { id: 'r-lift2', contains: 'ישראליפט', category: 'ביטוח מעליות' },
  { id: 'r-lift3', contains: 'אוטיס', category: 'ביטוח מעליות' },
  { id: 'r-eng', contains: 'מהנדס', category: 'מהנדס מעליות' },
  { id: 'r-clean1', contains: 'ניקיון', category: 'ניקיון' },
  { id: 'r-clean2', contains: 'נקיון', category: 'ניקיון' },
  { id: 'r-scent', contains: 'ריח', category: 'מפיץ ריח' },
  { id: 'r-fee1', contains: 'עמלת', category: 'עמלות סליקה' },
  { id: 'r-garden', contains: 'גינון', category: 'הוצאות גינון' },
  { id: 'r-mgmt', contains: 'ניהול', category: 'דמי ניהול' }
];

// שמות שבהם מופיעה הפקדת חיובית בעו"ש (משתנה בין בניינים — סעיף 7.4)
export const DEFAULT_HIYUVIT_DEPOSIT_NAMES = ['חיובית', 'אוקס פינטק'];

const FALLBACK_EXPENSE_CATEGORY = 'תחזוקה שוטפת והוצאות חריגות';

export function suggestCategory(row, { rules = [], depositNames = [] } = {}) {
  const desc = row.description || '';
  if (row.direction === 'in') {
    if (depositNames.some(n => n && desc.includes(n))) return { category: HIYUVIT_INCOME_CATEGORY, ruleName: 'הפקדת חיובית' };
    return { category: DIRECT_INCOME_CATEGORY, ruleName: null };
  }
  const rule = rules.find(r => r.contains && desc.includes(r.contains) && (!r.direction || r.direction === 'out'));
  if (rule) return { category: rule.category, ruleName: `"${rule.contains}" ← ${rule.category}` };
  return { category: FALLBACK_EXPENSE_CATEGORY, ruleName: null };
}

/**
 * תוכנית קליטה לדו"ח עו"ש.
 * rows: שורות מ-parseBankReport (בסדר כרונולוגי)
 */
export function planBankImport(building, rows, { fileName = '', fileHash = '', rules = [], depositNames = [], managerNames = [] } = {}) {
  const existing = building.transactions || [];
  const batches = building.importBatches || [];
  const sameFile = batches.find(bt => bt.fileHash === fileHash && !bt.undoneAt) || null;

  // ספירת מופעים: אם בקובץ 2 מופעים זהים ובמערכת 1 — נקלט אחד
  const seen = {};
  existing.filter(tx => tx.account === 'bank').forEach(tx => {
    const fp = tx.fingerprint || txFingerprint(tx);
    seen[fp] = (seen[fp] || 0) + 1;
  });

  const taken = new Set();
  let owed = managerOwed(building); // הוצאות של המנהל שעוד לא הוחזרו — נסגרות לפי הסדר
  const planRows = rows.map((row, i) => {
    const fp = txFingerprint(row);
    const isDuplicate = (seen[fp] || 0) > 0;
    if (isDuplicate) seen[fp] -= 1;
    let { category, ruleName } = suggestCategory(row, { rules, depositNames });
    // תשלום בפריסת חוב (אפיון 07, סעיף 4)
    const m = isDuplicate ? null : matchInstallment(building, row, { taken });
    let planMatch = null;
    if (m) {
      taken.add(m.key);
      planMatch = { planId: m.planId, n: m.n, text: `פריסת ${counterpartyText(m.plan, building)} · תשלום ${m.n} מתוך ${m.plan.installments.length}` };
      category = m.plan.direction === 'payable' ? (m.plan.category || category) : RECEIVABLE_CATEGORY;
      ruleName = null;
    }
    // העברה מדייר או מעסק: שיוך ליחידה לפי "שם המעביר בבנק" (אפיון 06, סעיף 3)
    const unit = row.direction === 'in' ? matchUnitByPayer(building, row.description) : null;
    // העברה למנהל (סעיף 7.5): סוגרת הוצאות שהוא שילם מכיסו; בלי הוצאות פתוחות — נרשמת כהוצאה ללא פירוט
    let managerMode = null;
    if (!isDuplicate && !planMatch && row.direction === 'out' && managerNames.some(n => n && normalizeText(row.description).includes(normalizeText(n)))) {
      managerMode = owed >= row.amount - 0.005 ? 'settle' : 'expense';
      if (managerMode === 'settle') owed = round2(owed - row.amount);
      else category = MANAGER_UNDETAILED_CATEGORY;
      ruleName = null;
    }
    return {
      managerMode,
      planMatch,
      unitId: unit?.id || (m && m.plan.direction === 'receivable' ? m.plan.counterparty.unitId : null),
      unitText: unit ? `${unitLabel(unit)}${unitDisplayName(unit) ? ` · ${unitDisplayName(unit)}` : ''}` : '',
      key: `r${i}`,
      row,
      fingerprint: fp,
      status: isDuplicate ? 'duplicate' : 'new',
      include: !isDuplicate,
      category,
      ruleName,
      month: monthOfDate(row.date)
    };
  });

  // בדיקת רצף היתרות בקובץ עצמו: יתרה קודמת + סכום = יתרה (מגלה שורה חסרה)
  let chainBreaks = 0;
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].hasBalance || !rows[i - 1].hasBalance) continue;
    const expected = round2(rows[i - 1].balance + (rows[i].direction === 'in' ? rows[i].amount : -rows[i].amount));
    if (Math.abs(expected - rows[i].balance) > 0.009) chainBreaks += 1;
  }

  const last = rows[rows.length - 1] || null;
  return {
    type: 'bank',
    fileName,
    fileHash,
    sameFile,
    rows: planRows,
    chainBreaks,
    endDate: last?.date || null,
    bankEndBalance: last?.hasBalance ? last.balance : null
  };
}

// סיכום התוכנית לפי מצב הבחירה הנוכחי (משתנה כשהמנהל מסמן / מבטל שורות)
export function summarizeBankPlan(building, plan) {
  const included = plan.rows.filter(r => r.include);
  const months = Array.from(new Set(included.map(r => r.month))).sort();
  const closedMonths = months.filter(m => isMonthClosed(building, m));
  const duplicates = plan.rows.filter(r => r.status === 'duplicate').length;
  const allMonths = Array.from(new Set(plan.rows.map(r => r.month))).sort();

  let reconciliation = null;
  if (plan.bankEndBalance !== null && plan.endDate) {
    const before = computeBalance(building, { account: 'bank', asOf: plan.endDate });
    const added = included
      .filter(r => r.row.date <= plan.endDate)
      .reduce((s, r) => s + signedAmount(r.row), 0);
    const computed = round2(before + added);
    const diff = round2(plan.bankEndBalance - computed);
    reconciliation = { bank: plan.bankEndBalance, computed, diff, matches: Math.abs(diff) < 0.01, date: plan.endDate };
  }

  return {
    includedCount: included.length,
    newCount: plan.rows.filter(r => r.status === 'new').length,
    duplicates,
    months,
    allMonths,
    closedMonths,
    reconciliation
  };
}

/**
 * תוכנית קליטה לקובץ חיובית.
 * לפי המנהל (15.10.2026): חיובית מעבירה את כל הגבייה לבנק — ולכן הקובץ לא משנה את היתרה.
 * הכסף נספר כשההפקדה מופיעה בעו"ש. הקובץ משמש לפירוט: מי שילם, מי נכשל, ועמלות.
 */
export function planHiyuvitImport(building, rows, { fileName = '', fileHash = '' } = {}) {
  const batches = building.importBatches || [];
  const sameFile = batches.find(bt => bt.fileHash === fileHash && !bt.undoneAt) || null;
  const knownRowIds = new Set(batches.filter(bt => bt.type === 'hiyuvit' && !bt.undoneAt).flatMap(bt => bt.rowIds || []));

  const codes = Array.from(new Set(rows.map(r => r.buildingNum).filter(Boolean)));
  const codeMismatch = building.hiyuvitCode && codes.length > 0 && !codes.includes(String(building.hiyuvitCode));

  const fresh = rows.filter(r => !knownRowIds.has(r.id));
  const success = fresh.filter(r => r.isSuccess);
  const failed = fresh.filter(r => r.isFailed);
  const returnFees = fresh.filter(r => r.isReturnFee);
  const gross = round2(success.reduce((s, r) => s + r.amount, 0));
  const fees = round2(fresh.reduce((s, r) => s + r.fee, 0));
  const net = round2(fresh.reduce((s, r) => s + r.net, 0));
  const months = Array.from(new Set(fresh.map(r => monthOfDate(r.date)).filter(Boolean))).sort();

  // דיירים שהחיוב שלהם נכשל (לפי מספר לקוח)
  const failedByClient = {};
  failed.forEach(r => {
    const k = r.clientNumber || r.name;
    if (!failedByClient[k]) failedByClient[k] = { name: r.name, clientNumber: r.clientNumber, amounts: [] };
    failedByClient[k].amounts.push(r.failedAmount);
  });

  return {
    type: 'hiyuvit',
    fileName,
    fileHash,
    sameFile,
    codes,
    codeMismatch,
    rows,
    freshRowIds: fresh.map(r => r.id),
    duplicates: rows.length - fresh.length,
    months,
    counts: { success: success.length, failed: failed.length, returnFees: returnFees.length, clients: new Set(success.map(r => r.clientNumber)).size },
    failedTenants: Object.values(failedByClient),
    totals: { gross, fees, net, returnFees: round2(returnFees.reduce((s, r) => s + r.fee, 0)) },
    lastDate: fresh.map(r => r.date).sort().pop() || null
  };
}
