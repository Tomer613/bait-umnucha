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
  const [turnoverBuildingId, setTurnoverBuildingId] = useState('');
  const [turnoverAptId, setTurnoverAptId] = useState('');
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantDues, setNewTenantDues] = useState('');
  const [newTenantPaymentMethod, setNewTenantPaymentMethod] = useState('חיובית');
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().slice(0, 10));

  // חיפוש וסינון למצב כלל הבניינים
  const [masterSearch, setMasterSearch] = useState('');
  const [masterFilterDebt, setMasterFilterDebt] = useState('all'); // 'all' | 'debt_only'

  // הודעת סטטוס
  const [statusMsg, setStatusMsg] = useState(null);

  // העלאת קובץ אקסל דיירים (תומך בבניין יחיד או מאסטר)
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const sheets = await readTenantExcelFile(file);
      const sheetNames = Object.keys(sheets);

      if (sheetNames.length > 1 || !currentBuilding) {
        importMasterSheets(sheets);
        setStatusMsg(`הקובץ נקלט כקובץ מאסטר! עודכנו ${sheetNames.length} לשוניות בניינים בהצלחה.`);
      } else {
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
  const openTurnoverModal = (apt, bId = null) => {
    setTurnoverBuildingId(bId || currentBuilding?.id || '');
    setTurnoverAptId(apt.id);
    setNewTenantDues(apt.monthlyDues);
    setShowTurnoverModal(true);
  };

  // שליחת טופס החלפת דייר
  const submitTurnover = (e) => {
    e.preventDefault();
    const targetBId = turnoverBuildingId || currentBuilding?.id;
    if (!targetBId || !turnoverAptId || !newTenantName) return;

    handleTenantTurnover(
      targetBId,
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

  const targetBldForTurnover = buildings.find(b => b.id === (turnoverBuildingId || currentBuilding?.id));
  const selectedAptForTurnover = (targetBldForTurnover?.apartments || []).find(a => a.id === turnoverAptId);

  // כלל הדירות בכלל 15 הבניינים
  const allMasterApartments = buildings.flatMap(b => (b.apartments || []).map(apt => ({
    ...apt,
    buildingId: b.id,
    buildingName: b.name,
    buildingColor: b.color || { primary: 'var(--color-gold-500)', tint: 'var(--color-gold-50)' }
  })));

  const filteredMasterApts = allMasterApartments.filter(apt => {
    if (masterFilterDebt === 'debt_only' && (!apt.debtMonths || apt.debtMonths.length === 0)) {
      return false;
    }
    if (!masterSearch) return true;
    const q = masterSearch.toLowerCase();
    return (
      (apt.tenantName && apt.tenantName.toLowerCase().includes(q)) ||
      (apt.buildingName && apt.buildingName.toLowerCase().includes(q)) ||
      (apt.phone && apt.phone.includes(q)) ||
      (apt.email && apt.email.toLowerCase().includes(q)) ||
      String(apt.aptNum).includes(q)
    );
  });

  const totalInDebt = allMasterApartments.filter(a => a.debtMonths && a.debtMonths.length > 0).length;

  if (!currentBuilding) {
    return (
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Master Control Bar */}
        <div className="card" style={{ padding: '22px 24px', marginBottom: 24, border: '1.5px solid var(--color-gold-300)', background: 'linear-gradient(135deg, #FFFFFF 0%, var(--color-gold-50) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="badge badge-gold" style={{ fontSize: '0.8rem' }}>מאגר דיירים מרכזי</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-gold-700)', fontWeight: 700 }}>
                  כלל {buildings.length} הבניינים המנוהלים
                </span>
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
                ספריית דירות ודיירים מתחלפים
              </h2>
              <p style={{ color: 'var(--color-brown-600)', fontSize: '0.92rem', margin: '6px 0 0' }}>
                איתור מהיר של דיירים בכלל הבניינים, ביצוע החלפת דייר עם שמירת חובות עבר, וייבוא/ייצוא אקסל מאסטר.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => downloadMasterBuildingsTemplate(buildings)}
                className="btn btn-secondary"
                title="הורדת קובץ אקסל רב-לשוניות מוכן למילוי או עריכה"
              >
                <Download size={16} />
                <span>הורדת תבנית מאסטר (15 לשוניות)</span>
              </button>

              <label 
                className="btn btn-primary" 
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                title="העלאת קובץ אקסל מרובה לשוניות לעדכון כלל הבניינים"
              >
                <Upload size={16} />
                <span>טעינת אקסל מאסטר</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Status Message Notification */}
        {statusMsg && (
          <div style={{
            background: 'var(--color-gold-100)',
            border: '1.5px solid var(--color-gold-400)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--color-brown-900)',
            fontWeight: 700
          }}>
            <Check size={20} color="var(--color-gold-600)" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Master KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-gold-500)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>סה״כ יחידות דיור</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brown-900)', marginTop: 4 }}>
              {allMasterApartments.length} דירות
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-gold-700)', fontWeight: 700 }}>
              ב-{buildings.length} בניינים מנוהלים
            </span>
          </div>

          <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-success)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>דירות במצב תקין (משולם)</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-success)', marginTop: 4 }}>
              {allMasterApartments.length - totalInDebt}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-600)' }}>
              ללא חובות פתוחים
            </span>
          </div>

          <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-danger)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>דירות בפיגור תשלומים</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: totalInDebt > 0 ? 'var(--color-danger)' : 'var(--color-success)', marginTop: 4 }}>
              {totalInDebt}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-danger)', fontWeight: 700 }}>
              נדרש טיפול גבייה
            </span>
          </div>
        </div>

        {/* Master Search & Filter Controls */}
        <div className="card" style={{ padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ flex: '1 1 340px' }}>
              <input
                type="text"
                value={masterSearch}
                onChange={(e) => setMasterSearch(e.target.value)}
                placeholder="חיפוש דייר לפי שם, טלפון, אימייל, מספר דירה או שם בניין..."
                className="input"
                style={{ fontSize: '0.92rem', padding: '10px 14px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setMasterFilterDebt('all')}
                className={`btn btn-sm ${masterFilterDebt === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              >
                כל הדירות ({allMasterApartments.length})
              </button>

              <button
                type="button"
                onClick={() => setMasterFilterDebt('debt_only')}
                className={`btn btn-sm ${masterFilterDebt === 'debt_only' ? 'btn-primary' : 'btn-secondary'}`}
                style={masterFilterDebt === 'debt_only' ? { background: 'var(--color-danger)', borderColor: 'var(--color-danger)' } : {}}
              >
                דירות בחוב בלבד ({totalInDebt})
              </button>
            </div>
          </div>
        </div>

        {/* Master Apartments Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: 'var(--color-gold-100)', borderBottom: '2px solid var(--color-gold-300)', color: 'var(--color-brown-900)' }}>
                  <th style={{ padding: '12px 14px' }}>בניין</th>
                  <th style={{ padding: '12px 14px' }}>דירה</th>
                  <th style={{ padding: '12px 14px' }}>שם דייר</th>
                  <th style={{ padding: '12px 14px' }}>טלפון</th>
                  <th style={{ padding: '12px 14px' }}>אימייל</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>דמי ועד</th>
                  <th style={{ padding: '12px 14px' }}>אופן תשלום</th>
                  <th style={{ padding: '12px 14px' }}>סטטוס חוב</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredMasterApts.map((apt, idx) => {
                  const debtCount = apt.debtMonths?.length || 0;
                  const debtSum = debtCount * (apt.monthlyDues || 0);

                  return (
                    <tr
                      key={`${apt.buildingId}-${apt.id}`}
                      style={{
                        borderBottom: '1px solid var(--color-beige-divider)',
                        background: debtCount > 0 ? 'var(--color-danger-bg)' : idx % 2 === 0 ? '#FFFFFF' : 'var(--color-gold-50)'
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 800 }}>
                        <button
                          onClick={() => setSelectedBuildingId(apt.buildingId)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: 0,
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            fontWeight: 800,
                            color: 'var(--color-brown-900)'
                          }}
                          title={`מעבר לניהול בניין ${apt.buildingName}`}
                        >
                          <span style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: apt.buildingColor.primary,
                            display: 'inline-block'
                          }} />
                          <span style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>{apt.buildingName}</span>
                        </button>
                      </td>

                      <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                        דירה {apt.aptNum}
                      </td>

                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                        {apt.tenantName}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        {apt.phone ? (
                          <a href={`tel:${apt.phone}`} style={{ color: 'var(--color-gold-700)', textDecoration: 'none', fontWeight: 600 }}>
                            {apt.phone}
                          </a>
                        ) : '—'}
                      </td>

                      <td style={{ padding: '12px 14px', color: 'var(--color-brown-600)', fontSize: '0.82rem' }}>
                        {apt.email || '—'}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700 }}>
                        {apt.monthlyDues} ₪
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.78rem' }}>
                          {apt.paymentMethod || 'חיובית'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        {debtCount > 0 ? (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.82rem' }}>
                            {debtCount} חודשים ({debtSum.toLocaleString('he-IL')} ₪)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.82rem' }}>
                            ✓ תקין
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => openTurnoverModal(apt, apt.buildingId)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                          title="ביצוע נוהל החלפת דייר לדירה זו"
                        >
                          <UserMinus size={13} />
                          <span>החלפת דייר</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Tenant Turnover (Also rendered for Master View!) */}
        {showTurnoverModal && (
          <div className="modal-overlay" onClick={() => setShowTurnoverModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
                  נוהל החלפת דייר — דירה {selectedAptForTurnover?.aptNum} ({targetBldForTurnover?.name})
                </h3>
                <button onClick={() => setShowTurnoverModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {selectedAptForTurnover && (
                <div style={{
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  padding: 12,
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 16,
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-danger)', marginBottom: 4 }}>
                    פרטי דייר יוצא: {selectedAptForTurnover.tenantName}
                  </div>
                  <div>
                    חודשי חוב מצטברים: {selectedAptForTurnover.debtMonths?.length || 0} חודשים
                    ({((selectedAptForTurnover.debtMonths?.length || 0) * (selectedAptForTurnover.monthlyDues || 0)).toLocaleString('he-IL')} ₪).
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-brown-600)', marginTop: 4 }}>
                    חובות אלו יישארו שמורים על שמו של הדייר היוצא לצורך המשך טיפול, והדייר החדש יתחיל עם דף נקי.
                  </div>
                </div>
              )}

              <form onSubmit={submitTurnover} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                    שם הדייר החדש (שוכר / רוכש):
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
                    תאריך כניסה לתוקף:
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
                    בצע החלפת דייר
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }


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
