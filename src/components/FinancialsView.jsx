// ==========================================================================
// בית ומנוחה - כספים: סגירת חודש (בנק, חיובית, הכנסות והוצאות במזומן), יומן תנועות וגביות מיוחדות
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseBankReport, parseHiyuvitReport } from '../utils/csvParser';
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
  Check
} from 'lucide-react';
import { PageHeader, Kpi, SubTabs, Segmented, Modal, Field, EmptyState, BuildingName, FlashMessage, useFlash } from './ui';
import SpecialLevies from './SpecialLevies';
import { CLOSE_STEPS, getMonthClose, closeStatus, isMonthClosed, missingSteps } from '../utils/monthClose';

const STEP_ICONS = { bank: UploadCloud, hiyuvit: CreditCard, receipts: PlusCircle, expenses: MinusCircle };
import { formatILS, formatMonth, monthName, splitInOut, sumBy, withBuilding, todayISO, aptDebt, requestBuildingPick } from '../utils/format';

const SOURCE_BADGE = {
  'בנק': 'badge-petrol',
  'חיובית': 'badge-gold',
  'מזומן': 'badge-success',
  'קבוע': 'badge-neutral'
};

export default function FinancialsView() {
  const { activeSubTab, setActiveSubTab, currentMonth } = useApp();
  const subTab = activeSubTab || 'transactions';

  return (
    <div className="page">
      <PageHeader
        title="כספים"
        subtitle={formatMonth(currentMonth)}
      />
      <SubTabs
        active={subTab}
        onChange={setActiveSubTab}
        tabs={[
          { id: 'transactions', label: 'סגירת חודש ותנועות', icon: Receipt },
          { id: 'levies', label: 'גביות מיוחדות', icon: Wrench }
        ]}
      />
      {subTab === 'levies' ? <SpecialLevies /> : <Transactions />}
    </div>
  );
}

function Transactions() {
  const {
    currentBuilding,
    buildings,
    setSelectedBuildingId,
    recordManualReceipt,
    recordCashExpense,
    ingestBankReport,
    ingestHiyuvitReport,
    currentMonth,
    expenseCategories,
    addExpenseCategory,
    setCloseStep,
    reopenMonth
  } = useApp();

  const isGlobalMode = !currentBuilding;

  // העלאה והזנה נעשות לבניין שנבחר בתפריט הבניינים
  const targetBuilding = currentBuilding;

  const [flash, showFlash] = useFlash();
  const [sourceFilter, setSourceFilter] = useState('all');

  // --- מודל הכנסה במזומן ---
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptAptId, setReceiptAptId] = useState('');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [selectedPaidMonths, setSelectedPaidMonths] = useState([]);

  // --- מודל הוצאת מזומן ---
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState('תחזוקה שוטפת והוצאות חריגות');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expDate, setExpDate] = useState(() => todayISO());
  const [newCategory, setNewCategory] = useState(null); // null = בחירה מהרשימה; מחרוזת = הקלדת קטגוריה חדשה

  const confirmNewCategory = () => {
    const name = (newCategory || '').trim();
    if (!name) return;
    addExpenseCategory(name);
    setExpCategory(name);
    setNewCategory(null);
  };

  // ------------------------------------------------------------------------
  // נתונים
  // ------------------------------------------------------------------------
  const scopeBuildings = currentBuilding ? [currentBuilding] : buildings;
  const monthTransactions = scopeBuildings
    .flatMap(b => withBuilding(b, b.expenses))
    .filter(tx => tx.month === currentMonth || !tx.month)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const { income, expenses } = splitInOut(monthTransactions);
  const balance = sumBy(scopeBuildings, b => b.currentBalance);

  const sources = Array.from(new Set(monthTransactions.map(tx => tx.source || 'בנק')));
  const visibleTransactions = sourceFilter === 'all'
    ? monthTransactions
    : monthTransactions.filter(tx => (tx.source || 'בנק') === sourceFilter);

  const selectedApt = (targetBuilding?.apartments || []).find(a => a.id === receiptAptId);

  // סגירת חודש
  const closeRec = currentBuilding ? getMonthClose(currentBuilding, currentMonth) : {};
  const status = currentBuilding ? closeStatus(currentBuilding, currentMonth) : null;
  const openBuildings = buildings.filter(b => !isMonthClosed(b, currentMonth));
  const closedCount = buildings.length - openBuildings.length;
  const monthOf = (b) => (b?.expenses || []).filter(e => e.month === currentMonth);
  // הכנסות במזומן: תשלומים שדיירים מסרו ביד (העברות וצ'קים נכנסים דרך דו"ח העו"ש)
  const receiptsThisMonth = monthOf(currentBuilding).filter(e => e.amount < 0 && e.source === 'מזומן');
  const cashOutThisMonth = monthOf(currentBuilding).filter(e => e.source === 'מזומן' && e.amount > 0);

  const stepStatusText = (stepId, rec) => {
    if (stepId === 'receipts') {
      const sum = receiptsThisMonth.reduce((t, e) => t + Math.abs(e.amount), 0);
      const count = receiptsThisMonth.length ? `${receiptsThisMonth.length} הכנסות · ${formatILS(sum)}` : 'לא נרשמו הכנסות';
      return rec.done ? `✓ אושר · ${count}` : count;
    }
    if (stepId === 'expenses') {
      const sum = cashOutThisMonth.reduce((t, e) => t + e.amount, 0);
      const count = cashOutThisMonth.length ? `${cashOutThisMonth.length} הוצאות · ${formatILS(sum)}` : 'לא נרשמו הוצאות';
      return rec.done ? `✓ אושר · ${count}` : count;
    }
    if (!rec.done) return 'הקובץ עוד לא הועלה';
    // שלבים שסומנו בהמרה מהסימון הישן ("מעודכן") — בלי פירוט
    if (rec.legacy || (rec.note || '').startsWith('סומן לפני')) return '✓ אושר';
    // הועלה קובץ — מה נקלט ממנו; סומן ידנית — מה שאושר (למשל "אין תנועות בבנק החודש")
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

  const closeReceipt = () => {
    setShowReceiptModal(false);
    setReceiptAptId('');
    setReceiptAmount('');
    setReceiptNotes('');
    setSelectedPaidMonths([]);
  };

  const submitReceipt = (e) => {
    e.preventDefault();
    if (!targetBuilding || !receiptAptId || !receiptAmount) return;
    recordManualReceipt(targetBuilding.id, receiptAptId, receiptAmount, selectedPaidMonths, receiptNotes, 'מזומן');
    showFlash(`הכנסה במזומן של ${formatILS(receiptAmount)} נרשמה בבניין ${targetBuilding.name}.`);
    closeReceipt();
  };

  const submitExpense = (e) => {
    e.preventDefault();
    if (!targetBuilding || !expAmount || !expDesc) return;
    recordCashExpense(targetBuilding.id, expCategory, expAmount, expDesc, expDate);
    showFlash(`הוצאת מזומן של ${formatILS(expAmount)} נרשמה בבניין ${targetBuilding.name}.`);
    setShowExpenseModal(false);
    setExpAmount('');
    setExpDesc('');
  };

  const readCsv = (e, parser, ingest, label) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !requireTarget()) return;
    const bld = targetBuilding;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = parser(evt.target.result);
        ingest(bld.id, parsed);
        showFlash(`נקלטו ${parsed.length} תנועות מ${label} לבניין ${bld.name}.`);
      } catch (err) {
        showFlash(`לא הצלחנו לקרוא את קובץ ה${label}: ${err.message}. ודאו שזה קובץ CSV מקורי.`, 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <FlashMessage flash={flash} />

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
                          <input type="file" accept=".csv" hidden onChange={(e) => readCsv(e, parseBankReport, ingestBankReport, 'עו״ש הבנק')} />
                        </label>
                      )}
                      {st.id === 'hiyuvit' && (
                        <label className="btn btn-primary btn-sm">
                          <CreditCard size={15} /> העלאת קובץ
                          <input type="file" accept=".csv" hidden onChange={(e) => readCsv(e, parseHiyuvitReport, ingestHiyuvitReport, 'חיובית')} />
                        </label>
                      )}
                      {st.id === 'receipts' && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowReceiptModal(true)}>
                          <PlusCircle size={15} /> הזנת הכנסה
                        </button>
                      )}
                      {st.id === 'expenses' && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowExpenseModal(true)}>
                          <MinusCircle size={15} /> הזנת הוצאה
                        </button>
                      )}
                      {rec.done ? (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCloseStep(currentBuilding.id, currentMonth, st.id, { done: false })}>
                          ביטול הסימון
                        </button>
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
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => reopenMonth(currentBuilding.id, currentMonth)}>
                  פתיחה מחדש לתיקון
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <div className="kpi-grid">
        <Kpi variant="hero" icon={Wallet} label={isGlobalMode ? 'יתרה בכל הקופות' : 'יתרת קופה'} value={formatILS(balance)} meta={isGlobalMode ? `ב-${buildings.length} חשבונות` : currentBuilding.bankAccount} />
        <Kpi variant="good" icon={TrendingUp} label={`הכנסות ב${monthName(currentMonth)}`} value={formatILS(income)} meta="חיובית, העברות ומזומן" />
        <Kpi variant="alert" icon={TrendingDown} label={`הוצאות ב${monthName(currentMonth)}`} value={formatILS(expenses)} meta="ספקים, תחזוקה ועמלות" />
      </div>

      <div className="card card-flush">
        <div className="card-header">
          <div>
            <h3 className="section-title">יומן תנועות · {formatMonth(currentMonth)}</h3>
            <p className="section-sub">{monthTransactions.length} תנועות {isGlobalMode ? `ב-${buildings.length} בניינים` : ''}</p>
          </div>
          {sources.length > 1 && (
            <Segmented
              value={sourceFilter}
              onChange={setSourceFilter}
              options={[{ id: 'all', label: 'הכל' }, ...sources.map(s => ({ id: s, label: s }))]}
            />
          )}
        </div>

        {visibleTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="אין תנועות לחודש זה"
            text="העלו קובץ בנק או חיובית, או הזינו הכנסה או הוצאה במזומן בכרטיס סגירת החודש."
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
                {visibleTransactions.map((tx, idx) => {
                  const isIncome = tx.amount < 0;
                  const source = tx.source || 'בנק';
                  return (
                    <tr key={`${tx.buildingId}-${tx.id}-${idx}`}>
                      {isGlobalMode && (
                        <td><BuildingName name={tx.buildingName} color={tx.buildingColor} onClick={() => setSelectedBuildingId(tx.buildingId)} /></td>
                      )}
                      <td className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{tx.date}</td>
                      <td><span className={`badge ${SOURCE_BADGE[source] || 'badge-neutral'}`}>{source}</span></td>
                      <td className="cell-strong">{tx.category}</td>
                      <td>{tx.description}</td>
                      <td className={`num ${isIncome ? 'amount-in' : 'amount-out'}`}>
                        <span className="money-signed">{isIncome ? '+' : '−'}{formatILS(Math.abs(tx.amount))}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* מודל: הכנסה במזומן */}
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
              <input type="number" required min="1" value={receiptAmount} onChange={(e) => setReceiptAmount(e.target.value)} className="input" placeholder="300" />
            </Field>
            <Field label="הערה (לא חובה)">
              <input type="text" value={receiptNotes} onChange={(e) => setReceiptNotes(e.target.value)} className="input" placeholder="למשל: נמסר לנציג הוועד" />
            </Field>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">שמירת ההכנסה</button>
            <button type="button" onClick={closeReceipt} className="btn btn-secondary">ביטול</button>
          </div>
        </form>
      </Modal>

      {/* מודל: הוצאת מזומן */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="הוצאת מזומן"
        subtitle={targetBuilding ? <BuildingName name={targetBuilding.name} color={targetBuilding.color} /> : ''}
      >
        <form onSubmit={submitExpense} className="form-stack">
          {newCategory === null ? (
            <Field label="קטגוריה">
              <select
                value={expCategory}
                onChange={(e) => e.target.value === '__new__' ? setNewCategory('') : setExpCategory(e.target.value)}
                className="select"
              >
                {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__new__">+ קטגוריה חדשה…</option>
              </select>
            </Field>
          ) : (
            <Field label="קטגוריה חדשה" hint="הקטגוריה תישמר ותופיע מעכשיו בכל הבניינים ובדוח ההוצאות.">
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <input
                  type="text"
                  autoFocus
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmNewCategory(); } }}
                  className="input"
                  placeholder="למשל: הדברה"
                />
                <button type="button" className="btn btn-primary" onClick={confirmNewCategory} disabled={!newCategory.trim()}>הוספה</button>
                <button type="button" className="btn btn-secondary" onClick={() => setNewCategory(null)}>ביטול</button>
              </div>
            </Field>
          )}
          <div className="field-row">
            <Field label="סכום (₪)">
              <input type="number" required min="1" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="input" placeholder="150" />
            </Field>
            <Field label="תאריך">
              <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="input" />
            </Field>
          </div>
          <Field label="פירוט" hint={expCategory === OTHER_CATEGORY ? 'בחרתם "אחר" — כתבו כאן על מה ההוצאה.' : undefined}>
            <input type="text" required value={expDesc} onChange={(e) => setExpDesc(e.target.value)} className="input" placeholder={expCategory === OTHER_CATEGORY ? 'למשל: החלפת מנעול בדלת הכניסה' : 'למשל: נורות לד לחדר המדרגות'} />
          </Field>
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">שמירת ההוצאה</button>
            <button type="button" onClick={() => setShowExpenseModal(false)} className="btn btn-secondary">ביטול</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
