// ==========================================================================
// בית ומנוחה - מחולל דוחות גמיש ומצבים שמורים (PDF / Excel / WhatsApp)
// מבנה ממשק אחיד, עקבי וקבוע לחלוטין בין "כלל הבניינים" לבין "בניין מסוים"
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportExpensesMatrixExcel, exportDebtsLedgerExcel, exportMasterSummaryExcel } from '../utils/excelHelper';
import { EXPENSE_CATEGORIES } from '../data/initialData';
import { 
  Printer, 
  FileSpreadsheet, 
  Share2, 
  Bookmark, 
  Plus, 
  Check, 
  Layers, 
  X
} from 'lucide-react';

export default function ReportGenerator() {
  const { currentBuilding, buildings, setSelectedBuildingId, selectedBuildingId, reportPresets, savePreset } = useApp();

  const isGlobalMode = !currentBuilding || selectedBuildingId === 'all';

  // הגדרות סינון הדו"ח
  const [selectedFunds, setSelectedFunds] = useState(['current']);
  const [reportScope, setReportScope] = useState('all'); // all | half
  const [viewType, setViewType] = useState('unified'); // unified | separate
  const [reportYear, setReportYear] = useState('2026');
  const [reportType, setReportType] = useState('expenses'); // expenses | debts

  // מודל שמירת מצב חדש
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // חישובים מרוכזים (כלל הבניינים או בניין מסוים)
  const totalBalance = isGlobalMode
    ? buildings.reduce((acc, b) => acc + (b.currentBalance || 0), 0)
    : (currentBuilding?.currentBalance || 0);

  const totalApartments = isGlobalMode
    ? buildings.reduce((acc, b) => acc + (b.apartments?.length || 0), 0)
    : (currentBuilding?.apartments?.length || 0);

  const totalExpectedMonthly = isGlobalMode
    ? buildings.reduce((acc, b) => acc + (b.apartments || []).reduce((sum, a) => sum + (a.monthlyDues || 0), 0), 0)
    : (currentBuilding?.apartments || []).reduce((sum, a) => sum + (a.monthlyDues || 0), 0);

  const totalDebts = isGlobalMode
    ? buildings.reduce((acc, b) => acc + (b.apartments || []).reduce((sum, a) => sum + ((a.debtMonths?.length || 0) * (a.monthlyDues || 0)), 0), 0)
    : (currentBuilding?.apartments || []).reduce((sum, a) => sum + ((a.debtMonths?.length || 0) * (a.monthlyDues || 0)), 0);

  const totalOpenIssues = isGlobalMode
    ? buildings.reduce((acc, b) => acc + (b.issues || []).filter(i => i.status === 'open').length, 0)
    : (currentBuilding?.issues || []).filter(i => i.status === 'open').length;

  // הפעלת מצב שמור
  const applyPreset = (preset) => {
    setSelectedFunds(preset.funds || ['current']);
    setReportScope(preset.scope || 'all');
    setViewType(preset.viewType || 'unified');
  };

  // שמירת מצב חדש
  const handleSavePreset = (e) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    savePreset({
      name: newPresetName.trim(),
      funds: selectedFunds,
      scope: reportScope,
      viewType
    });
    setNewPresetName('');
    setShowSavePreset(false);
  };

  // הדפסת הדו"ח
  const handlePrint = () => {
    window.print();
  };

  // שיתוף בוואטסאפ
  const handleWhatsAppShare = () => {
    if (isGlobalMode) {
      const text = encodeURIComponent(
        `📊 *סיכום ניהול מרוכז — בית ומנוחה*\n` +
        `📅 תאריך: ${new Date().toLocaleDateString('he-IL')}\n\n` +
        `🏢 סה״כ בניינים מנוהלים: ${buildings.length}\n` +
        `🏠 סה״כ יחידות דיור: ${totalApartments}\n` +
        `💰 סך יתרות בכלל הקופות: ${totalBalance.toLocaleString('he-IL')} ₪\n` +
        `📈 צפי גבייה חודשי כולל: ${totalExpectedMonthly.toLocaleString('he-IL')} ₪\n` +
        `⚠️ סך חובות פתוחים: ${totalDebts.toLocaleString('he-IL')} ₪\n` +
        `🔧 תקלות פתוחות בטיפול: ${totalOpenIssues}\n\n` +
        `הופק באמצעות מערכת בית ומנוחה.`
      );
      window.open(`https://wa.me/?text=${text}`, '_blank');
    } else {
      const text = encodeURIComponent(
        `שלום וברכה, מצורף דו"ח ${reportType === 'expenses' ? 'הוצאות' : 'תקבולים וחובות'} עבור ${currentBuilding.name} לשנת ${reportYear}.\nהופק באמצעות מערכת בית ומנוחה.`
      );
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  // ייצוא אקסל
  const handleExcelExport = () => {
    if (isGlobalMode) {
      exportMasterSummaryExcel(buildings);
    } else {
      if (reportType === 'expenses') {
        exportExpensesMatrixExcel(currentBuilding, reportYear, EXPENSE_CATEGORIES);
      } else {
        exportDebtsLedgerExcel(currentBuilding);
      }
    }
  };

  const months = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

  const activeColor = currentBuilding?.color || {
    primary: 'var(--color-gold-500)',
    tint: 'var(--color-gold-50)',
    border: 'var(--color-gold-300)'
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* --------------------------------------------------------------------
          באנר ראשי עליון — קבוע ואחיד לחלוטין בשני המצבים!
          -------------------------------------------------------------------- */}
      <div className="card no-print" style={{ 
        padding: '22px 24px', 
        marginBottom: 24, 
        border: `1.5px solid ${isGlobalMode ? 'var(--color-gold-300)' : activeColor.border}`, 
        background: isGlobalMode 
          ? 'linear-gradient(135deg, #FFFFFF 0%, var(--color-gold-50) 100%)' 
          : `linear-gradient(135deg, #FFFFFF 0%, ${activeColor.tint} 100%)` 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-gold" style={{ fontSize: '0.8rem' }}>
                {isGlobalMode ? "מבט-על כלל ארגוני" : "מחולל דוחות פעיל"}
              </span>
              <span style={{ fontSize: '0.85rem', color: isGlobalMode ? 'var(--color-gold-700)' : activeColor.primary, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {!isGlobalMode && (
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: activeColor.primary, display: 'inline-block' }} />
                )}
                <span>{isGlobalMode ? `כלל ${buildings.length} הבניינים המנוהלים` : currentBuilding.name}</span>
              </span>
            </div>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
              מחולל דוחות ניהוליים ואקסל
            </h2>

            <p style={{ color: 'var(--color-brown-600)', fontSize: '0.92rem', margin: '6px 0 0' }}>
              {isGlobalMode
                ? "הפקת דוחות מרכזיים לכלל הקופות, ייצוא קובץ אקסל רב-לשוניות מלא, ודוחות סטטוס חובות רוחביים."
                : `הפקת דוחות שנתיים, מעקב הוצאות חודשיות וריכוז חובות דיירים עבור ${currentBuilding.name}.`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button 
              onClick={handleExcelExport} 
              className="btn btn-primary"
              title={isGlobalMode ? "הורדת קובץ אקסל עם לשונית סיכום הנהלה ולשונית נפרדת לכל בניין" : "הורדת קובץ אקסל מפורט לבניין זה"}
            >
              <FileSpreadsheet size={17} />
              <span>{isGlobalMode ? "הורדת אקסל מאסטר (15 לשוניות)" : "ייצוא לאקסל"}</span>
            </button>

            <button 
              onClick={handlePrint} 
              className="btn btn-secondary"
              title="הדפסת דוח מעוצב"
            >
              <Printer size={17} />
              <span>הדפסת דוח</span>
            </button>

            <button 
              onClick={handleWhatsAppShare} 
              className="btn btn-secondary"
              title="שיתוף סיכום מהיר בוואטסאפ"
              style={{ color: '#25D366' }}
            >
              <Share2 size={17} />
              <span>סיכום לוואטסאפ</span>
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          4 אריחי מדדי המפתח (KPIs) — קבועים ונשארים תמיד בשני המצבים!
          -------------------------------------------------------------------- */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '18px 20px', borderRight: `4px solid ${isGlobalMode ? 'var(--color-gold-500)' : activeColor.primary}` }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>יתרת קופה</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brown-900)', marginTop: 4 }}>
            {totalBalance.toLocaleString('he-IL')} ₪
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 700 }}>
            {isGlobalMode ? `מרוכז ב-${buildings.length} חשבונות בנק` : `בחשבון בנק: ${currentBuilding?.bankAccount || 'טרם הוזן'}`}
          </span>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-gold-400)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>צפי גבייה חודשי</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brown-900)', marginTop: 4 }}>
            {totalExpectedMonthly.toLocaleString('he-IL')} ₪
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-600)' }}>
            עבור {totalApartments} יחידות דיור
          </span>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-danger)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>סך חובות פתוחים</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: totalDebts > 0 ? 'var(--color-danger)' : 'var(--color-success)', marginTop: 4 }}>
            {totalDebts.toLocaleString('he-IL')} ₪
          </div>
          <span style={{ fontSize: '0.78rem', color: totalDebts > 0 ? 'var(--color-danger)' : 'var(--color-brown-600)', fontWeight: 700 }}>
            {totalDebts > 0 ? "חובות דיירים מצטברים" : "כל הדיירים שילמו"}
          </span>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-gold-600)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>תקלות ופניות בטיפול</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brown-900)', marginTop: 4 }}>
            {totalOpenIssues}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-600)' }}>
            {totalOpenIssues > 0 ? "קריאות שירות פתוחות" : "אין קריאות ממתינות"}
          </span>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          סרגל אפשרויות דוח וסינונים (מוצג בבניין מסוים)
          -------------------------------------------------------------------- */}
      {!isGlobalMode && (
        <div className="card no-print" style={{ padding: '14px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setReportType('expenses')}
                className={`btn btn-sm ${reportType === 'expenses' ? 'btn-primary' : 'btn-secondary'}`}
              >
                דוח הוצאות שנתי ({reportYear})
              </button>

              <button
                type="button"
                onClick={() => setReportType('debts')}
                className={`btn btn-sm ${reportType === 'debts' ? 'btn-primary' : 'btn-secondary'}`}
              >
                דוח תקבולים וחובות דיירים
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-700)' }}>שנת דוח:</label>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
                className="select"
                style={{ padding: '4px 10px', fontSize: '0.85rem' }}
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          מסמך דוח מעוצב להדפסה (Print Area) — מעוצב ואחיד לחלוטין
          -------------------------------------------------------------------- */}
      <div className="card print-area" style={{ padding: 40, background: '#FFFFFF', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-beige-border)' }}>
        
        {/* כותרת מכתב ממותגת */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `2px solid ${isGlobalMode ? 'var(--color-gold-500)' : activeColor.primary}`,
          paddingBottom: 24,
          marginBottom: 28
        }}>
          <div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--color-brown-900)', margin: 0, lineHeight: 1.1 }}>
              בית ומנוחה
            </h1>
            <div style={{ fontSize: '0.95rem', color: isGlobalMode ? 'var(--color-gold-600)' : activeColor.primary, fontWeight: 700, marginTop: 4 }}>
              חברה לניהול ועד בית ואחזקת מבנים בע״מ
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--color-brown-600)', marginTop: 4 }}>
              {isGlobalMode 
                ? `דוח הנהלה מרכזי — סטטוס כספי ותפעולי לכלל ${buildings.length} הבניינים המנוהלים`
                : `דוח ${reportType === 'expenses' ? 'הוצאות שנתי' : 'תקבולים וחובות'} — ${currentBuilding.name} (${currentBuilding.address})`}
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <img 
              src="/logo.png" 
              alt="בית ומנוחה" 
              style={{ height: 60, width: 'auto', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', marginTop: 6 }}>
              תאריך הפקה: {new Date().toLocaleDateString('he-IL')}
            </div>
          </div>
        </div>

        {/* תוכן הדוח: במצב כלל הבניינים -> טבלת מאסטר 15 בניינים */}
        {isGlobalMode ? (
          <div style={{ overflowX: 'auto', marginBottom: 28 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: 'var(--color-gold-100)', borderBottom: '2px solid var(--color-gold-300)', color: 'var(--color-brown-900)' }}>
                  <th style={{ padding: '12px 14px' }}>בניין מנוהל</th>
                  <th style={{ padding: '12px 14px' }}>כתובת</th>
                  <th style={{ padding: '12px 14px' }}>חשבון / חיובית</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>דירות</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>יתרת קופה</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>צפי גבייה</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>חובות דיירים</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>תקלות</th>
                  <th className="no-print" style={{ padding: '12px 14px', textAlign: 'center' }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((b, idx) => {
                  const bColor = b.color || { primary: 'var(--color-gold-500)', tint: 'var(--color-gold-50)' };
                  const aptCount = b.apartments?.length || 0;
                  const monthlyDues = (b.apartments || []).reduce((acc, a) => acc + (a.monthlyDues || 0), 0);
                  const debts = (b.apartments || []).reduce((acc, a) => acc + ((a.debtMonths?.length || 0) * (a.monthlyDues || 0)), 0);
                  const openIssues = (b.issues || []).filter(i => i.status === 'open').length;

                  return (
                    <tr 
                      key={b.id} 
                      style={{ 
                        borderBottom: '1px solid var(--color-beige-divider)',
                        background: idx % 2 === 0 ? '#FFFFFF' : 'var(--color-gold-50)'
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 800 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: bColor.primary,
                            display: 'inline-block',
                            flexShrink: 0
                          }} />
                          <span style={{ color: 'var(--color-brown-900)' }}>{b.name}</span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', color: 'var(--color-brown-600)', fontSize: '0.85rem' }}>
                        {b.address || '—'}
                      </td>

                      <td style={{ padding: '12px 14px', fontSize: '0.83rem', color: 'var(--color-brown-700)' }}>
                        <div>{b.bankAccount || 'חשבון טרם הוזן'}</div>
                        {b.hiyuvitCode && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-gold-700)', fontWeight: 600 }}>
                            קוד: {b.hiyuvitCode}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                        {aptCount}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, color: (b.currentBalance || 0) >= 0 ? 'var(--color-brown-900)' : 'var(--color-danger)' }}>
                        {(b.currentBalance || 0).toLocaleString('he-IL')} ₪
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--color-brown-800)' }}>
                        {monthlyDues.toLocaleString('he-IL')} ₪
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: debts > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {debts > 0 ? `${debts.toLocaleString('he-IL')} ₪` : '0 ₪'}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {openIssues > 0 ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>{openIssues} פתוחות</span>
                        ) : (
                          <span style={{ color: 'var(--color-brown-400)', fontSize: '0.8rem' }}>אין</span>
                        )}
                      </td>

                      <td className="no-print" style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedBuildingId(b.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                          title="צפייה בדוח מפורט של בניין זה"
                        >
                          דוח מפורט
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* שורת סיכום כוללת */}
                <tr style={{ background: 'var(--color-gold-200)', fontWeight: 900, borderTop: '2px solid var(--color-gold-400)' }}>
                  <td colSpan={3} style={{ padding: '14px 16px', color: 'var(--color-brown-900)', fontSize: '0.98rem' }}>
                    סה״כ כללי לכלל {buildings.length} הבניינים:
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--color-brown-900)', fontSize: '0.98rem' }}>
                    {totalApartments}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--color-brown-900)', fontSize: '1.02rem' }}>
                    {totalBalance.toLocaleString('he-IL')} ₪
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--color-brown-900)', fontSize: '1.02rem' }}>
                    {totalExpectedMonthly.toLocaleString('he-IL')} ₪
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'left', color: totalDebts > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontSize: '1.02rem' }}>
                    {totalDebts.toLocaleString('he-IL')} ₪
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--color-brown-900)' }}>
                    {totalOpenIssues}
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : reportType === 'expenses' ? (
          /* במצב בניין מסוים: מטריצת הוצאות שנתית */
          <div style={{ overflowX: 'auto', marginBottom: 28 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: 'var(--color-gold-100)', borderBottom: '2px solid var(--color-gold-300)', color: 'var(--color-brown-900)' }}>
                  <th style={{ padding: '12px 14px', minWidth: 160 }}>סעיף הוצאה</th>
                  {months.map((m, mIdx) => (
                    <th key={mIdx} style={{ padding: '10px 6px', textAlign: 'center', fontSize: '0.8rem' }}>{m}</th>
                  ))}
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>סך הכל</th>
                </tr>
              </thead>
              <tbody>
                {EXPENSE_CATEGORIES.map((cat, cIdx) => {
                  let catTotal = 0;
                  return (
                    <tr 
                      key={cIdx} 
                      style={{ 
                        borderBottom: '1px solid var(--color-beige-divider)',
                        background: cIdx % 2 === 0 ? '#FFFFFF' : 'var(--color-gold-50)'
                      }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-brown-900)' }}>{cat}</td>
                      {months.map((_, mIdx) => {
                        const monthKey = `${reportYear}-${String(mIdx + 1).padStart(2, '0')}`;
                        const sum = (currentBuilding.expenses || [])
                          .filter(exp => exp.month === monthKey && exp.category === cat)
                          .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                        catTotal += sum;
                        return (
                          <td key={mIdx} style={{ padding: '10px 6px', textAlign: 'center', color: sum ? 'var(--color-brown-900)' : 'var(--color-brown-300)' }}>
                            {sum ? sum.toLocaleString('he-IL') : '—'}
                          </td>
                        );
                      })}
                      <td style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                        {catTotal ? `${catTotal.toLocaleString('he-IL')} ₪` : '0 ₪'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* במצב בניין מסוים: דוח תקבולים וחובות */
          <div style={{ overflowX: 'auto', marginBottom: 28 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: 'var(--color-gold-100)', borderBottom: '2px solid var(--color-gold-300)', color: 'var(--color-brown-900)' }}>
                  <th style={{ padding: '12px 16px' }}>דירה</th>
                  <th style={{ padding: '12px 16px' }}>שם דייר / איש קשר</th>
                  <th style={{ padding: '12px 16px' }}>טלפון</th>
                  <th style={{ padding: '12px 16px' }}>אופן תשלום</th>
                  <th style={{ padding: '12px 16px' }}>דמי ועד</th>
                  <th style={{ padding: '12px 16px' }}>חודשים בחוב</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>סך חוב מצטבר</th>
                </tr>
              </thead>
              <tbody>
                {(currentBuilding.apartments || []).map((apt, idx) => {
                  const debtCount = apt.debtMonths ? apt.debtMonths.length : 0;
                  const debtTotal = debtCount * (apt.monthlyDues || 0);

                  return (
                    <tr 
                      key={apt.id}
                      style={{ 
                        borderBottom: '1px solid var(--color-beige-divider)',
                        background: debtCount > 0 ? 'var(--color-danger-bg)' : idx % 2 === 0 ? '#FFFFFF' : 'var(--color-gold-50)'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        דירה {apt.aptNum}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        {apt.tenantName}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-brown-600)' }}>
                        {apt.phone || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-neutral">{apt.paymentMethod || 'חיובית'}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        {apt.monthlyDues} ₪
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {debtCount > 0 ? (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>
                            {debtCount} חודשים ({apt.debtMonths.join(', ')})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                            ✓ משולם במלואו
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: debtCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {debtCount > 0 ? `${debtTotal.toLocaleString('he-IL')} ₪` : '0 ₪'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* חתימת מנהל ותחתית הדוח */}
        <div style={{ marginTop: 36, paddingTop: 18, borderTop: '1px solid var(--color-beige-border)', display: 'flex', justifyContent: 'space-between', color: 'var(--color-brown-600)', fontSize: '0.85rem' }}>
          <div>
            <strong>בית ומנוחה</strong> — ניהול ועד בית, שירותי אחזקה, מעליות וגבייה
          </div>
          <div>
            חתימת מנהל החברה: __________________
          </div>
        </div>

      </div>

    </div>
  );
}
