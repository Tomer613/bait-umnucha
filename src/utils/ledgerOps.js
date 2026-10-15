// ==========================================================================
// בית ומנוחה - פעולות על ספר התנועות של בניין (אפיון 04)
// פונקציות טהורות: מקבלות בניין ומחזירות בניין מעודכן. AppContext רק מפעיל אותן.
// כל שינוי נרשם ביומן השינויים, ושינוי בחודש סגור פותח אותו מחדש עם סיבה.
// ==========================================================================
import { monthOfDate, nowISO, round2, auditEntry, diffTx, isImported, MANAGER_ACCOUNT, MANAGER_TRANSFER_CATEGORY } from './ledger';
import { isMonthClosed, closeStepIn, reopenedRecord } from './monthClose';
import { addLevy, setLevyPayment } from './levies';
import { setInstallment } from './paymentPlans';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const withLog = (b, ...entries) => [...entries, ...(b.auditLog || [])];

// תנועה שנמחקה או שהקליטה שלה בוטלה — התשלום בפריסה חוזר ל"ממתין"
function unlinkInstallments(b, txIds) {
  const ids = new Set(txIds);
  if (!ids.size || !(b.paymentPlans || []).length) return b.paymentPlans;
  return (b.paymentPlans || []).map(p => ({
    ...p,
    status: p.status === 'completed' && p.installments.some(i => ids.has(i.transactionId)) ? 'active' : p.status,
    installments: p.installments.map(i => (ids.has(i.transactionId) ? { ...i, status: 'pending', transactionId: null, paidDate: null } : i))
  }));
}

// שינוי בחודש סגור פותח אותו מחדש, עם סיבה (סעיף 6.4)
export function reopenIfClosed(b, months, reason) {
  let monthClose = b.monthClose || {};
  const logs = [];
  Array.from(new Set(months)).filter(m => m && isMonthClosed(b, m)).forEach(m => {
    monthClose = { ...monthClose, [m]: reopenedRecord(monthClose[m]) };
    logs.push(auditEntry('month_reopen', { reason, note: m }));
  });
  return { monthClose, logs };
}

function newTx(fields) {
  const date = fields.date || new Date().toISOString().slice(0, 10);
  return {
    id: `tx-${uid()}`,
    fund: 'current',
    createdAt: nowISO(),
    ...fields,
    date,
    month: monthOfDate(date),
    amount: round2(Math.abs(parseFloat(fields.amount) || 0))
  };
}

function addTx(b, tx, reason, extra = {}) {
  const { monthClose, logs } = reopenIfClosed(b, [tx.month], reason);
  return {
    ...b,
    ...extra,
    monthClose,
    transactions: [tx, ...(b.transactions || [])],
    auditLog: withLog(b, ...logs, auditEntry('tx_add', { txId: tx.id, after: tx }))
  };
}

// הכנסה ידנית מדייר (מזומן) עם סגירת חודשי חוב
export function recordReceipt(b, { aptId, amount, paidMonths = [], notes = '', paymentType = 'מזומן', date = '', reason = '' }) {
  const payer = (b.apartments || []).find(apt => apt.id === aptId);
  const aptLabel = payer ? `דירה ${payer.aptNum} (${payer.tenantName})` : 'דייר';
  const tx = newTx({
    date,
    direction: 'in',
    amount,
    account: 'cash',
    category: 'הכנסה במזומן',
    description: `${aptLabel} שילם/ה ${paymentType === 'מזומן' ? 'במזומן' : paymentType} (חודשים: ${paidMonths.join(', ') || 'שוטף'})${notes ? ' - ' + notes : ''}`,
    source: 'manual',
    apartmentId: aptId,
    paidMonths
  });
  const apartments = (b.apartments || []).map(apt => apt.id !== aptId ? apt : { ...apt, debtMonths: (apt.debtMonths || []).filter(m => !paidMonths.includes(m)) });
  return addTx(b, tx, reason, { apartments });
}

// הוצאה ידנית במזומן
// paidBy: 'cash' (קופת מזומן) | 'manager' (המנהל שילם מכיסו — נרשם חוב של הבניין אליו, סעיף 7.5)
export function recordExpense(b, { category, amount, description, date = '', reason = '', paidBy = 'cash' }) {
  const tx = newTx({
    date,
    direction: 'out',
    amount,
    account: paidBy === 'manager' ? MANAGER_ACCOUNT : 'cash',
    category: category || 'תחזוקה שוטפת והוצאות חריגות',
    description: description || 'הוצאה ידנית במזומן',
    source: 'manual'
  });
  return addTx(b, tx, reason);
}

const pickChanged = (tx, changed) => Object.fromEntries(Object.keys(changed).map(k => [k, tx[k]]));

// עריכת תנועה. בתנועה מקובץ — סכום ותאריך נעולים (סעיף 6.1)
export function editTx(b, txId, changes, reason = '') {
  const before = (b.transactions || []).find(t => t.id === txId);
  if (!before || before.deletedAt) return b;
  const allowed = isImported(before)
    ? { category: changes.category, description: changes.description, apartmentId: changes.apartmentId }
    : changes;
  const clean = Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined));
  if (clean.amount !== undefined) clean.amount = round2(Math.abs(parseFloat(clean.amount) || 0));
  const after = { ...before, ...clean };
  after.month = monthOfDate(after.date);
  const changed = diffTx(before, after);
  if (Object.keys(changed).length === 0) return b;
  after.updatedAt = nowISO();
  const { monthClose, logs } = reopenIfClosed(b, [before.month, after.month], reason);
  return {
    ...b,
    monthClose,
    transactions: (b.transactions || []).map(t => (t.id === txId ? after : t)),
    auditLog: withLog(b, ...logs, auditEntry('tx_edit', { txId, before: pickChanged(before, changed), after: pickChanged(after, changed), reason }))
  };
}

// מחיקה רכה עם סיבה (סעיף 6.3)
export function deleteTx(b, txId, reason) {
  const tx = (b.transactions || []).find(t => t.id === txId);
  if (!tx || tx.deletedAt) return b;
  const { monthClose, logs } = reopenIfClosed(b, [tx.month], reason);
  return {
    ...b,
    monthClose,
    transactions: (b.transactions || []).map(t => (t.id === txId ? { ...t, deletedAt: nowISO(), deleteReason: reason } : t)),
    paymentPlans: unlinkInstallments(b, [txId]),
    auditLog: withLog(b, ...logs, auditEntry('tx_delete', { txId, before: tx, reason }))
  };
}

export function restoreTx(b, txId, reason = '') {
  const tx = (b.transactions || []).find(t => t.id === txId);
  if (!tx || !tx.deletedAt) return b;
  const { deletedAt: _d, deleteReason: _r, ...restored } = tx;
  const { monthClose, logs } = reopenIfClosed(b, [tx.month], reason || 'שחזור תנועה שנמחקה');
  return {
    ...b,
    monthClose,
    transactions: (b.transactions || []).map(t => (t.id === txId ? { ...restored, updatedAt: nowISO() } : t)),
    auditLog: withLog(b, ...logs, auditEntry('tx_restore', { txId, after: restored, reason }))
  };
}

// יתרת פתיחה (נערכת במסך ההגדרות בלבד)
export function setOpening(b, account, amount, date) {
  const before = b.openingBalance?.[account] || { amount: 0, date: null };
  const after = { amount: round2(parseFloat(amount) || 0), date: date || null };
  if (before.amount === after.amount && (before.date || null) === after.date) return b;
  return {
    ...b,
    openingBalance: { ...(b.openingBalance || {}), [account]: after },
    auditLog: withLog(b, auditEntry('opening_balance', { before, after, note: account }))
  };
}

// סימון / ביטול סימון של שלב בסגירת החודש
export function closeStep(b, month, stepId, value) {
  const wasClosed = isMonthClosed(b, month);
  const updated = { ...b, monthClose: closeStepIn(b.monthClose, month, stepId, value) };
  if (!wasClosed && isMonthClosed(updated, month)) {
    updated.auditLog = withLog(b, auditEntry('month_close', { note: month }));
  }
  return updated;
}

// פתיחת חודש סגור מחדש, עם סיבה
export function reopenMonth(b, month, reason = '') {
  return {
    ...b,
    monthClose: { ...(b.monthClose || {}), [month]: reopenedRecord(b.monthClose?.[month]) },
    auditLog: withLog(b, auditEntry('month_reopen', { reason, note: month }))
  };
}

// קליטת עו"ש לפי תוכנית שאושרה בתצוגה המקדימה (סעיף 5)
export function applyBankImport(b, plan, { batchId = `imp-${uid()}`, reason = '' } = {}) {
  const txs = plan.rows.filter(r => r.include).map((r, i) => ({
    id: `tx-${batchId}-${i}`,
    date: r.row.date,
    month: r.month,
    direction: r.row.direction,
    amount: r.row.amount,
    account: 'bank',
    category: r.category,
    description: r.row.description,
    reference: r.row.reference,
    bankBalance: r.row.hasBalance ? r.row.balance : null,
    source: 'bank_import',
    importBatchId: batchId,
    fingerprint: r.fingerprint,
    apartmentId: r.unitId || null,
    fund: 'current',
    createdAt: nowISO()
  }));
  // העברה למנהל שסוגרת הוצאות שהוא שילם: העברה בין חשבונות (בנק → חשבון מנהל), לא הוצאה נוספת
  plan.rows.filter(r => r.include && r.managerMode === 'settle').forEach(r => {
    const tx = txs.find(t => t.fingerprint === r.fingerprint && t.date === r.row.date);
    if (!tx) return;
    tx.transfer = true;
    tx.category = MANAGER_TRANSFER_CATEGORY;
    txs.push({ ...tx, id: `${tx.id}-m`, account: MANAGER_ACCOUNT, direction: 'in', fingerprint: null, reference: '', bankBalance: null });
  });
  const { monthClose: reopened, logs } = reopenIfClosed(b, txs.map(t => t.month), reason);
  let monthClose = reopened;
  const allMonths = Array.from(new Set(plan.rows.map(r => r.month))).sort();
  allMonths.forEach(m => {
    const n = txs.filter(t => t.month === m).length;
    monthClose = closeStepIn(monthClose, m, 'bank', { done: true, auto: true, note: n ? `${n} תנועות נקלטו מהקובץ` : 'הקובץ נקלט, אין תנועות חדשות' });
  });
  // תשלומים בפריסות חוב שזוהו — מסומנים כשולמו ומקושרים לתנועה
  let plansB = { ...b };
  plan.rows.filter(r => r.include && r.planMatch).forEach(r => {
    const tx = txs.find(t => t.fingerprint === r.fingerprint && t.date === r.row.date);
    plansB = setInstallment(plansB, r.planMatch.planId, r.planMatch.n, { status: 'paid', transactionId: tx?.id || null, paidDate: r.row.date });
  });
  const batch = {
    id: batchId,
    type: 'bank',
    fileName: plan.fileName,
    fileHash: plan.fileHash,
    at: nowISO(),
    count: txs.length,
    months: allMonths,
    endDate: plan.endDate,
    bankEndBalance: plan.bankEndBalance
  };
  return {
    ...b,
    paymentPlans: plansB.paymentPlans,
    monthClose,
    transactions: [...txs, ...(b.transactions || [])],
    importBatches: [batch, ...(b.importBatches || [])],
    auditLog: withLog(b, ...logs, auditEntry('import', { note: `עו״ש · ${txs.length} תנועות`, after: { fileName: plan.fileName } }))
  };
}

// קליטת חיובית: הקובץ לא משנה את היתרה — הכסף נספר כשההפקדה מופיעה בעו"ש (אפיון 04, סעיף 7.2).
// הקובץ כן מעדכן: שיוך לקוחות ליחידות, חודשי חוב (חיוב דמי ועד שנכשל), ותשלומי גביות מיוחדות (אפיון 05).
// decisions: { [groupKey]: { action: 'levy', levyId } | { action: 'dues' } | { action: 'later' } }
export function applyHiyuvitImport(b, plan, { batchId = `imp-${uid()}`, classification = null, decisions = {}, newLevies = [] } = {}) {
  let monthClose = b.monthClose || {};
  const net = `${(plan.totals.net || 0).toLocaleString('he-IL', { maximumFractionDigits: 2 })} ₪`;
  plan.months.forEach(m => {
    monthClose = closeStepIn(monthClose, m, 'hiyuvit', { done: true, auto: true, note: `${plan.counts.success} גביות · נטו ${net}` });
  });

  let next = { ...b, monthClose };
  newLevies.forEach(data => { next = addLevy(next, data); });

  const pending = [];
  if (classification) {
    // שיוך לקוחות ליחידות (נשמר ביחידה — מהקליטה הבאה הזיהוי אוטומטי)
    const assign = {};
    classification.clients.forEach(c => { if (c.clientNumber && c.unitId && !c.savedUnitId) assign[c.unitId] = c.clientNumber; });
    next = { ...next, apartments: (next.apartments || []).map(u => (assign[u.id] ? { ...u, hiyuvitClientNumber: assign[u.id] } : u)) };

    const duesItems = [...classification.dues];
    const levyItems = classification.levyItems.map(i => ({ ...i }));
    [...classification.suspectedGroups, ...classification.otherGroups].forEach(g => {
      const d = decisions[g.key] || { action: 'later' };
      g.items.forEach(i => {
        if (!i.unitId || d.action === 'later') pending.push({ ...i, groupKey: g.key });
        else if (d.action === 'dues') duesItems.push(i);
        else if (d.action === 'levy') levyItems.push({ ...i, levyId: d.levyId });
      });
    });

    // דמי ועד: חיוב שנכשל → החודש נכנס לחוב; חיוב שהצליח → החודש יוצא מהחוב
    next = {
      ...next,
      apartments: (next.apartments || []).map(u => {
        const mine = duesItems.filter(i => i.unitId === u.id);
        if (!mine.length) return u;
        const debt = new Set(u.debtMonths || []);
        mine.forEach(i => { if (i.status === 'failed') debt.add(i.month); });
        mine.forEach(i => { if (i.status === 'paid') debt.delete(i.month); });
        return { ...u, debtMonths: Array.from(debt).sort() };
      })
    };

    // גביות מיוחדות: יחידה שלא הייתה ברשימת המשתתפים מתווספת אליה
    levyItems.forEach(i => {
      next = {
        ...next,
        specialLevies: (next.specialLevies || []).map(l => (l.id === i.levyId && !(l.participantIds || []).includes(i.unitId)
          ? { ...l, participantIds: [...(l.participantIds || []), i.unitId] } : l))
      };
      next = setLevyPayment(next, i.levyId, i.unitId, i.month, i.status, 'hiyuvit');
    });
    const confirmed = new Set(levyItems.map(i => i.levyId));
    next = { ...next, specialLevies: (next.specialLevies || []).map(l => (confirmed.has(l.id) && !l.confirmedAt ? { ...l, confirmedAt: nowISO() } : l)) };
  }

  const fresh = new Set(plan.freshRowIds);
  const batch = {
    id: batchId,
    type: 'hiyuvit',
    fileName: plan.fileName,
    fileHash: plan.fileHash,
    at: nowISO(),
    count: plan.freshRowIds.length,
    months: plan.months,
    rowIds: plan.freshRowIds,
    totals: plan.totals,
    counts: plan.counts,
    failedTenants: plan.failedTenants,
    lastDate: plan.lastDate,
    rows: plan.rows.filter(r => fresh.has(r.id)),
    pending: pending.map(i => ({ rowId: i.row.id, name: i.row.name, clientNumber: i.row.clientNumber, unitId: i.unitId, amount: i.amount, month: i.month, status: i.status, groupKey: i.groupKey }))
  };
  return {
    ...next,
    importBatches: [batch, ...(next.importBatches || [])],
    auditLog: withLog(next, auditEntry('import', { note: `חיובית · ${plan.counts.success} גביות${pending.length ? ` · ${pending.length} ממתינים לשיוך` : ''}`, after: { fileName: plan.fileName } }))
  };
}

// שיוך חיובים שנשארו "ממתינים לשיוך" מקליטת חיובית (אפיון 05, סעיף 4.3)
// action: 'levy' (עם levyId) | 'dues' | 'dismiss'
export function resolvePending(b, batchId, groupKey, { action, levyId } = {}) {
  const batch = (b.importBatches || []).find(bt => bt.id === batchId);
  if (!batch) return b;
  const items = (batch.pending || []).filter(p => p.groupKey === groupKey);
  let next = b;
  if (action === 'dues') {
    next = {
      ...next,
      apartments: (next.apartments || []).map(u => {
        const mine = items.filter(i => i.unitId === u.id);
        if (!mine.length) return u;
        const debt = new Set(u.debtMonths || []);
        mine.forEach(i => (i.status === 'failed' ? debt.add(i.month) : debt.delete(i.month)));
        return { ...u, debtMonths: Array.from(debt).sort() };
      })
    };
  }
  if (action === 'levy' && levyId) {
    items.filter(i => i.unitId).forEach(i => {
      next = {
        ...next,
        specialLevies: (next.specialLevies || []).map(l => (l.id === levyId && !(l.participantIds || []).includes(i.unitId)
          ? { ...l, participantIds: [...(l.participantIds || []), i.unitId] } : l))
      };
      next = setLevyPayment(next, levyId, i.unitId, i.month, i.status, 'hiyuvit');
    });
  }
  return {
    ...next,
    importBatches: (next.importBatches || []).map(bt => (bt.id === batchId ? { ...bt, pending: (bt.pending || []).filter(p => p.groupKey !== groupKey) } : bt))
  };
}

// ביטול קליטה: מסיר את כל התנועות של האצווה (אפשר לקלוט מחדש את הקובץ הנכון)
export function undoBatch(b, batchId, reason = '') {
  const batch = (b.importBatches || []).find(bt => bt.id === batchId);
  if (!batch || batch.undoneAt) return b;
  const removed = (b.transactions || []).filter(t => t.importBatchId === batchId);
  const { monthClose, logs } = reopenIfClosed(b, removed.map(t => t.month), reason);
  return {
    ...b,
    monthClose,
    transactions: (b.transactions || []).filter(t => t.importBatchId !== batchId),
    paymentPlans: unlinkInstallments(b, removed.map(t => t.id)),
    importBatches: (b.importBatches || []).map(bt => (bt.id === batchId ? { ...bt, undoneAt: nowISO(), undoReason: reason } : bt)),
    auditLog: withLog(b, ...logs, auditEntry('import_undo', { reason, note: `${removed.length} תנועות הוסרו`, after: { fileName: batch.fileName } }))
  };
}

// יומן דוחות שהופקו (סעיף 6.6) — נשמרים רק הסכומים העיקריים
export function addReportLog(b, entry) {
  return {
    ...b,
    reportLog: [{ id: `rep-${uid()}`, at: nowISO(), ...entry }, ...(b.reportLog || [])].slice(0, 200)
  };
}
