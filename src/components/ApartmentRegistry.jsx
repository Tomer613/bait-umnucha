// ==========================================================================
// בית ומנוחה - ספריית דירות, טעינת אקסל ונוהל דיירים מתחלפים
// מבנה ממשק אחיד, עקבי וקבוע לחלוטין בין "כלל הבניינים" לבין "בניין מסוים"
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
  Download, 
  Upload, 
  Check, 
  UserMinus,
  X
} from 'lucide-react';

export default function ApartmentRegistry() {
  const { 
    currentBuilding, 
    buildings, 
    setSelectedBuildingId, 
    selectedBuildingId,
    importApartmentsForBuilding, 
    importMasterSheets,
    handleTenantTurnover 
  } = useApp();

  const isGlobalMode = !currentBuilding || selectedBuildingId === 'all';

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

  // חיפוש וסינון
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebt, setFilterDebt] = useState('all'); // 'all' | 'debt_only'

  // הודעת סטטוס
  const [statusMsg, setStatusMsg] = useState(null);

  // העלאת קובץ אקסל דיירים
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const sheets = await readTenantExcelFile(file);
      const sheetNames = Object.keys(sheets);

      if (sheetNames.length > 1 || isGlobalMode) {
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

  // הדירות הרלוונטיות לתצוגה כעת (בניין יחיד או כלל הבניינים)
  const displayedApartments = isGlobalMode
    ? buildings.flatMap(b => (b.apartments || []).map(apt => ({
        ...apt,
        buildingId: b.id,
        buildingName: b.name,
        buildingColor: b.color || { primary: 'var(--color-gold-500)', tint: 'var(--color-gold-50)' }
      })))
    : (currentBuilding?.apartments || []).map(apt => ({
        ...apt,
        buildingId: currentBuilding.id,
        buildingName: currentBuilding.name,
        buildingColor: currentBuilding.color || { primary: 'var(--color-gold-500)', tint: 'var(--color-gold-50)' }
      }));

  // סינון דיירים לפי חיפוש ומצב חוב
  const filteredApartments = displayedApartments.filter(apt => {
    if (filterDebt === 'debt_only' && (!apt.debtMonths || apt.debtMonths.length === 0)) {
      return false;
    }
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (apt.tenantName && apt.tenantName.toLowerCase().includes(q)) ||
      (apt.buildingName && apt.buildingName.toLowerCase().includes(q)) ||
      (apt.phone && apt.phone.includes(q)) ||
      (apt.email && apt.email.toLowerCase().includes(q)) ||
      String(apt.aptNum).includes(q)
    );
  });

  const totalInDebt = displayedApartments.filter(a => a.debtMonths && a.debtMonths.length > 0).length;
  const totalPaid = displayedApartments.length - totalInDebt;

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
                {isGlobalMode ? "מאגר דיירים מרכזי" : "ספריית דיירים פעילה"}
              </span>
              <span style={{ fontSize: '0.85rem', color: isGlobalMode ? 'var(--color-gold-700)' : activeColor.primary, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {!isGlobalMode && (
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: activeColor.primary, display: 'inline-block' }} />
                )}
                <span>{isGlobalMode ? `כלל ${buildings.length} הבניינים המנוהלים` : currentBuilding.name}</span>
              </span>
            </div>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
              ספריית דירות ודיירים מתחלפים
            </h2>

            <p style={{ color: 'var(--color-brown-600)', fontSize: '0.92rem', margin: '6px 0 0' }}>
              {isGlobalMode
                ? "איתור מהיר של דיירים בכלל הבניינים, ביצוע החלפת דייר עם שמירת חובות עבר, וייבוא/ייצוא אקסל מאסטר."
                : `ניהול דיירים, גובה דמי ועד, אופן תשלום וביצוע נוהל החלפת דייר עם שמירת היסטוריית חוב עבור ${currentBuilding.name}.`}
            </p>
          </div>

          {/* כפתורי פעולה — זהים לחלוטין בשני המצבים */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (isGlobalMode) {
                  downloadMasterBuildingsTemplate(buildings);
                } else {
                  downloadSingleBuildingTemplate(currentBuilding.name);
                }
              }}
              className="btn btn-secondary"
              title={isGlobalMode ? "הורדת תבנית אקסל רב-לשוניות לכלל הבניינים" : `הורדת תבנית אקסל ריקה לבניין ${currentBuilding?.name}`}
            >
              <Download size={16} />
              <span>{isGlobalMode ? "הורדת תבנית מאסטר (15 לשוניות)" : "הורדת תבנית אקסל לבניין"}</span>
            </button>

            <label 
              className="btn btn-primary" 
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              title="טעינת קובץ אקסל לעדכון רשימת הדיירים"
            >
              <Upload size={16} />
              <span>{isGlobalMode ? "טעינת אקסל מאסטר" : "טעינת אקסל לבניין"}</span>
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

      {/* הודעת סטטוס אם קיימת */}
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

      {/* --------------------------------------------------------------------
          3 אריחי מדדי המפתח (KPIs) — קבועים ונשארים תמיד בשני המצבים!
          -------------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '18px 20px', borderRight: `4px solid ${isGlobalMode ? 'var(--color-gold-500)' : activeColor.primary}` }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>סה״כ יחידות דיור</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brown-900)', marginTop: 4 }}>
            {displayedApartments.length} דירות
          </div>
          <span style={{ fontSize: '0.78rem', color: isGlobalMode ? 'var(--color-gold-700)' : activeColor.primary, fontWeight: 700 }}>
            {isGlobalMode ? `ב-${buildings.length} בניינים מנוהלים` : `בבניין ${currentBuilding?.name}`}
          </span>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-success)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>דירות במצב תקין (משולם)</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-success)', marginTop: 4 }}>
            {totalPaid}
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
          <span style={{ fontSize: '0.78rem', color: totalInDebt > 0 ? 'var(--color-danger)' : 'var(--color-brown-600)', fontWeight: 700 }}>
            {totalInDebt > 0 ? "נדרש טיפול גבייה" : "הגבייה סדורה לחלוטין"}
          </span>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          שורת חיפוש ופילטרים — קבועה ונשארת תמיד בשני המצבים!
          -------------------------------------------------------------------- */}
      <div className="card" style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ flex: '1 1 340px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isGlobalMode ? "חיפוש דייר לפי שם, טלפון, אימייל, מספר דירה או שם בניין..." : `חיפוש דייר ב-${currentBuilding?.name} לפי שם, טלפון, אימייל או דירה...`}
              className="input"
              style={{ fontSize: '0.92rem', padding: '10px 14px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setFilterDebt('all')}
              className={`btn btn-sm ${filterDebt === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              כל הדירות ({displayedApartments.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterDebt('debt_only')}
              className={`btn btn-sm ${filterDebt === 'debt_only' ? 'btn-primary' : 'btn-secondary'}`}
              style={filterDebt === 'debt_only' ? { background: 'var(--color-danger)', borderColor: 'var(--color-danger)' } : {}}
            >
              דירות בחוב בלבד ({totalInDebt})
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          טבלת הדיירים — מבנה עיצובי זהה לחלוטין בשני המצבים
          -------------------------------------------------------------------- */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: 'var(--color-gold-100)', borderBottom: '2px solid var(--color-gold-300)', color: 'var(--color-brown-900)' }}>
                {isGlobalMode && <th style={{ padding: '12px 14px' }}>בניין</th>}
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
              {filteredApartments.length === 0 ? (
                <tr>
                  <td colSpan={isGlobalMode ? 9 : 8} style={{ padding: 40, textAlign: 'center', color: 'var(--color-brown-400)' }}>
                    {searchTerm ? "לא נמצאו דירות התואמות את החיפוש." : "טרם הוזנו דירות. ניתן לייבא מאקסל באמצעות הכפתור למעלה."}
                  </td>
                </tr>
              ) : (
                filteredApartments.map((apt, idx) => {
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
                      {/* עמודת בניין (מוצגת במצב כלל הבניינים) */}
                      {isGlobalMode && (
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
                      )}

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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          מודל: נוהל החלפת דייר עם שמירת היסטוריית חוב
          -------------------------------------------------------------------- */}
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
