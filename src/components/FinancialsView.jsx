// ==========================================================================
// בית ומנוחה - ניהול כספים, קליטת CSV והזנה ידנית חכמה
// מבנה ממשק אחיד, עקבי וקבוע לחלוטין בין "כלל הבניינים" לבין "בניין מסוים"
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseBankReport, parseHiyuvitReport } from '../utils/csvParser';
import { 
  UploadCloud, 
  PlusCircle, 
  MinusCircle, 
  ArrowUpRight, 
  Check, 
  X,
  CreditCard,
  CheckCircle2,
  Wallet,
  AlertCircle
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

  const isGlobalMode = !currentBuilding || selectedBuildingId === 'all';

  // מודלים להזנה ידנית
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // בחירת בניין עבור מודלים במצב גלובלי
  const [modalBuildingId, setModalBuildingId] = useState(buildings[0]?.id || '');
  const activeModalBuilding = isGlobalMode 
    ? (buildings.find(b => b.id === modalBuildingId) || buildings[0])
    : currentBuilding;

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

  // --------------------------------------------------------------------------
  // חישוב מדדים מצרפיים ומקומיים
  // --------------------------------------------------------------------------
  const totalBalance = buildings.reduce((acc, b) => acc + (b.currentBalance || 0), 0);
  const updatedCount = buildings.filter(b => b.statusMonthUpdated).length;
  
  const allDebtsSum = buildings.reduce((acc, b) => {
    return acc + (b.apartments || []).reduce((sum, apt) => sum + ((apt.debtMonths?.length || 0) * (apt.monthlyDues || 0)), 0);
  }, 0);

  const allTransactions = buildings.flatMap(b => 
    (b.expenses || []).map(exp => ({ ...exp, buildingId: b.id, buildingName: b.name, buildingColor: b.color }))
  ).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const totalGlobalOut = allTransactions
    .filter(e => e.amount > 0)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalGlobalIn = allTransactions
    .filter(e => e.amount < 0)
    .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

  // נתוני בניין יחיד
  const singleBuildingExpenses = currentBuilding ? (currentBuilding.expenses || []) : [];
  const singleMonthExpenses = singleBuildingExpenses.filter(e => e.month === currentMonth || !e.month);
  
  const singleBuildingDebts = currentBuilding ? (currentBuilding.apartments || []).reduce((sum, apt) => {
    return sum + ((apt.debtMonths?.length || 0) * (apt.monthlyDues || 0));
  }, 0) : 0;

  const singleTotalOut = singleMonthExpenses
    .filter(e => e.amount > 0)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const singleTotalIn = singleMonthExpenses
    .filter(e => e.amount < 0)
    .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

  // הדירה שנבחרה כרגע בטופס תקבול
  const selectedApt = (activeModalBuilding?.apartments || []).find(a => a.id === receiptAptId);

  // עדכון דירה בטופס תקבול וקביעת חודשי חוב אוטומטית
  const handleAptSelect = (aptId) => {
    setReceiptAptId(aptId);
    const apt = (activeModalBuilding?.apartments || []).find(a => a.id === aptId);
    if (apt) {
      setReceiptAmount(apt.monthlyDues || 300);
      setSelectedPaidMonths(apt.debtMonths ? [...apt.debtMonths] : []);
    } else {
      setSelectedPaidMonths([]);
    }
  };

  // שמירת תקבול ידני
  const submitReceipt = (e) => {
    e.preventDefault();
    if (!activeModalBuilding || !receiptAptId || !receiptAmount) return;
    recordManualReceipt(
      activeModalBuilding.id,
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
    setUploadMessage(`תקבול על סך ${receiptAmount} ₪ נרשם בהצלחה לבניין ${activeModalBuilding.name}!`);
    setTimeout(() => setUploadMessage(null), 5000);
  };

  // שמירת הוצאת מזומן
  const submitExpense = (e) => {
    e.preventDefault();
    if (!activeModalBuilding || !expAmount || !expDesc) return;
    recordCashExpense(
      activeModalBuilding.id,
      expCategory,
      expAmount,
      expDesc,
      expDate
    );
    setShowExpenseModal(false);
    setExpAmount('');
    setExpDesc('');
    setUploadMessage(`הוצאת מזומן על סך ${expAmount} ₪ נרשמה בהצלחה לבניין ${activeModalBuilding.name}!`);
    setTimeout(() => setUploadMessage(null), 5000);
  };

  // העלאת קובץ עו"ש בנק
  const handleBankUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const targetBld = currentBuilding || buildings[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const parsed = parseBankReport(text);
        ingestBankReport(targetBld.id, parsed);
        setUploadMessage(`נקלטו בהצלחה ${parsed.length} תנועות מקובץ הבנק לבניין ${targetBld.name}!`);
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
    const targetBld = currentBuilding || buildings[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const parsed = parseHiyuvitReport(text);
        ingestHiyuvitReport(targetBld.id, parsed);
        setUploadMessage(`נקלטו בהצלחה ${parsed.length} תנועות גבייה מחברת חיובית לבניין ${targetBld.name}!`);
        setTimeout(() => setUploadMessage(null), 5000);
      } catch (err) {
        setUploadMessage(`שגיאה בפענוח קובץ חיובית: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const activeColor = currentBuilding?.color || {
    primary: 'var(--color-gold-500)',
    tint: 'var(--color-gold-50)',
    border: 'var(--color-gold-300)'
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* --------------------------------------------------------------------
          באנר ראשי עליון — מבנה קבוע ואחיד לחלוטין בשני המצבים!
          -------------------------------------------------------------------- */}
      <div className="card" style={{
        background: isGlobalMode 
          ? 'linear-gradient(135deg, #FFFFFF 0%, var(--color-gold-50) 100%)' 
          : `linear-gradient(135deg, #FFFFFF 0%, ${activeColor.tint} 100%)`,
        border: `1.5px solid ${isGlobalMode ? 'var(--color-gold-300)' : activeColor.border}`,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className="badge badge-gold" style={{ fontSize: '0.8rem' }}>
              {isGlobalMode ? "מבט-על כספי מצרפי" : "ניהול כספים פעיל"}
            </span>
            <span style={{ fontSize: '0.85rem', color: isGlobalMode ? 'var(--color-gold-700)' : activeColor.primary, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {!isGlobalMode && (
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: activeColor.primary, display: 'inline-block' }} />
              )}
              <span>{isGlobalMode ? `כלל ${buildings.length} הבניינים המנוהלים` : currentBuilding.name}</span>
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '0.78rem' }}>
              חודש {currentMonth}
            </span>
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
            {isGlobalMode ? "מרכז כספים ותנועות — כלל הבניינים" : `${currentBuilding.name} — ניהול כספים ותנועות`}
          </h2>

          <p style={{ color: 'var(--color-brown-600)', fontSize: '0.92rem', margin: '6px 0 0' }}>
            {isGlobalMode
              ? "ריכוז יתרות קופה, מעקב תנועות מכלל הבניינים וקליטת דוחות סליקה ועו״ש מרוכזים."
              : `${currentBuilding.address} | חשבון בנק: ${currentBuilding.bankAccount} | קוד בניין בחיובית: ${currentBuilding.hiyuvitCode || 'לא הוגדר'}`}
          </p>
        </div>

        {/* Current Balance Display Box — קבוע לחלוטין בשני המצבים! */}
        <div style={{ textAlign: 'left', background: '#FFFFFF', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-beige-border)', minWidth: 200 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>
            {isGlobalMode ? "יתרה מצרפית בכלל הקופות:" : "יתרה נוכחית בחשבון:"}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-brown-900)' }}>
            {(isGlobalMode ? totalBalance : (currentBuilding.currentBalance || 0)).toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
          </div>
          <span style={{ fontSize: '0.78rem', color: isGlobalMode ? 'var(--color-gold-700)' : activeColor.primary, fontWeight: 700 }}>
            {isGlobalMode ? `בכל ${buildings.length} חשבונות הבנק` : currentBuilding.bankAccount}
          </span>
        </div>
      </div>

      {/* הודעת סטטוס העלאה/פעולה */}
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

      {/* --------------------------------------------------------------------
          4 כפתורי פעולה בולטים — קבועים ונשארים תמיד בשני המצבים!
          -------------------------------------------------------------------- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Upload Bank CSV */}
        <label className="btn btn-primary" style={{ padding: '14px 18px', cursor: 'pointer', textAlign: 'center', justifyContent: 'center' }}>
          <input type="file" accept=".csv" onChange={handleBankUpload} style={{ display: 'none' }} />
          <UploadCloud size={19} />
          <span>העלאת דו"ח עו"ש בנק (CSV)</span>
        </label>

        {/* Upload Hiyuvit CSV */}
        <label className="btn btn-secondary" style={{ padding: '14px 18px', cursor: 'pointer', textAlign: 'center', justifyContent: 'center', borderColor: 'var(--color-gold-400)', color: 'var(--color-gold-700)', background: '#FFFFFF' }}>
          <input type="file" accept=".csv" onChange={handleHiyuvitUpload} style={{ display: 'none' }} />
          <CreditCard size={19} />
          <span>העלאת דו"ח חיובית (CSV)</span>
        </label>

        {/* Manual Cash In */}
        <button 
          onClick={() => setShowReceiptModal(true)}
          className="btn btn-secondary" 
          style={{ padding: '14px 18px', background: '#FFFFFF', borderColor: 'var(--color-success)', color: 'var(--color-success)', justifyContent: 'center' }}
        >
          <PlusCircle size={19} />
          <span>הזנת תקבול ידני (מזומן/העברה)</span>
        </button>

        {/* Manual Cash Out */}
        <button 
          onClick={() => setShowExpenseModal(true)}
          className="btn btn-secondary" 
          style={{ padding: '14px 18px', background: '#FFFFFF', borderColor: 'var(--color-danger)', color: 'var(--color-danger)', justifyContent: 'center' }}
        >
          <MinusCircle size={19} />
          <span>הזנת הוצאת מזומן ידנית</span>
        </button>
      </div>

      {/* --------------------------------------------------------------------
          4 אריחי מדדי מפתח (KPIs) — קבועים לחלוטין בשני המצבים!
          -------------------------------------------------------------------- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        {/* יתרת קופה */}
        <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-gold-500)', padding: '18px 20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)', marginBottom: 6 }}>
            {isGlobalMode ? "יתרה מצרפית בכלל הקופות" : "יתרת קופת הבניין"}
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            {(isGlobalMode ? totalBalance : (currentBuilding.currentBalance || 0)).toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-gold-600)' }}>
            {isGlobalMode ? `בכל ${buildings.length} חשבונות הבנק` : "חשבון פעיל בבנק"}
          </span>
        </div>

        {/* תקבולים ישירים */}
        <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-success)', padding: '18px 20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)', marginBottom: 6 }}>
            {isGlobalMode ? "סך תקבולים ישירים מצרפי" : `סך תקבולים ישירים (${currentMonth})`}
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {(isGlobalMode ? totalGlobalIn : singleTotalIn).toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)' }}>
            {isGlobalMode ? "מכלל הבניינים המנוהלים" : "הפקדות והעברות שנקלטו"}
          </span>
        </div>

        {/* הוצאות שוטפות */}
        <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-danger)', padding: '18px 20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)', marginBottom: 6 }}>
            {isGlobalMode ? "סך הוצאות שוטפות מצרפי" : `סך הוצאות החודש (${currentMonth})`}
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-danger)' }}>
            {(isGlobalMode ? totalGlobalOut : singleTotalOut).toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)' }}>
            {isGlobalMode ? "תשלומים לספקים ותחזוקה" : "תחזוקה שוטפת וספקים"}
          </span>
        </div>

        {/* חובות פתוחים */}
        <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-brown-500)', padding: '18px 20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)', marginBottom: 6 }}>
            {isGlobalMode ? "סך חובות פתוחים מצרפי" : "סך חובות פתוחים בבניין"}
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            {(isGlobalMode ? allDebtsSum : singleBuildingDebts).toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)' }}>
            {isGlobalMode ? "בכלל הדירות בפיגור" : "דירות בפיגור תשלומים"}
          </span>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          אזור התוכן המרכזי
          -------------------------------------------------------------------- */}
      {isGlobalMode ? (
        <>
          {/* טבלת כל 15 קופות הבניינים */}
          <div className="card" style={{ background: '#FFFFFF', padding: 0, overflow: 'hidden', marginBottom: 28 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-beige-border)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                טבלת מצב קופות וחשבונות בנק לכל 15 הבניינים
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-brown-500)', marginTop: 4 }}>
                לחץ על ״כניסה לניהול כספים״ לביצוע הפקדה ידנית, הוצאה או קליטת קובץ עו״ש בנקאי לבניין ספציפי
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-cream-subtle)', borderBottom: '1px solid var(--color-beige-border)' }}>
                    <th style={{ padding: '12px 20px', fontWeight: 700 }}>בניין וכתובת</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>חשבון בנק</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>קוד בניין (חיובית)</th>
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
        </>
      ) : (
        /* Transactions Ledger Table for Single Building */
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
                {singleMonthExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 36, textAlign: 'center', color: 'var(--color-brown-400)' }}>
                      טרם הוזנו תנועות לחודש זה. ניתן להעלות קובצי CSV או להזין תקבול/הוצאה ידנית בכפתורים למעלה.
                    </td>
                  </tr>
                ) : (
                  singleMonthExpenses.map((exp) => {
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
      )}

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
              {/* במצב כלל הבניינים — בחירת בניין יעד */}
              {isGlobalMode && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                    שיוך לבניין:
                  </label>
                  <select
                    value={modalBuildingId}
                    onChange={(e) => {
                      setModalBuildingId(e.target.value);
                      setReceiptAptId('');
                      setSelectedPaidMonths([]);
                    }}
                    className="select"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Select Apartment */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                  בחר דירה ודייר בבניין {activeModalBuilding?.name}:
                </label>
                <select
                  required
                  value={receiptAptId}
                  onChange={(e) => handleAptSelect(e.target.value)}
                  className="select"
                >
                  <option value="">-- בחר דירה --</option>
                  {(activeModalBuilding?.apartments || []).map(apt => (
                    <option key={apt.id} value={apt.id}>
                      דירה {apt.aptNum} — {apt.tenantName} ({apt.monthlyDues} ₪ לחודש)
                      {apt.debtMonths && apt.debtMonths.length > 0 ? ` [חוב: ${apt.debtMonths.length} חודשים]` : ' [אין חוב]'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Debt Months Checkboxes */}
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
              {/* במצב כלל הבניינים — בחירת בניין יעד */}
              {isGlobalMode && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                    שיוך לבניין:
                  </label>
                  <select
                    value={modalBuildingId}
                    onChange={(e) => setModalBuildingId(e.target.value)}
                    className="select"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

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
