// ==========================================================================
// בית ומנוחה - מחולל דוחות גמיש ומצבים שמורים (PDF / Excel / WhatsApp)
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportExpensesMatrixExcel, exportDebtsLedgerExcel } from '../utils/excelHelper';
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

  if (!currentBuilding) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center', padding: 20 }}>
        <Building size={48} color="var(--color-gold-400)" style={{ marginBottom: 16 }} />
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
          אנא בחר בניין להפקת דוחות
        </h3>
        <p style={{ color: 'var(--color-brown-600)', marginBottom: 20 }}>
          בחר בניין כדי לצפות בדוחות, להדפיס או לייצא לאקסל:
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {buildings.slice(0, 6).map(b => (
            <button key={b.id} onClick={() => setSelectedBuildingId(b.id)} className="btn btn-secondary">
              {b.name}
            </button>
          ))}
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
