// ==========================================================================
// בית ומנוחה - ספריית דירות, טעינת אקסל ונוהל דיירים מתחלפים
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  downloadSingleBuildingTemplate, 
  downloadMasterBuildingsTemplate, 
  readTenantExcelFile 
} from '../utils/excelHelper';
import { 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  UserCheck, 
  History, 
  AlertCircle, 
  Building, 
  X, 
  Check, 
  UserMinus,
  Phone,
  Mail
} from 'lucide-react';

export default function ApartmentRegistry() {
  const { 
    currentBuilding, 
    buildings, 
    setSelectedBuildingId, 
    importApartmentsForBuilding, 
    importMasterSheets,
    handleTenantTurnover 
  } = useApp();

  // מודל החלפת דייר
  const [showTurnoverModal, setShowTurnoverModal] = useState(false);
  const [turnoverAptId, setTurnoverAptId] = useState('');
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantDues, setNewTenantDues] = useState('');
  const [newTenantPaymentMethod, setNewTenantPaymentMethod] = useState('חיובית');
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().slice(0, 10));

  // הודעת סטטוס
  const [statusMsg, setStatusMsg] = useState(null);

  if (!currentBuilding) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center', padding: 20 }}>
        <Building size={48} color="var(--color-gold-400)" style={{ marginBottom: 16 }} />
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
          אנא בחר בניין לצפייה בספריית הדירות
        </h3>
        <p style={{ color: 'var(--color-brown-600)', marginBottom: 20 }}>
          בחר בניין כדי לנהל את הדיירים, לייבא מאקסל או לבצע החלפת דייר:
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

  // העלאת קובץ אקסל דיירים
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const sheets = await readTenantExcelFile(file);
      const sheetNames = Object.keys(sheets);

      if (sheetNames.length > 1) {
        // קובץ מאסטר מרובה לשוניות
        importMasterSheets(sheets);
        setStatusMsg(`הקובץ נקלט כקובץ מאסטר מרובה לשוניות! עודכנו כל הבניינים התואמים.`);
      } else {
        // קובץ לבניין בודד
        const firstSheet = sheetNames[0];
        const apts = sheets[firstSheet];
        importApartmentsForBuilding(currentBuilding.id, apts);
        setStatusMsg(`נקלטו בהצלחה ${apts.length} דירות לבניין ${currentBuilding.name}!`);
      }
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err) {
      setStatusMsg(`שגיאה בקריאת קובץ האקסל: ${err.message}`);
    }
    e.target.value = '';
  };

  // פתיחת מודל החלפת דייר
  const openTurnoverModal = (apt) => {
    setTurnoverAptId(apt.id);
    setNewTenantDues(apt.monthlyDues);
    setShowTurnoverModal(true);
  };

  // שליחת טופס החלפת דייר
  const submitTurnover = (e) => {
    e.preventDefault();
    if (!turnoverAptId || !newTenantName) return;

    handleTenantTurnover(
      currentBuilding.id,
      turnoverAptId,
      {
        tenantName: newTenantName,
        phone: newTenantPhone,
        email: newTenantEmail,
        monthlyDues: parseFloat(newTenantDues) || 300,
        paymentMethod: newTenantPaymentMethod
      },
      moveOutDate
    );

    setShowTurnoverModal(false);
    setNewTenantName('');
    setNewTenantPhone('');
    setNewTenantEmail('');
    setStatusMsg("נוהל החלפת הדייר הושלם: החוב ההיסטורי נשמר על הדייר היוצא, והדייר החדש נרשם עם כרטיס נקי!");
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const selectedAptForTurnover = (currentBuilding.apartments || []).find(a => a.id === turnoverAptId);

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Header & Excel Actions Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24
      }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            ספריית דירות ודיירים — {currentBuilding.name}
          </h2>
          <p style={{ color: 'var(--color-brown-600)', fontSize: '0.92rem' }}>
            ניהול דיירים, גובה דמי ועד, אופן תשלום ונוהל מעבר דירה
          </p>
        </div>

        {/* Excel Import / Export Buttons (All 4 requested options!) */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          
          {/* Upload Excel */}
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} style={{ display: 'none' }} />
            <Upload size={18} />
            <span>ייבוא דיירים מאקסל</span>
          </label>

          {/* Download Single Building Template */}
          <button 
            onClick={() => downloadSingleBuildingTemplate(currentBuilding.name)}
            className="btn btn-secondary"
            title="הורדת תבנית ריקה לבניין בודד"
          >
            <Download size={16} />
            <span>תבנית לבניין בודד</span>
          </button>

          {/* Download Master Multi-Sheet Template */}
          <button 
            onClick={() => downloadMasterBuildingsTemplate(buildings)}
            className="btn btn-secondary"
            title="הורדת תבנית מאסטר עם לשונית לכל 15 הבניינים"
          >
            <FileSpreadsheet size={16} color="var(--color-gold-600)" />
            <span>תבנית מאסטר לכל הבניינים</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div style={{
          background: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #C8E6C9',
          marginBottom: 20,
          fontWeight: 600
        }}>
          {statusMsg}
        </div>
      )}

      {/* Apartments Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: 'var(--color-gold-50)', borderBottom: '1px solid var(--color-beige-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-brown-900)' }}>
            רשימת דירות בבניין ({currentBuilding.apartments ? currentBuilding.apartments.length : 0} דירות רשומות)
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-brown-600)' }}>
            לחץ על "החלפת דייר" בעת מעבר דירה
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: '#FFFFFF', borderBottom: '1px solid var(--color-beige-border)', fontSize: '0.85rem', color: 'var(--color-brown-500)' }}>
                <th style={{ padding: '14px 18px' }}>דירה</th>
                <th style={{ padding: '14px 18px' }}>שם דייר / איש קשר</th>
                <th style={{ padding: '14px 18px' }}>טלפון</th>
                <th style={{ padding: '14px 18px' }}>אימייל</th>
                <th style={{ padding: '14px 18px' }}>דמי ועד חודשיים</th>
                <th style={{ padding: '14px 18px' }}>אופן תשלום</th>
                <th style={{ padding: '14px 18px' }}>מצב חוב</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {(!currentBuilding.apartments || currentBuilding.apartments.length === 0) ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--color-brown-400)' }}>
                    טרם הוזנו דירות לבניין זה. באפשרותך להעלות קובץ אקסל באמצעות הכפתור למעלה.
                  </td>
                </tr>
              ) : (
                currentBuilding.apartments.map((apt) => {
                  const debtCount = apt.debtMonths ? apt.debtMonths.length : 0;
                  const hasHistory = apt.turnoverHistory && apt.turnoverHistory.length > 0;

                  return (
                    <tr 
                      key={apt.id}
                      style={{ borderBottom: '1px solid var(--color-beige-divider)' }}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: 800, fontSize: '1rem', color: 'var(--color-brown-900)' }}>
                        דירה {apt.aptNum}
                      </td>

                      <td style={{ padding: '14px 18px', fontWeight: 700, fontSize: '0.95rem' }}>
                        <div>{apt.tenantName}</div>
                        {hasHistory && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-brown-500)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <History size={12} />
                            <span>דייר קודם: {apt.turnoverHistory[apt.turnoverHistory.length - 1].prevTenantName}</span>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px', fontSize: '0.9rem', color: 'var(--color-brown-700)' }}>
                        {apt.phone || '—'}
                      </td>

                      <td style={{ padding: '14px 18px', fontSize: '0.9rem', color: 'var(--color-brown-700)' }}>
                        {apt.email || '—'}
                      </td>

                      <td style={{ padding: '14px 18px', fontWeight: 700, fontSize: '0.95rem' }}>
                        {apt.monthlyDues} ₪
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span className="badge badge-neutral">
                          {apt.paymentMethod || 'חיובית'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {debtCount > 0 ? (
                          <span className="badge badge-danger">
                            {debtCount} חודשים בחוב
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            ללא חוב
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          onClick={() => openTurnoverModal(apt)}
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'var(--color-gold-300)', color: 'var(--color-gold-700)' }}
                        >
                          <UserMinus size={14} />
                          <span>החלפת דייר</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tenant Turnover (Closing account, keeping debt on old tenant) */}
      {showTurnoverModal && selectedAptForTurnover && (
        <div className="modal-overlay" onClick={() => setShowTurnoverModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                נוהל החלפת דייר — דירה {selectedAptForTurnover.aptNum}
              </h3>
              <button onClick={() => setShowTurnoverModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--color-brown-500)" />
              </button>
            </div>

            {/* Outgoing Tenant Card */}
            <div style={{ background: 'var(--color-rose-50)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-rose-200)', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: 'var(--color-rose-600)', marginBottom: 4 }}>
                דייר יוצא: {selectedAptForTurnover.tenantName}
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--color-brown-700)' }}>
                {selectedAptForTurnover.debtMonths && selectedAptForTurnover.debtMonths.length > 0 ? (
                  <span>
                    קיים חוב פתוח של {selectedAptForTurnover.debtMonths.length} חודשים ({selectedAptForTurnover.debtMonths.length * selectedAptForTurnover.monthlyDues} ₪). 
                    <strong> חוב זה יישמר בהיסטוריה על שמו של {selectedAptForTurnover.tenantName}</strong> ולא יועבר לדייר הנכנס!
                  </span>
                ) : (
                  <span>הדייר היוצא ללא חובות פתוחים.</span>
                )}
              </div>
            </div>

            {/* Incoming Tenant Form */}
            <form onSubmit={submitTurnover} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-brown-900)' }}>
                פרטי הדייר הנכנס (כרטיס נקי מיום הכניסה):
              </h4>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                  שם מלא של הדייר הנכנס:
                </label>
                <input
                  type="text"
                  required
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="input"
                  placeholder="למשל: משה לוי"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                    טלפון:
                  </label>
                  <input
                    type="tel"
                    value={newTenantPhone}
                    onChange={(e) => setNewTenantPhone(e.target.value)}
                    className="input"
                    placeholder="050-0000000"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                    אימייל:
                  </label>
                  <input
                    type="email"
                    value={newTenantEmail}
                    onChange={(e) => setNewTenantEmail(e.target.value)}
                    className="input"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                    דמי ועד חודשיים (₪):
                  </label>
                  <input
                    type="number"
                    value={newTenantDues}
                    onChange={(e) => setNewTenantDues(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                    אופן תשלום עיקרי:
                  </label>
                  <select
                    value={newTenantPaymentMethod}
                    onChange={(e) => setNewTenantPaymentMethod(e.target.value)}
                    className="select"
                  >
                    <option value="חיובית">חיובית (אשראי / מס"ב)</option>
                    <option value="העברה בנקאית">העברה בנקאית ישירה</option>
                    <option value="מזומן">מזומן</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                  תאריך עזיבה / כניסה:
                </label>
                <input
                  type="date"
                  value={moveOutDate}
                  onChange={(e) => setMoveOutDate(e.target.value)}
                  className="input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setShowTurnoverModal(false)} className="btn btn-secondary">
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  בצע החלפת דייר ושמור היסטוריית חוב
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
