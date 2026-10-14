// ==========================================================================
// בית ומנוחה - כספים: קליטת קובצי בנק/חיובית, הזנה ידנית, יומן תנועות וגביות מיוחדות
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseBankReport, parseHiyuvitReport } from '../utils/csvParser';
import { EXPENSE_CATEGORIES, RECEIPT_TYPES } from '../data/initialData';
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
  CheckCircle2
} from 'lucide-react';
import { PageHeader, Kpi, SubTabs, Segmented, Modal, Field, EmptyState, BuildingName, FlashMessage, useFlash } from './ui';
import SpecialLevies from './SpecialLevies';
import { formatILS, formatMonth, monthName, splitInOut, sumBy, withBuilding, todayISO, aptDebt } from '../utils/format';

const SOURCE_BADGE = {
  'בנק': 'badge-petrol',
  'חיובית': 'badge-gold',
  'מזומן': 'badge-success',
  'קבוע': 'badge-neutral'
};

export default function FinancialsView() {
  const { currentBuilding, activeSubTab, setActiveSubTab } = useApp();
  const subTab = activeSubTab || 'transactions';

  return (
    <div className="page">
      <PageHeader
        title="כספים"
        subtitle={currentBuilding ? currentBuilding.name : 'כלל הבניינים'}
      />
      <SubTabs
        active={subTab}
        onChange={setActiveSubTab}
        tabs={[
          { id: 'transactions', label: 'קליטה ותנועות', icon: Receipt },
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
    currentMonth
  } = useApp();

  const isGlobalMode = !currentBuilding;

  // בניין היעד לפעולות. במצב "כלל הבניינים" — בחירה מפורשת מהרשימה
  const [pickedBuildingId, setPickedBuildingId] = useState('');
  const targetBuilding = currentBuilding || buildings.find(b => b.id === pickedBuildingId) || null;

  const [flash, showFlash] = useFlash();
  const [sourceFilter, setSourceFilter] = useState('all');

  // --- מודל תקבול ---
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptAptId, setReceiptAptId] = useState('');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptType, setReceiptType] = useState(RECEIPT_TYPES[0]);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [selectedPaidMonths, setSelectedPaidMonths] = useState([]);

  // --- מודל הוצאת מזומן ---
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState('תחזוקה שוטפת והוצאות חריגות');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expDate, setExpDate] = useState(() => todayISO());

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

  // ------------------------------------------------------------------------
  // פעולות
  // ------------------------------------------------------------------------
  const requireTarget = () => {
    if (targetBuilding) return true;
    showFlash('בחרו קודם בניין יעד לפעולה מהרשימה שמעל הכפתורים.', 'error');
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
    recordManualReceipt(targetBuilding.id, receiptAptId, receiptAmount, selectedPaidMonths, receiptNotes, receiptType);
    showFlash(`תקבול של ${formatILS(receiptAmount)} נרשם בבניין ${targetBuilding.name}.`);
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

      {isGlobalMode && (
        <div className="info-panel row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <span className="field-label">קליטה והזנה עבור בניין:</span>
            <select
              className="select input-sm"
              style={{ width: 'auto', minWidth: 220 }}
              value={pickedBuildingId}
              onChange={(e) => setPickedBuildingId(e.target.value)}
            >
              <option value="">— בחרו בניין —</option>
              {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          {targetBuilding && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedBuildingId(targetBuilding.id)}>
              מעבר לתצוגת {targetBuilding.name}
            </button>
          )}
        </div>
      )}

      <div className="action-grid">
        <label className="action-tile action-tile--petrol">
          <input type="file" accept=".csv" hidden onChange={(e) => readCsv(e, parseBankReport, ingestBankReport, 'עו״ש הבנק')} onClick={(e) => { if (!requireTarget()) e.preventDefault(); }} />
          <span className="action-tile-icon"><UploadCloud size={20} /></span>
          <span><span className="action-tile-title">דו״ח עו״ש בנק</span><span className="action-tile-sub">העלאת קובץ CSV</span></span>
        </label>
        <label className="action-tile action-tile--gold">
          <input type="file" accept=".csv" hidden onChange={(e) => readCsv(e, parseHiyuvitReport, ingestHiyuvitReport, 'חיובית')} onClick={(e) => { if (!requireTarget()) e.preventDefault(); }} />
          <span className="action-tile-icon"><CreditCard size={20} /></span>
          <span><span className="action-tile-title">דו״ח חיובית</span><span className="action-tile-sub">גבייה באשראי ומס״ב</span></span>
        </label>
        <button type="button" className="action-tile action-tile--green" onClick={() => requireTarget() && setShowReceiptModal(true)}>
          <span className="action-tile-icon"><PlusCircle size={20} /></span>
          <span><span className="action-tile-title">תקבול ידני</span><span className="action-tile-sub">מזומן, העברה או צ׳ק</span></span>
        </button>
        <button type="button" className="action-tile action-tile--coral" onClick={() => requireTarget() && setShowExpenseModal(true)}>
          <span className="action-tile-icon"><MinusCircle size={20} /></span>
          <span><span className="action-tile-title">הוצאת מזומן</span><span className="action-tile-sub">רישום הוצאה מהקופה</span></span>
        </button>
      </div>

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
            text="העלו קובץ בנק או חיובית, או הזינו תקבול או הוצאה ידנית בכפתורים שלמעלה."
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

      {/* מודל: תקבול ידני */}
      <Modal
        isOpen={showReceiptModal}
        onClose={closeReceipt}
        title="תקבול ידני"
        subtitle={targetBuilding ? `בניין ${targetBuilding.name} · החודשים המסומנים ייסגרו כחוב` : ''}
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
                <span className="row" style={{ color: 'var(--success)', fontSize: '0.88rem', gap: 6 }}>
                  <CheckCircle2 size={16} /> אין חוב פתוח. התשלום יירשם לחודש השוטף או כמקדמה.
                </span>
              )}
            </div>
          )}

          <div className="field-row">
            <Field label="סכום (₪)">
              <input type="number" required min="1" value={receiptAmount} onChange={(e) => setReceiptAmount(e.target.value)} className="input" placeholder="300" />
            </Field>
            <Field label="אופן התשלום">
              <select value={receiptType} onChange={(e) => setReceiptType(e.target.value)} className="select">
                {RECEIPT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <Field label="הערה או אסמכתא (לא חובה)">
            <input type="text" value={receiptNotes} onChange={(e) => setReceiptNotes(e.target.value)} className="input" placeholder="למשל: נמסר לנציג הוועד / אסמכתא 54321" />
          </Field>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">שמירת התקבול</button>
            <button type="button" onClick={closeReceipt} className="btn btn-secondary">ביטול</button>
          </div>
        </form>
      </Modal>

      {/* מודל: הוצאת מזומן */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="הוצאת מזומן"
        subtitle={targetBuilding ? `בניין ${targetBuilding.name}` : ''}
      >
        <form onSubmit={submitExpense} className="form-stack">
          <Field label="קטגוריה">
            <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="select">
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div className="field-row">
            <Field label="סכום (₪)">
              <input type="number" required min="1" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="input" placeholder="150" />
            </Field>
            <Field label="תאריך">
              <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="input" />
            </Field>
          </div>
          <Field label="פירוט">
            <input type="text" required value={expDesc} onChange={(e) => setExpDesc(e.target.value)} className="input" placeholder="למשל: נורות לד לחדר המדרגות" />
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
