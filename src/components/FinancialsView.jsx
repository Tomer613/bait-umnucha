// ==========================================================================
// בית ומנוחה - כספים: סגירת חודש (בנק, חיובית, הכנסות והוצאות במזומן), יומן תנועות וגביות מיוחדות
// כל הכספים יושבים בספר תנועות אחד, והיתרה מחושבת ממנו (אפיון 04)
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseBankReport, parseHiyuvitReport, hashText } from '../utils/csvParser';
import { OTHER_CATEGORY } from '../data/initialData';
import {
  UploadCloud,
  CreditCard,
  PlusCircle,
  MinusCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wrench,
  CheckCircle2,
  ChevronLeft,
  CalendarCheck,
  Check,
  FileUp,
  ScrollText,
  Pencil,
  Scale,
  AlertTriangle,
  CalendarClock
} from 'lucide-react';
import { PageHeader, Kpi, SubTabs, Segmented, Modal, Field, EmptyState, BuildingName, FlashMessage, useFlash } from './ui';
import SpecialLevies from './SpecialLevies';
import PaymentPlans from './PaymentPlans';
import ImportPreviewModal from './finance/ImportPreviewModal';
import TransactionModal from './finance/TransactionModal';
import ReasonModal from './finance/ReasonModal';
import { ImportHistory, AuditLog } from './finance/FinanceLogs';
import { CLOSE_STEPS, getMonthClose, closeStatus, isMonthClosed, missingSteps } from '../utils/monthClose';
import { formatILS, formatMonth, monthName, splitInOut, sumBy, withBuilding, todayISO, aptDebt, requestBuildingPick } from '../utils/format';
import { computeBalance, buildingBalance, formatDateIL, SOURCE_LABELS, round2, managerOwed, MANAGER_ACCOUNT } from '../utils/ledger';
import { planBankImport, planHiyuvitImport } from '../utils/importPlan';
import { unitLabel, unitDisplayName } from '../utils/units';

const STEP_ICONS = { bank: UploadCloud, hiyuvit: CreditCard, receipts: PlusCircle, expenses: MinusCircle };

const SOURCE_BADGE = {
  bank_import: 'badge-petrol',
  hiyuvit_import: 'badge-gold',
  manual: 'badge-success',
  recurring: 'badge-neutral'
};

// תאריך ברירת מחדל להזנה ידנית: היום, אם הוא בחודש שעובדים עליו; אחרת היום הראשון של החודש
function defaultDateFor(month) {
  const today = todayISO();
  return today.startsWith(month) ? today : `${month}-01`;
}

export default function FinancialsView() {
  const { activeSubTab, setActiveSubTab, currentMonth, currentBuilding } = useApp();
  const [flash, showFlash] = useFlash();
  const subTab = activeSubTab || 'transactions';

  const tabs = [
    { id: 'transactions', label: 'סגירת חודש ותנועות', icon: Receipt },
    { id: 'levies', label: 'גביות מיוחדות', icon: Wrench },
    { id: 'plans', label: 'פריסות חוב', icon: CalendarClock }
  ];
  if (currentBuilding) {
    tabs.push(
      { id: 'imports', label: 'היסטוריית קליטות', icon: FileUp },
      { id: 'audit', label: 'יומן שינויים', icon: ScrollText }
    );
  }
  const shown = !currentBuilding && (subTab === 'imports' || subTab === 'audit') ? 'transactions' : subTab;

  return (
    <div className="page">
      <PageHeader title="כספים" subtitle={formatMonth(currentMonth)} />
      <SubTabs active={shown} onChange={setActiveSubTab} tabs={tabs} />
      <FlashMessage flash={flash} />
      {shown === 'levies' && <SpecialLevies />}
      {shown === 'plans' && <PaymentPlans showFlash={showFlash} />}
      {shown === 'transactions' && <Transactions showFlash={showFlash} />}
      {shown === 'imports' && <div className="card"><ImportHistory building={currentBuilding} onFlash={showFlash} /></div>}
      {shown === 'audit' && <div className="card"><AuditLog building={currentBuilding} /></div>}
    </div>
  );
}

function Transactions({ showFlash }) {
  const {
    currentBuilding,
    buildings,
    setSelectedBuildingId,
    setActiveTab,
    recordManualReceipt,
    recordCashExpense,
    currentMonth,
    expenseCategories,
    systemSettings,
    setCloseStep,
    reopenMonth
  } = useApp();

  const isGlobalMode = !currentBuilding;
  const targetBuilding = currentBuilding;

  const [sourceFilter, setSourceFilter] = useState('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [importPlan, setImportPlan] = useState(null);
  const [editTx, setEditTx] = useState(null);
  const [reopenOpen, setReopenOpen] = useState(false);

  // --- הכנסה במזומן ---
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptAptId, setReceiptAptId] = useState('');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiptDate, setReceiptDate] = useState(() => defaultDateFor(currentMonth));
  const [selectedPaidMonths, setSelectedPaidMonths] = useState([]);

  // --- הוצאה במזומן ---
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState('תחזוקה שוטפת והוצאות חריגות');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expDate, setExpDate] = useState(() => defaultDateFor(currentMonth));
  const [manualReason, setManualReason] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('cash'); // cash | manager

  // ------------------------------------------------------------------------
  // נתונים
  // ------------------------------------------------------------------------
  const scopeBuildings = currentBuilding ? [currentBuilding] : buildings;
  const allMonthTx = scopeBuildings
    .flatMap(b => withBuilding(b, b.transactions))
    .filter(tx => tx.month === currentMonth)
    // צד חשבון המנהל בהעברה אליו לא מוצג בנפרד — מוצגת שורת הבנק בלבד
    .filter(tx => !(tx.account === MANAGER_ACCOUNT && tx.transfer))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const monthTransactions = allMonthTx.filter(tx => !tx.deletedAt);
  const deletedCount = allMonthTx.length - monthTransactions.length;

  const { income, expenses } = splitInOut(monthTransactions);
  const balance = sumBy(scopeBuildings, buildingBalance);

  const sources = Array.from(new Set(monthTransactions.map(tx => tx.source)));
  const listed = showDeleted ? allMonthTx : monthTransactions;
  const visibleTransactions = sourceFilter === 'all' ? listed : listed.filter(tx => tx.source === sourceFilter);

  const selectedApt = (targetBuilding?.apartments || []).find(a => a.id === receiptAptId);

  // סגירת חודש
  const closeRec = currentBuilding ? getMonthClose(currentBuilding, currentMonth) : {};
  const status = currentBuilding ? closeStatus(currentBuilding, currentMonth) : null;
  const openBuildings = buildings.filter(b => !isMonthClosed(b, currentMonth));
  const closedCount = buildings.length - openBuildings.length;
  const manualOf = (dir) => monthTransactions.filter(tx => tx.buildingId === currentBuilding?.id && tx.source === 'manual' && tx.account !== 'bank' && tx.direction === dir);
  const receiptsThisMonth = manualOf('in');
  const cashOutThisMonth = manualOf('out');

  // התאמה לבנק: הקליטה האחרונה של עו"ש מול היתרה המחושבת (סעיף 5.5)
  const lastBankBatch = currentBuilding
    ? (currentBuilding.importBatches || []).find(bt => bt.type === 'bank' && !bt.undoneAt && bt.bankEndBalance !== null && bt.bankEndBalance !== undefined)
    : null;
  const reconcile = lastBankBatch
    ? (() => {
      const computed = computeBalance(currentBuilding, { account: 'bank', asOf: lastBankBatch.endDate });
      const diff = round2(lastBankBatch.bankEndBalance - computed);
      return { date: lastBankBatch.endDate, diff, matches: Math.abs(diff) < 0.01 };
    })()
    : null;

  const balanceMeta = isGlobalMode
    ? `ב-${buildings.length} חשבונות`
    : `בנק ${formatILS(computeBalance(currentBuilding, { account: 'bank' }))} · מזומן ${formatILS(computeBalance(currentBuilding, { account: 'cash' }))}${managerOwed(currentBuilding) > 0 ? ` · חייבים למנהל ${formatILS(managerOwed(currentBuilding))}` : ''}`;

  const stepStatusText = (stepId, rec) => {
    if (stepId === 'receipts') {
      const sum = receiptsThisMonth.reduce((t, e) => t + e.amount, 0);
      const count = receiptsThisMonth.length ? `${receiptsThisMonth.length} הכנסות · ${formatILS(sum)}` : 'לא נרשמו הכנסות';
      return rec.done ? `✓ אושר · ${count}` : count;
    }
    if (stepId === 'expenses') {
      const sum = cashOutThisMonth.reduce((t, e) => t + e.amount, 0);
      const count = cashOutThisMonth.length ? `${cashOutThisMonth.length} הוצאות · ${formatILS(sum)}` : 'לא נרשמו הוצאות';
      return rec.done ? `✓ אושר · ${count}` : count;
    }
    if (!rec.done) return 'הקובץ עוד לא הועלה';
    if (rec.legacy || (rec.note || '').startsWith('סומן לפני')) return '✓ אושר';
    const step = CLOSE_STEPS.find(x => x.id === stepId);
    return `✓ אושר · ${rec.note || step.manualLabel}`;
  };

  // ------------------------------------------------------------------------
  // פעולות
  // ------------------------------------------------------------------------
  const requireTarget = () => {
    if (targetBuilding) return true;
    requestBuildingPick('לאיזה בניין? בחרו בניין כדי להמשיך');
    return false;
  };

  const handleAptSelect = (aptId) => {
    setReceiptAptId(aptId);
    const apt = (targetBuilding?.apartments || []).find(a => a.id === aptId);
    setReceiptAmount(apt ? (apt.debtMonths?.length ? aptDebt(apt) : apt.monthlyDues) : '');
    setSelectedPaidMonths(apt?.debtMonths ? [...apt.debtMonths] : []);
  };

  const togglePaidMonth = (month, checked) => {
    setSelectedPaidMonths(prev => checked ? [...prev, month] : prev.filter(m => m !== month));
  };

  const openReceipt = () => {
    setReceiptDate(defaultDateFor(currentMonth));
    setManualReason('');
    setShowReceiptModal(true);
  };

  const openExpense = () => {
    setExpDate(defaultDateFor(currentMonth));
    setManualReason('');
    setShowExpenseModal(true);
  };

  const closeReceipt = () => {
    setShowReceiptModal(false);
    setReceiptAptId('');
    setReceiptAmount('');
    setReceiptNotes('');
    setSelectedPaidMonths([]);
    setManualReason('');
  };

  const receiptMonthClosed = targetBuilding && receiptDate && isMonthClosed(targetBuilding, receiptDate.slice(0, 7));
  const expenseMonthClosed = targetBuilding && expDate && isMonthClosed(targetBuilding, expDate.slice(0, 7));

  const submitReceipt = (e) => {
    e.preventDefault();
    if (!targetBuilding || !receiptAptId || !receiptAmount) return;
    if (receiptMonthClosed && !manualReason.trim()) return;
    recordManualReceipt(targetBuilding.id, receiptAptId, receiptAmount, selectedPaidMonths, receiptNotes, 'מזומן', { date: receiptDate, reason: manualReason.trim() });
    showFlash(`הכנסה במזומן של ${formatILS(receiptAmount)} נרשמה בבניין ${targetBuilding.name}.`);
    closeReceipt();
  };

  const submitExpense = (e) => {
    e.preventDefault();
    if (!targetBuilding || !expAmount || !expDesc) return;
    if (expenseMonthClosed && !manualReason.trim()) return;
    recordCashExpense(targetBuilding.id, expCategory, expAmount, expDesc, expDate, { reason: manualReason.trim(), paidBy: expPaidBy });
    showFlash(expPaidBy === 'manager'
      ? `הוצאה של ${formatILS(expAmount)} שהמנהל שילם נרשמה. הבניין חייב לו את הסכום עד להעברה.`
      : `הוצאת מזומן של ${formatILS(expAmount)} נרשמה בבניין ${targetBuilding.name}.`);
    setShowExpenseModal(false);
    setExpAmount('');
    setExpDesc('');
    setManualReason('');
  };

  // קובץ → תוכנית קליטה → תצוגה מקדימה. שום דבר לא נשמר לפני אישור.
  const readCsv = (e, kind) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !requireTarget()) return;
    const bld = targetBuilding;
    const label = kind === 'bank' ? 'עו״ש הבנק' : 'חיובית';
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const meta = { fileName: file.name, fileHash: hashText(text) };
        if (kind === 'bank') {
          const rows = parseBankReport(text);
          if (rows.length === 0) throw new Error('לא נמצאו תנועות בקובץ');
          setImportPlan(planBankImport(bld, rows, { ...meta, rules: systemSettings.categoryRules || [], depositNames: systemSettings.hiyuvitDepositNames || [], managerNames: systemSettings.managerBankNames || [] }));
        } else {
          const rows = parseHiyuvitReport(text);
          if (rows.length === 0) throw new Error('לא נמצאו שורות בקובץ');
          setImportPlan(planHiyuvitImport(bld, rows, meta));
        }
      } catch (err) {
        showFlash(`לא הצלחנו לקרוא את קובץ ה${label}: ${err.message}. ודאו שזה קובץ CSV מקורי.`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const unitOf = (tx) => (buildings.find(b => b.id === tx.buildingId)?.apartments || []).find(a => a.id === tx.apartmentId);
  const txBuilding = editTx ? buildings.find(b => b.id === editTx.buildingId) : null;

  return (
    <>
      {/* סגירת חודש — צ'קליסט של 4 שלבים; ב"כלל הבניינים" — התקדמות ורשימת הבניינים הפתוחים */}
      <section className="close-card">
        <header className="close-head">
          <span className="close-head-icon"><CalendarCheck size={22} /></span>
          <div className="close-head-text">
            <h2>סגירת חודש {monthName(currentMonth)}</h2>
            <p>
              {isGlobalMode
                ? `${closedCount} מתוך ${buildings.length} בניינים סגרו את החודש`
                : status.id === 'closed'
                  ? 'כל ארבעת השלבים סומנו — נתוני החודש סופיים.'
                  : 'סמנו כל שלב כשסיימתם אותו. כשכל הארבעה מסומנים — החודש נסגר.'}
            </p>
          </div>
          {isGlobalMode ? (
            <span className={`badge badge-dot ${closedCount === buildings.length ? 'badge-success' : 'badge-warning'}`}>
              {closedCount === buildings.length ? 'כל הבניינים סגרו' : `${buildings.length - closedCount} פתוחים`}
            </span>
          ) : (
            <span className={`badge badge-dot ${status.id === 'closed' ? 'badge-success' : 'badge-warning'}`}>{status.label}</span>
          )}
        </header>

        <div className="close-progress">
          <div className="progress">
            <div
              className="progress-bar"
              style={{ width: `${isGlobalMode ? (closedCount / (buildings.length || 1)) * 100 : (status.done / CLOSE_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {isGlobalMode ? (
          openBuildings.length === 0 ? (
            <div className="close-done"><CheckCircle2 size={20} /> כל הבניינים סגרו את חודש {monthName(currentMonth)}.</div>
          ) : (
            <ul className="close-open-list">
              {openBuildings.map(b => (
                <li key={b.id}>
                  <BuildingName name={b.name} color={b.color} />
                  <span className="close-missing">
                    {missingSteps(b, currentMonth).map(st => <span key={st.id} className="badge badge-warning">{st.short}</span>)}
                  </span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedBuildingId(b.id)}>
                    לסגירת החודש <ChevronLeft size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <>
            <div className="close-steps">
              {CLOSE_STEPS.map((st, i) => {
                const rec = closeRec[st.id] || {};
                const Icon = STEP_ICONS[st.id];
                return (
                  <div key={st.id} className={`close-step close-step--${st.id}${rec.done ? ' is-done' : ''}`}>
                    <div className="close-step-top">
                      <span className="close-step-num">{rec.done ? <Check size={16} strokeWidth={3} /> : i + 1}</span>
                      <span className="close-step-title"><Icon size={17} /> {st.label}</span>
                    </div>
                    <p className="close-step-status">{stepStatusText(st.id, rec)}</p>
                    <div className="close-step-actions">
                      {st.id === 'bank' && (
                        <label className="btn btn-primary btn-sm">
                          <UploadCloud size={15} /> העלאת קובץ
                          <input type="file" accept=".csv" hidden onChange={(e) => readCsv(e, 'bank')} />
                        </label>
                      )}
                      {st.id === 'hiyuvit' && (
                        <label className="btn btn-primary btn-sm">
                          <CreditCard size={15} /> העלאת קובץ
                          <input type="file" accept=".csv" hidden onChange={(e) => readCsv(e, 'hiyuvit')} />
                        </label>
                      )}
                      {st.id === 'receipts' && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={openReceipt}>
                          <PlusCircle size={15} /> הזנת הכנסה
                        </button>
                      )}
                      {st.id === 'expenses' && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={openExpense}>
                          <MinusCircle size={15} /> הזנת הוצאה
                        </button>
                      )}
                      {rec.done ? (
                        status.id !== 'closed' && (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCloseStep(currentBuilding.id, currentMonth, st.id, { done: false })}>
                            ביטול הסימון
                          </button>
                        )
                      ) : (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCloseStep(currentBuilding.id, currentMonth, st.id, { done: true, auto: false, note: st.manualLabel })}>
                          <Check size={15} /> {st.manualLabel}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {status.id === 'closed' && (
              <div className="close-done">
                <CheckCircle2 size={20} /> חודש {monthName(currentMonth)} סגור.
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReopenOpen(true)}>
                  פתיחה מחדש לתיקון
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <div className="kpi-grid">
        <Kpi variant="hero" icon={Wallet} label={isGlobalMode ? 'יתרה בכל הקופות' : 'יתרת קופה'} value={formatILS(balance)} meta={balanceMeta} />
        <Kpi variant="good" icon={TrendingUp} label={`הכנסות ב${monthName(currentMonth)}`} value={formatILS(income)} meta="חיובית, העברות ומזומן" />
        <Kpi variant="alert" icon={TrendingDown} label={`הוצאות ב${monthName(currentMonth)}`} value={formatILS(expenses)} meta="ספקים, תחזוקה ועמלות" />
      </div>

      {reconcile && (
        <div className={`reconcile ${reconcile.matches ? 'is-match' : 'is-gap'}`}>
          <Scale size={20} />
          {reconcile.matches ? (
            <span className="reconcile-verdict"><CheckCircle2 size={16} /> מותאם לבנק נכון ל-{formatDateIL(reconcile.date)}</span>
          ) : (
            <span className="reconcile-verdict">
              <AlertTriangle size={16} /> פער של {formatILS(Math.abs(reconcile.diff))} מול יתרת הבנק ב-{formatDateIL(reconcile.date)}.
              {' '}בדקו ביומן השינויים, או עדכנו את יתרת הפתיחה בהגדרות.
            </span>
          )}
        </div>
      )}

      <div className="card card-flush">
        <div className="card-header">
          <div>
            <h3 className="section-title">יומן תנועות · {formatMonth(currentMonth)}</h3>
            <p className="section-sub">{monthTransactions.length} תנועות {isGlobalMode ? `ב-${buildings.length} בניינים` : '· לחיצה על שורה לעריכה'}</p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            {deletedCount > 0 && (
              <label className="check-chip">
                <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
                תנועות שנמחקו ({deletedCount})
              </label>
            )}
            {sources.length > 1 && (
              <Segmented
                value={sourceFilter}
                onChange={setSourceFilter}
                options={[{ id: 'all', label: 'הכל' }, ...sources.map(s => ({ id: s, label: SOURCE_LABELS[s] || s }))]}
              />
            )}
          </div>
        </div>

        {visibleTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="אין תנועות לחודש זה"
            text="העלו קובץ בנק, או הזינו הכנסה או הוצאה במזומן בכרטיס סגירת החודש."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {isGlobalMode && <th>בניין</th>}
                  <th>תאריך</th>
                  <th>מקור</th>
                  <th>קטגוריה</th>
                  <th>תיאור</th>
                  <th className="num">סכום</th>
                </tr>
              </thead>
              <tbody>
                {visibleTransactions.map(tx => {
                  const isIncome = tx.direction === 'in';
                  return (
                    <tr
                      key={`${tx.buildingId}-${tx.id}`}
                      className={`tx-row${tx.deletedAt ? ' is-deleted' : ''}`}
                      onClick={() => setEditTx(tx)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') setEditTx(tx); }}
                    >
                      {isGlobalMode && (
                        <td><BuildingName name={tx.buildingName} color={tx.buildingColor} /></td>
                      )}
                      <td className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{formatDateIL(tx.date)}</td>
                      <td><span className={`badge ${SOURCE_BADGE[tx.source] || 'badge-neutral'}`}>{SOURCE_LABELS[tx.source] || tx.source}</span></td>
                      <td className="cell-strong">{tx.category}</td>
                      <td>
                        {tx.description}
                        {tx.apartmentId && unitOf(tx) && <span className="cell-sub">← {unitLabel(unitOf(tx))} · {unitDisplayName(unitOf(tx))}</span>}
                        {tx.transfer && <span className="cell-sub">העברה בין חשבונות · לא נספרת כהוצאה</span>}
                        {tx.account === MANAGER_ACCOUNT && !tx.transfer && <span className="cell-sub">שולם ע״י המנהל מכיסו</span>}
                        {tx.updatedAt && !tx.deletedAt && <span className="tx-edited"><Pencil size={11} /> נערך</span>}
                        {tx.deletedAt && <span className="cell-sub">נמחקה · {tx.deleteReason}</span>}
                      </td>
                      <td className={`num ${isIncome ? 'amount-in' : 'amount-out'}`}>
                        <span className="money-signed">{isIncome ? '+' : '−'}{formatILS(tx.amount)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {importPlan && (
        <ImportPreviewModal
          plan={importPlan}
          building={buildings.find(b => b.id === targetBuilding?.id)}
          onClose={() => setImportPlan(null)}
          onDone={(msg) => { setImportPlan(null); showFlash(msg); }}
        />
      )}

      {editTx && txBuilding && (
        <TransactionModal
          key={editTx.id}
          building={txBuilding}
          tx={(txBuilding.transactions || []).find(t => t.id === editTx.id) || editTx}
          onClose={() => setEditTx(null)}
          onDone={(msg) => { setEditTx(null); showFlash(msg); }}
        />
      )}

      <ReasonModal
        isOpen={reopenOpen}
        onClose={() => setReopenOpen(false)}
        title={`פתיחת ${formatMonth(currentMonth)} מחדש`}
        text="החודש יחזור למצב ״בתהליך״ עד שתסגרו אותו שוב. דוחות שיופקו בינתיים יסומנו כטיוטה."
        placeholder="למשל: הוצאה שהוזנה פעמיים"
        confirmText="פתיחה מחדש"
        onConfirm={(reason) => {
          reopenMonth(currentBuilding.id, currentMonth, reason);
          setReopenOpen(false);
          showFlash(`${formatMonth(currentMonth)} נפתח מחדש.`);
        }}
      />

      {/* הכנסה במזומן */}
      <Modal
        isOpen={showReceiptModal}
        onClose={closeReceipt}
        title="הכנסה במזומן"
        subtitle={targetBuilding ? <><BuildingName name={targetBuilding.name} color={targetBuilding.color} /> · תשלום שדייר מסר ביד. החודשים המסומנים ייסגרו כחוב</> : ''}
      >
        <form onSubmit={submitReceipt} className="form-stack">
          <Field label="דירה ודייר">
            <select required value={receiptAptId} onChange={(e) => handleAptSelect(e.target.value)} className="select">
              <option value="">— בחרו דירה —</option>
              {(targetBuilding?.apartments || []).map(apt => (
                <option key={apt.id} value={apt.id}>
                  דירה {apt.aptNum} · {apt.tenantName}{apt.debtMonths?.length ? ` · חוב ${apt.debtMonths.length} חודשים` : ''}
                </option>
              ))}
            </select>
          </Field>

          {selectedApt && (
            <div className="info-panel stack" style={{ gap: 10 }}>
              <span className="field-label">חודשי חוב פתוחים</span>
              {selectedApt.debtMonths?.length > 0 ? (
                <div className="row">
                  {selectedApt.debtMonths.map(month => (
                    <label key={month} className="check-chip">
                      <input
                        type="checkbox"
                        checked={selectedPaidMonths.includes(month)}
                        onChange={(e) => togglePaidMonth(month, e.target.checked)}
                      />
                      {formatMonth(month)}
                    </label>
                  ))}
                </div>
              ) : (
                <span className="row" style={{ color: 'var(--success)', fontSize: '0.91rem', gap: 6 }}>
                  <CheckCircle2 size={16} /> אין חוב פתוח. התשלום יירשם לחודש השוטף או כמקדמה.
                </span>
              )}
            </div>
          )}

          <div className="field-row">
            <Field label="סכום במזומן (₪)">
              <input type="number" required min="1" step="0.01" value={receiptAmount} onChange={(e) => setReceiptAmount(e.target.value)} className="input" placeholder="300" />
            </Field>
            <Field label="תאריך">
              <input type="date" required value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} className="input" />
            </Field>
          </div>
          <Field label="הערה (לא חובה)">
            <input type="text" value={receiptNotes} onChange={(e) => setReceiptNotes(e.target.value)} className="input" placeholder="למשל: נמסר לנציג הוועד" />
          </Field>
          {receiptMonthClosed && (
            <Field label="סיבה (חובה)" hint={`${formatMonth(receiptDate.slice(0, 7))} כבר נסגר. ההזנה תפתח אותו מחדש.`}>
              <input type="text" required value={manualReason} onChange={(e) => setManualReason(e.target.value)} className="input" placeholder="למשל: תשלום שנמסר באיחור" />
            </Field>
          )}

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">שמירת ההכנסה</button>
            <button type="button" onClick={closeReceipt} className="btn btn-secondary">ביטול</button>
          </div>
        </form>
      </Modal>

      {/* הוצאה במזומן */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="הוצאת מזומן"
        subtitle={targetBuilding ? <BuildingName name={targetBuilding.name} color={targetBuilding.color} /> : ''}
      >
        <form onSubmit={submitExpense} className="form-stack">
          <div className="field">
            <span className="field-label">שולם ע״י</span>
            <Segmented value={expPaidBy} onChange={setExpPaidBy} options={[{ id: 'cash', label: 'קופת המזומן' }, { id: 'manager', label: 'המנהל, מכיסו (להחזר)' }]} />
            {expPaidBy === 'manager' && <span className="field-hint">הבניין יהיה חייב למנהל את הסכום. כשההעברה אליו תופיע בעו״ש, היא תסגור את החוב ולא תיספר שוב כהוצאה.</span>}
          </div>
          <Field label="קטגוריה">
            <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="select">
              {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setShowExpenseModal(false); setActiveTab('settings', 'categories'); }}>
            הוספת קטגוריה בהגדרות ←
          </button>
          <div className="field-row">
            <Field label="סכום (₪)">
              <input type="number" required min="1" step="0.01" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="input" placeholder="150" />
            </Field>
            <Field label="תאריך">
              <input type="date" required value={expDate} onChange={(e) => setExpDate(e.target.value)} className="input" />
            </Field>
          </div>
          <Field label="פירוט" hint={expCategory === OTHER_CATEGORY ? 'בחרתם "אחר" — כתבו כאן על מה ההוצאה.' : undefined}>
            <input type="text" required value={expDesc} onChange={(e) => setExpDesc(e.target.value)} className="input" placeholder={expCategory === OTHER_CATEGORY ? 'למשל: החלפת מנעול בדלת הכניסה' : 'למשל: נורות לד לחדר המדרגות'} />
          </Field>
          {expenseMonthClosed && (
            <Field label="סיבה (חובה)" hint={`${formatMonth(expDate.slice(0, 7))} כבר נסגר. ההזנה תפתח אותו מחדש.`}>
              <input type="text" required value={manualReason} onChange={(e) => setManualReason(e.target.value)} className="input" placeholder="למשל: קבלה שהגיעה באיחור" />
            </Field>
          )}
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">שמירת ההוצאה</button>
            <button type="button" onClick={() => setShowExpenseModal(false)} className="btn btn-secondary">ביטול</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
