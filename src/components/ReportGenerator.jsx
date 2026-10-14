// ==========================================================================
// בית ומנוחה - מחולל דוחות גמיש ומצבים שמורים (PDF / Excel / WhatsApp)
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
  SlidersHorizontal, 
  Building, 
  Check, 
  Calendar,
  Layers,
  ArrowDownToLine
} from 'lucide-react';

export default function ReportGenerator() {
  const { currentBuilding, buildings, setSelectedBuildingId, reportPresets, savePreset } = useApp();

  // הגדרות סינון הדו"ח
  const [selectedFunds, setSelectedFunds] = useState(['current']);
  const [reportScope, setReportScope] = useState('all'); // all | half
  const [viewType, setViewType] = useState('unified'); // unified | separate
  const [reportYear, setReportYear] = useState('2026');
  const [reportType, setReportType] = useState('expenses'); // expenses | debts

  // מודל שמירת מצב חדש
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // חישובים אגרגטיביים למצב "כלל הבניינים"
  const totalBalances = buildings.reduce((acc, b) => acc + (b.currentBalance || 0), 0);
  const totalApartments = buildings.reduce((acc, b) => acc + (b.apartments?.length || 0), 0);
  const totalExpectedMonthly = buildings.reduce((acc, b) => acc + (b.apartments || []).reduce((sum, a) => sum + (a.monthlyDues || 0), 0), 0);
  const totalDebts = buildings.reduce((acc, b) => acc + (b.apartments || []).reduce((sum, a) => sum + ((a.debtMonths?.length || 0) * (a.monthlyDues || 0)), 0), 0);
  const totalOpenIssues = buildings.reduce((acc, b) => acc + (b.issues || []).filter(i => i.status === 'open').length, 0);

  const handleMasterExcelExport = () => {
    exportMasterSummaryExcel(buildings);
  };

  const handleMasterWhatsAppShare = () => {
    const text = encodeURIComponent(
      `📊 *סיכום ניהול מרוכז — בית ומנוחה*\n` +
      `📅 תאריך: ${new Date().toLocaleDateString('he-IL')}\n\n` +
      `🏢 סה״כ בניינים מנוהלים: ${buildings.length}\n` +
      `🏠 סה״כ יחידות דיור: ${totalApartments}\n` +
      `💰 סך יתרות בכלל הקופות: ${totalBalances.toLocaleString('he-IL')} ₪\n` +
      `📈 צפי גבייה חודשי כולל: ${totalExpectedMonthly.toLocaleString('he-IL')} ₪\n` +
      `⚠️ סך חובות פתוחים: ${totalDebts.toLocaleString('he-IL')} ₪\n` +
      `🔧 תקלות פתוחות בטיפול: ${totalOpenIssues}\n\n` +
      `הופק באמצעות מערכת בית ומנוחה.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (!currentBuilding) {
    return (
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Master Control Bar (No-Print) */}
        <div className="card no-print" style={{ padding: '22px 24px', marginBottom: 24, border: '1.5px solid var(--color-gold-300)', background: 'linear-gradient(135deg, #FFFFFF 0%, var(--color-gold-50) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="badge badge-gold" style={{ fontSize: '0.8rem' }}>מבט-על כלל ארגוני</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-gold-700)', fontWeight: 700 }}>
                  מרכז שליטה לכלל {buildings.length} הבניינים המנוהלים
                </span>
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
                מחולל דוחות ניהוליים ואקסל מאסטר
              </h2>
              <p style={{ color: 'var(--color-brown-600)', fontSize: '0.92rem', margin: '6px 0 0' }}>
                הפקת דוחות מרכזיים לכלל הקופות, ייצוא קובץ אקסל רב-לשוניות מלא, ודוחות סטטוס חובות רוחביים.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button 
                onClick={handleMasterExcelExport} 
                className="btn btn-primary"
                title="הורדת קובץ אקסל עם לשונית סיכום הנהלה ולשונית נפרדת לכל בניין"
              >
                <FileSpreadsheet size={17} />
                <span>הורדת אקסל מאסטר (15 לשוניות)</span>
              </button>

              <button 
                onClick={() => window.print()} 
                className="btn btn-secondary"
                title="הדפסת דוח הנהלה מרכזי מעוצב"
              >
                <Printer size={17} />
                <span>הדפסת דוח הנהלה</span>
              </button>

              <button 
                onClick={handleMasterWhatsAppShare} 
                className="btn btn-secondary"
                title="שיתוף סיכום מנהל מהיר בוואטסאפ"
                style={{ color: '#25D366' }}
              >
                <Share2 size={17} />
                <span>סיכום לוואטסאפ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Master KPI Cards (No-Print) */}
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-gold-500)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>סך יתרות בכלל הקופות</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brown-900)', marginTop: 4 }}>
              {totalBalances.toLocaleString('he-IL')} ₪
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 700 }}>
              מרוכז ב-{buildings.length} חשבונות בנק
            </span>
          </div>

          <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-gold-400)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>צפי גבייה חודשי כולל</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brown-900)', marginTop: 4 }}>
              {totalExpectedMonthly.toLocaleString('he-IL')} ₪
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-600)' }}>
              עבור {totalApartments} יחידות דיור
            </span>
          </div>

          <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-danger)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>סך חובות פתוחים בכלל הבניינים</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: totalDebts > 0 ? 'var(--color-danger)' : 'var(--color-success)', marginTop: 4 }}>
              {totalDebts.toLocaleString('he-IL')} ₪
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-600)' }}>
              חובות דיירים מצטברים
            </span>
          </div>

          <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-gold-600)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>תקלות ופניות בטיפול</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brown-900)', marginTop: 4 }}>
              {totalOpenIssues}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-600)' }}>
              קריאות שירות פתוחות
            </span>
          </div>
        </div>

        {/* Master Printable Letterhead Document */}
        <div className="card print-area" style={{ padding: 40, background: '#FFFFFF', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-beige-border)' }}>
          
          {/* Printable Letterhead Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid var(--color-gold-500)',
            paddingBottom: 24,
            marginBottom: 28
          }}>
            <div>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--color-brown-900)', margin: 0, lineHeight: 1.1 }}>
                בית ומנוחה
              </h1>
              <div style={{ fontSize: '0.95rem', color: 'var(--color-gold-600)', fontWeight: 700, marginTop: 4 }}>
                חברה לניהול ועד בית ואחזקת מבנים בע״מ
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--color-brown-600)', marginTop: 4 }}>
                דוח הנהלה מרכזי — סטטוס כספי ותפעולי לכלל {buildings.length} הבניינים המנוהלים
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

          {/* Master Table */}
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
                    {totalBalances.toLocaleString('he-IL')} ₪
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

          {/* Report Footer / Signature */}
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
    const text = encodeURIComponent(
      `שלום וברכה, מצורף דו"ח ${reportType === 'expenses' ? 'הוצאות' : 'תקבולים וחובות'} עבור ${currentBuilding.name} לשנת ${reportYear}.\nהופק באמצעות מערכת בית ומנוחה.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // ייצוא אקסל
  const handleExcelExport = () => {
    if (reportType === 'expenses') {
      exportExpensesMatrixExcel(currentBuilding, reportYear, EXPENSE_CATEGORIES);
    } else {
      exportDebtsLedgerExcel(currentBuilding);
    }
  };

  // חודשי השנה לטבלת הוצאות
  const months = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Top Presets Bar (No-Print) */}
      <div className="no-print" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bookmark size={18} color="var(--color-gold-600)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-brown-900)' }}>
              מצבים שמורים לבחירה מהירה:
            </span>
          </div>

          <button 
            onClick={() => setShowSavePreset(true)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.82rem' }}
          >
            <Plus size={14} />
            <span>שמור הגדרות נוכחיות כמצב חדש</span>
          </button>
        </div>

        {/* Preset Pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {reportPresets.map(pre => (
            <button
              key={pre.id}
              onClick={() => applyPreset(pre)}
              className="btn btn-secondary btn-sm"
              style={{
                borderColor: 'var(--color-gold-300)',
                background: '#FFFFFF',
                borderRadius: 'var(--radius-full)'
              }}
            >
              <span>{pre.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls & Filters Card (No-Print) */}
      <div className="card no-print" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, alignItems: 'center' }}>
          
          {/* Report Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brown-700)', marginBottom: 6 }}>
              סוג הדו"ח להפקה:
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="select"
              style={{ fontWeight: 700 }}
            >
              <option value="expenses">📊 דו"ח הוצאות מרוכז (טבלה שנתית)</option>
              <option value="debts">👥 דו"ח תקבולים וחובות דיירים</option>
            </select>
          </div>

          {/* Funds Checkboxes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brown-700)', marginBottom: 6 }}>
              קופות לכלול בדו"ח:
            </label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedFunds.includes('current')}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedFunds(prev => [...prev, 'current']);
                    else setSelectedFunds(prev => prev.filter(f => f !== 'current'));
                  }}
                />
                <span>קופת ועד שוטפת</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedFunds.includes('special')}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedFunds(prev => [...prev, 'special']);
                    else setSelectedFunds(prev => prev.filter(f => f !== 'special'));
                  }}
                />
                <span>קרן מיוחדת (צנרת/גג)</span>
              </label>
            </div>
          </div>

          {/* Scope Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brown-700)', marginBottom: 6 }}>
              היקף הדירות:
            </label>
            <select
              value={reportScope}
              onChange={(e) => setReportScope(e.target.value)}
              className="select"
            >
              <option value="all">כלל דירות הבניין</option>
              <option value="half">כניסה א' (חצי בניין)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button onClick={handlePrint} className="btn btn-primary">
              <Printer size={18} />
              <span>הדפסה / שמירה כ-PDF</span>
            </button>

            <button onClick={handleExcelExport} className="btn btn-secondary">
              <FileSpreadsheet size={18} color="var(--color-success)" />
              <span>ייצוא לאקסל</span>
            </button>

            <button onClick={handleWhatsAppShare} className="btn btn-secondary" title="שיתוף בוואטסאפ">
              <Share2 size={18} color="#25D366" />
            </button>
          </div>

        </div>
      </div>

      {/* Styled Printable Report View (Visible both on screen and on print) */}
      <div className="card" style={{ padding: 36, background: '#FFFFFF', minHeight: 600 }}>
        
        {/* Printable Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid var(--color-gold-400)',
          paddingBottom: 20,
          marginBottom: 28
        }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--color-brown-900)', marginBottom: 4 }}>
              בית ומנוחה — ניהול ועד בית
            </h1>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-gold-600)' }}>
              {reportType === 'expenses' ? 'דו"ח הוצאות שנתי מרוכז' : 'דו"ח מצב תקבולים וחובות דיירים'} — {currentBuilding.name}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-brown-600)', marginTop: 4 }}>
              כתובת: {currentBuilding.address} | שנת דוח: {reportYear}
            </p>
          </div>

          <div style={{ textAlign: 'left' }}>
            <img 
              src="/logo.png" 
              alt="לוגו בית ומנוחה" 
              style={{ height: 60, width: 'auto', objectFit: 'contain', marginBottom: 6 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)' }}>
              תאריך הפקה: {new Date().toLocaleDateString('he-IL')}
            </div>
          </div>
        </div>

        {/* Report Content 1: Expenses Matrix */}
        {reportType === 'expenses' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: 'var(--color-gold-100)', borderBottom: '2px solid var(--color-gold-300)', color: 'var(--color-brown-900)' }}>
                  <th style={{ padding: '10px 14px', minWidth: 160 }}>סעיף תקציבי / קטגוריה</th>
                  {months.map(m => (
                    <th key={m} style={{ padding: '10px 8px', textAlign: 'center' }}>{m}</th>
                  ))}
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800 }}>סך הכל שנתי</th>
                </tr>
              </thead>
              <tbody>
                {EXPENSE_CATEGORIES.map((cat, idx) => {
                  let catTotal = 0;
                  return (
                    <tr 
                      key={cat}
                      style={{ 
                        borderBottom: '1px solid var(--color-beige-divider)',
                        background: idx % 2 === 0 ? '#FFFFFF' : 'var(--color-gold-50)'
                      }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--color-brown-900)' }}>
                        {cat}
                      </td>
                      {months.map((_, mIdx) => {
                        const monthKey = `${reportYear}-${String(mIdx + 1).padStart(2, '0')}`;
                        const sum = (currentBuilding.expenses || [])
                          .filter(e => e.month === monthKey && e.category === cat)
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
          /* Report Content 2: Debts & Collections Ledger */
          <div style={{ overflowX: 'auto' }}>
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

        {/* Report Footer / Signature */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--color-beige-border)', display: 'flex', justifyContent: 'space-between', color: 'var(--color-brown-600)', fontSize: '0.85rem' }}>
          <div>
            הופק באמצעות פורטל ניהול ועד בית — בית ומנוחה
          </div>
          <div>
            חתימת מנהל החברה: __________________
          </div>
        </div>

      </div>

      {/* Modal: Save Preset */}
      {showSavePreset && (
        <div className="modal-overlay" onClick={() => setShowSavePreset(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brown-900)', marginBottom: 16 }}>
              שמירת הגדרות דו"ח כמצב שמור (Preset)
            </h3>
            <form onSubmit={handleSavePreset}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>
                שם המצב השמור:
              </label>
              <input
                type="text"
                required
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="input"
                placeholder="למשל: דוח אמצע / דוח קופות גבייה מיוחד"
                style={{ marginBottom: 16 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowSavePreset(false)} className="btn btn-secondary">
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  שמור מצב
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
