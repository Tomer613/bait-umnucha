// ==========================================================================
// בית ומנוחה - ניהול כספים, קליטת CSV והזנה ידנית חכמה
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseBankReport, parseHiyuvitReport } from '../utils/csvParser';
import { 
  UploadCloud, 
  PlusCircle, 
  MinusCircle, 
  DollarSign, 
  ArrowDownRight, 
  ArrowUpRight, 
  Calendar, 
  FileText, 
  Check, 
  X,
  CreditCard,
  Building,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function FinancialsView() {
  const { 
    currentBuilding, 
    buildings, 
    selectedBuildingId, 
    setSelectedBuildingId, 
    recordManualReceipt, 
    recordCashExpense,
    ingestBankReport,
    ingestHiyuvitReport,
    currentMonth
  } = useApp();

  // מודלים להזנה ידנית
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // נתוני טופס תקבול ידני
  const [receiptAptId, setReceiptAptId] = useState('');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptType, setReceiptType] = useState('מזומן'); // מזומן | העברה בנקאית
  const [receiptNotes, setReceiptNotes] = useState('');
  const [selectedPaidMonths, setSelectedPaidMonths] = useState([]);

  // נתוני טופס הוצאת מזומן
  const [expCategory, setExpCategory] = useState('תחזוקה שוטפת והוצאות חריגות');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));

  // הודעת סטטוס העלאת קובץ
  const [uploadMessage, setUploadMessage] = useState(null);

  if (!currentBuilding) {
    const totalBalance = buildings.reduce((acc, b) => acc + (b.currentBalance || 0), 0);
    const updatedCount = buildings.filter(b => b.statusMonthUpdated).length;
    const allDebtsSum = buildings.reduce((acc, b) => {
      return acc + (b.apartments || []).reduce((sum, apt) => sum + ((apt.debtMonths?.length || 0) * (apt.monthlyDues || 0)), 0);
    }, 0);
    const allTransactions = buildings.flatMap(b => 
      (b.expenses || []).map(exp => ({ ...exp, buildingId: b.id, buildingName: b.name, buildingColor: b.color }))
    ).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return (
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="badge badge-gold" style={{ fontSize: '0.82rem' }}>מבט-על כספי</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>כלל 15 הבניינים המנוהלים</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            מרכז כספים מצרפי — כלל הבניינים
          </h2>
          <p style={{ color: 'var(--color-brown-600)', fontSize: '0.95rem', marginTop: 4 }}>
            ריכוז יתרות קופה, מעקב תנועות מכלל הבניינים וקליטת דוחות סליקה מרוכזים
          </p>
        </div>

        {/* 4 Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28
        }}>
          <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-gold-500)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)', marginBottom: 6 }}>
              יתרה מצרפית בכלל הקופות
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
              {totalBalance.toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-gold-600)' }}>בכל 15 חשבונות הבנק</span>
          </div>

          <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-success)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)', marginBottom: 6 }}>
              סטטוס עדכון חודשי
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)' }}>
              {updatedCount} / {buildings.length}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)' }}>בניינים עודכנו בספטמבר</span>
          </div>

          <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-danger)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)', marginBottom: 6 }}>
              סך חובות פתוחים מצרפי
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-danger)' }}>
              {allDebtsSum.toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)' }}>בכלל הדירות בפיגור</span>
          </div>

          <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-brown-500)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)', marginBottom: 6 }}>
              סך תנועות רשומות
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
              {allTransactions.length} תנועות
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)' }}>הוצאות ותקבולים</span>
          </div>
        </div>

        {/* טבלת כל 15 קופות הבניינים */}
        <div className="card" style={{ background: '#FFFFFF', padding: 0, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-beige-border)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
              טבלת מצב קופות וחשבונות בנק לכל 15 הבניינים
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-brown-500)' }}>
              לחץ על ״כניסה לניהול כספים״ לביצוע הפקדה ידנית, הוצאה או קליטת קובץ עו״ש בנקאי לבניין ספציפי
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-cream-subtle)', borderBottom: '1px solid var(--color-beige-border)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>בניין וכתובת</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>חשבון בנק</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>קוד חיובית</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>יתרת קופה</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>סטטוס קליטה</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700, textAlign: 'center' }}>פעולה</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--color-beige-divider)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: b.color?.primary || 'var(--color-gold-500)', display: 'inline-block' }} />
                        <span style={{ fontWeight: 800, color: 'var(--color-brown-900)' }}>{b.name}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)', paddingRight: 20 }}>{b.address}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--color-brown-700)' }}>{b.bankAccount}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--color-brown-600)' }}>{b.hiyuvitCode || '—'}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                      {(b.currentBalance || 0).toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {b.statusMonthUpdated ? (
                        <span className="badge badge-success">מעודכן</span>
                      ) : (
                        <span className="badge badge-neutral">ממתין לקבצים</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedBuildingId(b.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <span>ניהול כספים בבניין זה</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* תנועות אחרונות מכלל הבניינים */}
        <div className="card" style={{ background: '#FFFFFF', padding: 24 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-brown-900)', marginBottom: 16 }}>
            תנועות והוצאות אחרונות מכלל 15 הבניינים
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-cream-subtle)', borderBottom: '1px solid var(--color-beige-border)' }}>
                  <th style={{ padding: '10px 14px' }}>בניין</th>
                  <th style={{ padding: '10px 14px' }}>תאריך</th>
                  <th style={{ padding: '10px 14px' }}>תיאור</th>
                  <th style={{ padding: '10px 14px' }}>קטגוריה</th>
                  <th style={{ padding: '10px 14px' }}>מקור</th>
                  <th style={{ padding: '10px 14px' }}>סכום</th>
                </tr>
              </thead>
              <tbody>
                {allTransactions.slice(0, 10).map((tx, idx) => (
                  <tr key={`${tx.id}-${idx}`} style={{ borderBottom: '1px solid var(--color-beige-divider)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: tx.buildingColor?.primary || 'var(--color-gold-500)' }} />
                        <span style={{ fontWeight: 700 }}>{tx.buildingName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem' }}>{tx.date}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{tx.description}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--color-brown-600)' }}>{tx.category}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>{tx.source}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: tx.amount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {tx.amount > 0 ? `-${tx.amount.toLocaleString('he-IL')} ₪` : `+${Math.abs(tx.amount).toLocaleString('he-IL')} ₪`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // הדירה שנבחרה כרגע בטופס תקבול
  const selectedApt = (currentBuilding.apartments || []).find(a => a.id === receiptAptId);

  // עדכון דירה בטופס תקבול וקביעת חודשי חוב אוטומטית
  const handleAptSelect = (aptId) => {
    setReceiptAptId(aptId);
    const apt = (currentBuilding.apartments || []).find(a => a.id === aptId);
    if (apt) {
      // ברירת מחדל לסכום לפי דמי הוועד
      setReceiptAmount(apt.monthlyDues || 300);
      // ציפת חודשי חוב פתוחים
      setSelectedPaidMonths(apt.debtMonths ? [...apt.debtMonths] : []);
    } else {
      setSelectedPaidMonths([]);
    }
  };

  // שמירת תקבול ידני
  const submitReceipt = (e) => {
    e.preventDefault();
    if (!receiptAptId || !receiptAmount) return;
    recordManualReceipt(
      currentBuilding.id,
      receiptAptId,
      receiptAmount,
      selectedPaidMonths,
      receiptNotes,
      receiptType
    );
    setShowReceiptModal(false);
    setReceiptAptId('');
    setReceiptAmount('');
    setReceiptNotes('');
    setSelectedPaidMonths([]);
  };

  // שמירת הוצאת מזומן
  const submitExpense = (e) => {
    e.preventDefault();
    if (!expAmount || !expDesc) return;
    recordCashExpense(
      currentBuilding.id,
      expCategory,
      expAmount,
      expDesc,
      expDate
    );
    setShowExpenseModal(false);
    setExpAmount('');
    setExpDesc('');
  };

  // העלאת קובץ עו"ש בנק
  const handleBankUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const parsed = parseBankReport(text);
        ingestBankReport(currentBuilding.id, parsed);
        setUploadMessage(`נקלטו בהצלחה ${parsed.length} תנועות מקובץ הבנק!`);
        setTimeout(() => setUploadMessage(null), 5000);
      } catch (err) {
        setUploadMessage(`שגיאה בפענוח קובץ הבנק: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // העלאת קובץ חיובית
  const handleHiyuvitUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const parsed = parseHiyuvitReport(text);
        ingestHiyuvitReport(currentBuilding.id, parsed);
        setUploadMessage(`נקלטו בהצלחה ${parsed.length} תנועות גבייה מחברת חיובית!`);
        setTimeout(() => setUploadMessage(null), 5000);
      } catch (err) {
        setUploadMessage(`שגיאה בפענוח קובץ חיובית: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // חישוב הכנסות והוצאות לחודש הנבחר
  const monthExpensesList = (currentBuilding.expenses || []).filter(e => e.month === currentMonth || !e.month);
  const totalOut = monthExpensesList
    .filter(e => e.amount > 0)
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalIn = monthExpensesList
    .filter(e => e.amount < 0)
    .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Building Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, var(--color-gold-50) 100%)',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
              {currentBuilding.name} — ניהול כספים ותנועות
            </h2>
            <span className="badge badge-gold">
              חודש {currentMonth}
            </span>
          </div>
          <p style={{ color: 'var(--color-brown-600)', fontSize: '0.9rem' }}>
            {currentBuilding.address} | חשבון בנק: {currentBuilding.bankAccount} | קוד חיובית: {currentBuilding.hiyuvitCode}
          </p>
        </div>

        {/* Current Balance Display */}
        <div style={{ textAlign: 'left', background: '#FFFFFF', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-beige-border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>יתרה נוכחית בחשבון:</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-brown-900)' }}>
            {(currentBuilding.currentBalance || 0).toLocaleString('he-IL', { maximumFractionDigits: 2 })} ₪
          </div>
        </div>
      </div>

      {/* Upload Notification Message */}
      {uploadMessage && (
        <div style={{
          background: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #C8E6C9',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Four Prominent Action Buttons Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        {/* Upload Bank CSV */}
        <label className="btn btn-primary" style={{ padding: '16px 20px', cursor: 'pointer', textAlign: 'center' }}>
          <input type="file" accept=".csv" onChange={handleBankUpload} style={{ display: 'none' }} />
          <UploadCloud size={20} />
          <span>העלאת דו"ח עו"ש בנק (CSV)</span>
        </label>

        {/* Upload Hiyuvit CSV */}
        <label className="btn btn-secondary" style={{ padding: '16px 20px', cursor: 'pointer', textAlign: 'center', borderColor: 'var(--color-gold-400)', color: 'var(--color-gold-700)' }}>
          <input type="file" accept=".csv" onChange={handleHiyuvitUpload} style={{ display: 'none' }} />
          <CreditCard size={20} />
          <span>העלאת דו"ח חיובית (CSV)</span>
        </label>

        {/* Manual Cash In (Dynamic Debt Months) */}
        <button 
          onClick={() => setShowReceiptModal(true)}
          className="btn btn-secondary" 
          style={{ padding: '16px 20px', background: '#FFFFFF', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
        >
          <PlusCircle size={20} />
          <span>הזנת תקבול ידני (מזומן/העברה)</span>
        </button>

        {/* Manual Cash Out */}
        <button 
          onClick={() => setShowExpenseModal(true)}
          className="btn btn-secondary" 
          style={{ padding: '16px 20px', background: '#FFFFFF', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
        >
          <MinusCircle size={20} />
          <span>הזנת הוצאת מזומן ידנית</span>
        </button>
      </div>

      {/* Month Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ background: '#FFFFFF', padding: 18 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>סך הוצאות החודש ({currentMonth}):</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-danger)' }}>
            {totalOut.toLocaleString('he-IL')} ₪
          </div>
        </div>
        <div className="card" style={{ background: '#FFFFFF', padding: 18 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>סך תקבולים ישירים החודש:</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {totalIn.toLocaleString('he-IL')} ₪
          </div>
        </div>
        <div className="card" style={{ background: '#FFFFFF', padding: 18 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>מספר שורות תנועה:</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            {monthExpensesList.length} תנועות
          </div>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: 'var(--color-gold-50)', borderBottom: '1px solid var(--color-beige-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-brown-900)' }}>
            יומן תנועות והוצאות לבניין ({currentBuilding.name})
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-brown-600)' }}>
            מציג את תנועות הבנק, החיובית, המזומן וההוצאות הקבועות
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: '#FFFFFF', borderBottom: '1px solid var(--color-beige-border)', fontSize: '0.85rem', color: 'var(--color-brown-500)' }}>
                <th style={{ padding: '12px 18px' }}>תאריך</th>
                <th style={{ padding: '12px 18px' }}>מקור תנועה</th>
                <th style={{ padding: '12px 18px' }}>סעיף תקציבי / קטגוריה</th>
                <th style={{ padding: '12px 18px' }}>תיאור הפעולה</th>
                <th style={{ padding: '12px 18px', textAlign: 'left' }}>סכום</th>
              </tr>
            </thead>
            <tbody>
              {monthExpensesList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 36, textAlign: 'center', color: 'var(--color-brown-400)' }}>
                    טרם הוזנו תנועות לחודש זה. ניתן להעלות קובצי CSV או להזין תקבול/הוצאה ידנית בכפתורים למעלה.
                  </td>
                </tr>
              ) : (
                monthExpensesList.map((exp) => {
                  const isIncome = exp.amount < 0;
                  return (
                    <tr 
                      key={exp.id}
                      style={{ borderBottom: '1px solid var(--color-beige-divider)' }}
                    >
                      <td style={{ padding: '14px 18px', fontSize: '0.88rem', color: 'var(--color-brown-600)' }}>
                        {exp.date}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className={`badge ${
                          exp.source === 'בנק' ? 'badge-neutral' :
                          exp.source === 'חיובית' ? 'badge-gold' :
                          exp.source === 'מזומן' ? 'badge-success' : 'badge-neutral'
                        }`}>
                          {exp.source || 'בנק'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-brown-900)' }}>
                        {exp.category}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.9rem', color: 'var(--color-brown-700)' }}>
                        {exp.description}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 800, fontSize: '1rem', color: isIncome ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {isIncome ? `+${Math.abs(exp.amount).toLocaleString('he-IL')} ₪` : `-${exp.amount.toLocaleString('he-IL')} ₪`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Smart Manual Cash/Transfer In */}
      {showReceiptModal && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                הזנת תקבול ידני (מזומן / העברה ישירה)
              </h3>
              <button onClick={() => setShowReceiptModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--color-brown-500)" />
              </button>
            </div>

            <form onSubmit={submitReceipt} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Select Apartment */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                  בחר דירה ודייר:
                </label>
                <select
                  required
                  value={receiptAptId}
                  onChange={(e) => handleAptSelect(e.target.value)}
                  className="select"
                >
                  <option value="">-- בחר דירה --</option>
                  {(currentBuilding.apartments || []).map(apt => (
                    <option key={apt.id} value={apt.id}>
                      דירה {apt.aptNum} — {apt.tenantName} ({apt.monthlyDues} ₪ לחודש)
                      {apt.debtMonths && apt.debtMonths.length > 0 ? ` [חוב: ${apt.debtMonths.length} חודשים]` : ' [אין חוב]'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Debt Months Checkboxes (The exact feature we designed!) */}
              {selectedApt && (
                <div style={{ background: 'var(--color-gold-50)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-gold-200)' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-gold-700)', marginBottom: 8 }}>
                    חודשי חוב פתוחים עבור דירה {selectedApt.aptNum} ({selectedApt.tenantName}):
                  </div>

                  {selectedApt.debtMonths && selectedApt.debtMonths.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {selectedApt.debtMonths.map(month => (
                        <label 
                          key={month} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 6, 
                            background: '#FFFFFF', 
                            padding: '6px 12px', 
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-gold-300)',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontWeight: 600
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPaidMonths.includes(month)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPaidMonths(prev => [...prev, month]);
                              } else {
                                setSelectedPaidMonths(prev => prev.filter(m => m !== month));
                              }
                            }}
                          />
                          <span>חודש {month}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600 }}>
                      ✓ לדירה זו אין חובות פתוחים במערכת! התשלום ייזקף לחודש הנוכחי / כמקדמה.
                    </div>
                  )}
                </div>
              )}

              {/* Amount & Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                    סכום ששולם (₪):
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={receiptAmount}
                    onChange={(e) => setReceiptAmount(e.target.value)}
                    className="input"
                    placeholder="למשל 300"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                    אופן התשלום:
                  </label>
                  <select
                    value={receiptType}
                    onChange={(e) => setReceiptType(e.target.value)}
                    className="select"
                  >
                    <option value="מזומן">מזומן</option>
                    <option value="העברה בנקאית ישירה">העברה בנקאית ישירה</option>
                    <option value="צ'ק">צ'ק</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                  הערות / אסמכתא (אופציונלי):
                </label>
                <input
                  type="text"
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  className="input"
                  placeholder="למשל: נמסר לידי ועד הבית / אסמכתא 54321"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowReceiptModal(false)} className="btn btn-secondary">
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  שמירת תקבול וסגירת חובות
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Manual Cash Expense Out */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                הזנת הוצאת מזומן ידנית
              </h3>
              <button onClick={() => setShowExpenseModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--color-brown-500)" />
              </button>
            </div>

            <form onSubmit={submitExpense} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                  קטגוריה / סעיף הוצאה:
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="select"
                >
                  <option value="ניקיון">ניקיון</option>
                  <option value="חומרי ניקוי">חומרי ניקוי</option>
                  <option value="חשבון חשמל">חשבון חשמל</option>
                  <option value="ביטוח מעליות">ביטוח מעליות</option>
                  <option value="מהנדס מעליות">מהנדס מעליות</option>
                  <option value="מפיץ ריח">מפיץ ריח</option>
                  <option value="הוצאות גינון">הוצאות גינון</option>
                  <option value="תחזוקה שוטפת והוצאות חריגות">תחזוקה שוטפת והוצאות חריגות</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                    סכום ההוצאה (₪):
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="input"
                    placeholder="למשל 150"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                    תאריך ההוצאה:
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                  פירוט ההוצאה:
                </label>
                <input
                  type="text"
                  required
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="input"
                  placeholder="למשל: רכישת נורות לד לחדר מדרגות / שכר מנקה מזדמן"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowExpenseModal(false)} className="btn btn-secondary">
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  שמירת הוצאה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
