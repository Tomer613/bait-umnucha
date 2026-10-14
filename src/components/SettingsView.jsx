// ==========================================================================
// בית ומנוחה - מרכז הגדרות ועריכת מערכת ראשי
// ניהול תשתית הבניינים, עריכת דירות ודיירים, והגדרות אתר מרוכזות
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BUILDING_COLOR_PALETTE } from '../data/initialData';
import { formatFormattedDate } from '../utils/hebrewDate';
import {
  Building2,
  Users,
  Sliders,
  ShieldCheck,
  PlusCircle,
  Edit3,
  Trash2,
  Check,
  ArrowRight,
  Download,
  Upload,
  Save,
  X,
  Calendar,
  Palette,
  Home,
  Phone,
  Mail,
  DollarSign,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

export default function SettingsView({ onOpenAddBuilding }) {
  const {
    buildings,
    selectedBuildingId,
    setSelectedBuildingId,
    setActiveTab,
    updateBuilding,
    deleteBuilding,
    addApartment,
    updateApartment,
    deleteApartment,
    systemSettings,
    updateSystemSettings,
    exportFullBackup,
    importFullBackup
  } = useApp();

  // לשונית פנימית פעילה בתוך מרכז ההגדרות
  const [innerTab, setInnerTab] = useState('buildings'); // 'buildings' | 'apartments' | 'preferences' | 'backup'

  // הודעת סטטוס והצלחה
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const triggerSuccess = (msg) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // --- מצב עריכת בניין ---
  const [editingBuildingId, setEditingBuildingId] = useState(null);
  const [editBuildingForm, setEditBuildingForm] = useState({
    name: '',
    address: '',
    bankAccount: '',
    hiyuvitCode: '',
    color: null
  });

  const startEditBuilding = (bld) => {
    setEditingBuildingId(bld.id);
    setEditBuildingForm({
      name: bld.name,
      address: bld.address || '',
      bankAccount: bld.bankAccount || '',
      hiyuvitCode: bld.hiyuvitCode || '',
      color: bld.color || BUILDING_COLOR_PALETTE[0]
    });
  };

  const handleSaveBuilding = (bldId) => {
    updateBuilding(bldId, editBuildingForm);
    setEditingBuildingId(null);
    triggerSuccess(`פרטי בניין ${editBuildingForm.name} עודכנו בהצלחה!`);
  };

  const handleDeleteBuilding = (bld) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את הבניין "${bld.name}"? כל הנתונים, הדירות וההיסטוריה יימחקו!`)) {
      deleteBuilding(bld.id);
      triggerSuccess(`הבניין "${bld.name}" נמחק מהמערכת.`);
    }
  };

  // --- מצב ניהול דירות ---
  const [activeAptBuildingId, setActiveAptBuildingId] = useState(
    selectedBuildingId !== 'all' ? selectedBuildingId : (buildings[0]?.id || '')
  );
  const targetBuildingForApts = buildings.find(b => b.id === activeAptBuildingId) || buildings[0] || null;

  // מודל הוספת דירה
  const [isAddAptOpen, setIsAddAptOpen] = useState(false);
  const [newAptForm, setNewAptForm] = useState({
    aptNum: '',
    floor: '',
    entrance: '',
    tenantName: '',
    occupantType: 'שוכר',
    phone: '',
    email: '',
    monthlyDues: systemSettings?.defaultMonthlyDues || 300,
    paymentMethod: 'חיובית',
    parking: '',
    notes: ''
  });

  const handleAddApartment = (e) => {
    e.preventDefault();
    if (!targetBuildingForApts || !newAptForm.aptNum) return;
    addApartment(targetBuildingForApts.id, newAptForm);
    setIsAddAptOpen(false);
    setNewAptForm({
      aptNum: '',
      floor: '',
      entrance: '',
      tenantName: '',
      occupantType: 'שוכר',
      phone: '',
      email: '',
      monthlyDues: systemSettings?.defaultMonthlyDues || 300,
      paymentMethod: 'חיובית',
      parking: '',
      notes: ''
    });
    triggerSuccess(`דירה ${newAptForm.aptNum} נוספה בהצלחה לבניין ${targetBuildingForApts.name}!`);
  };

  // עריכת דירה קיימת
  const [editingAptId, setEditingAptId] = useState(null);
  const [editAptForm, setEditAptForm] = useState({});

  const startEditApt = (apt) => {
    setEditingAptId(apt.id);
    setEditAptForm({ ...apt });
  };

  const handleSaveApt = (aptId) => {
    if (!targetBuildingForApts) return;
    updateApartment(targetBuildingForApts.id, aptId, editAptForm);
    setEditingAptId(null);
    triggerSuccess(`פרטי דירה ${editAptForm.aptNum} עודכנו בהצלחה!`);
  };

  const handleDeleteApt = (apt) => {
    if (!targetBuildingForApts) return;
    if (window.confirm(`האם להסיר את דירה ${apt.aptNum} (${apt.tenantName}) מהבניין?`)) {
      deleteApartment(targetBuildingForApts.id, apt.id);
      triggerSuccess(`דירה ${apt.aptNum} הוסרה מהבניין.`);
    }
  };

  // חיפוש דירות
  const [aptSearch, setAptSearch] = useState('');
  const filteredApartments = (targetBuildingForApts?.apartments || []).filter(a => {
    if (!aptSearch.trim()) return true;
    const term = aptSearch.trim().toLowerCase();
    return (
      (a.aptNum + '').includes(term) ||
      (a.tenantName || '').toLowerCase().includes(term) ||
      (a.phone || '').includes(term) ||
      (a.email || '').toLowerCase().includes(term)
    );
  });

  // --- הגדרות מערכת ואתר ---
  const [prefForm, setPrefForm] = useState({
    useHebrewDateDefault: systemSettings?.useHebrewDateDefault ?? true,
    hebrewDateFormat: systemSettings?.hebrewDateFormat || 'both',
    noticeHeaderPrefix: systemSettings?.noticeHeaderPrefix || 'בס״ד',
    noticeSignoff: systemSettings?.noticeSignoff || 'בברכת ועד הבית וההנהלה, בית ומנוחה',
    companyName: systemSettings?.companyName || 'בית ומנוחה',
    managerName: systemSettings?.managerName || 'ישי לוי',
    companyPhone: systemSettings?.companyPhone || '02-555-1234',
    companyEmail: systemSettings?.companyEmail || 'office@bait-umnucha.co.il',
    defaultMonthlyDues: systemSettings?.defaultMonthlyDues || 300,
    enableIssuesModule: systemSettings?.enableIssuesModule ?? true
  });

  const handleSavePreferences = (e) => {
    e.preventDefault();
    updateSystemSettings(prefForm);
    triggerSuccess('כל הגדרות המערכת והאתר נשמרו בהצלחה!');
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>

      {/* --------------------------------------------------------------------
          באנר עליון: כותרת המרכז + כפתור חזרה למערכת הראשית
          -------------------------------------------------------------------- */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        border: '1.5px solid var(--color-border-card)',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-md)',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-gold-100)',
            border: '1.5px solid var(--color-gold-300)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-gold-700)',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <Sliders size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: 0 }}>
                מרכז הגדרות ועריכת מערכת
              </h1>
              <span style={{
                background: 'var(--color-gold-100)',
                color: 'var(--color-gold-800)',
                border: '1px solid var(--color-gold-300)',
                padding: '2px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                אזור תשתית וניהול
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--color-slate-600)' }}>
              עריכה מרוכזת של תשתיות הבניינים, מבנה הדירות והדיירים, והגדרות אתר ותאריכים
            </p>
          </div>
        </div>

        {/* כפתור חזרה למערכת הראשית */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="btn btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.95rem',
            background: 'var(--color-slate-900)',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
            cursor: 'pointer'
          }}
        >
          <ArrowRight size={18} />
          <span>חזרה למערכת הראשית</span>
        </button>
      </div>

      {/* הודעת הצלחה צפה */}
      {saveSuccessMsg && (
        <div style={{
          background: 'var(--color-success-bg)',
          border: '1.5px solid var(--color-success-border)',
          color: 'var(--color-success)',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: 'var(--shadow-sm)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <Check size={18} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* --------------------------------------------------------------------
          לשוניות ניווט פנימיות של מרכז ההגדרות
          -------------------------------------------------------------------- */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginBottom: 24,
        borderBottom: '2px solid var(--color-border-card)',
        paddingBottom: 12,
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setInnerTab('buildings')}
          style={innerTabBtnStyle(innerTab === 'buildings')}
        >
          <Building2 size={18} />
          <span>ניהול ועריכת בניינים ({buildings.length})</span>
        </button>

        <button
          onClick={() => setInnerTab('apartments')}
          style={innerTabBtnStyle(innerTab === 'apartments')}
        >
          <Users size={18} />
          <span>ניהול דירות ודיירים</span>
        </button>

        <button
          onClick={() => setInnerTab('preferences')}
          style={innerTabBtnStyle(innerTab === 'preferences')}
        >
          <Sliders size={18} />
          <span>הגדרות אתר ותאריך עברי</span>
        </button>

        <button
          onClick={() => setInnerTab('backup')}
          style={innerTabBtnStyle(innerTab === 'backup')}
        >
          <ShieldCheck size={18} />
          <span>גיבוי ושחזור נתונים</span>
        </button>
      </div>

      {/* ====================================================================
          לשונית 1: ניהול ועריכת בניינים
          ==================================================================== */}
      {innerTab === 'buildings' && (
        <div>
          {/* שורת פעולה: הוספת בניין חדש */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--color-border-card)',
            padding: '18px 24px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14
          }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: 0 }}>
                מאגר הבניינים המנוהלים
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                הוספת בניין חדש, שינוי כתובות, עדכון פרטי חשבון בנק והתאמת חותמת צבע אישית לכל בניין
              </p>
            </div>

            <button
              onClick={onOpenAddBuilding}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 22px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.92rem'
              }}
            >
              <PlusCircle size={18} />
              <span>הוספת בניין חדש</span>
            </button>
          </div>

          {/* גריד כרטיסי בניינים */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 18
          }}>
            {buildings.map((bld) => {
              const isEditing = editingBuildingId === bld.id;
              const bldColor = bld.color || BUILDING_COLOR_PALETTE[0];

              if (isEditing) {
                return (
                  <div key={bld.id} style={{
                    background: '#FFFFFF',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${editBuildingForm.color?.primary || bldColor.primary}`,
                    padding: 22,
                    boxShadow: 'var(--shadow-lg)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-slate-900)' }}>
                        עריכת בניין: {bld.name}
                      </span>
                      <button
                        onClick={() => setEditingBuildingId(null)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-slate-400)' }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                          שם הבניין:
                        </label>
                        <input
                          type="text"
                          value={editBuildingForm.name}
                          onChange={(e) => setEditBuildingForm({ ...editBuildingForm, name: e.target.value })}
                          className="input"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                          כתובת מלאה ועיר:
                        </label>
                        <input
                          type="text"
                          value={editBuildingForm.address}
                          onChange={(e) => setEditBuildingForm({ ...editBuildingForm, address: e.target.value })}
                          className="input"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                            חשבון בנק:
                          </label>
                          <input
                            type="text"
                            value={editBuildingForm.bankAccount}
                            onChange={(e) => setEditBuildingForm({ ...editBuildingForm, bankAccount: e.target.value })}
                            className="input"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                            קוד מוסד חיובית:
                          </label>
                          <input
                            type="text"
                            value={editBuildingForm.hiyuvitCode}
                            onChange={(e) => setEditBuildingForm({ ...editBuildingForm, hiyuvitCode: e.target.value })}
                            className="input"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>

                      {/* יתרת קופה - מוצגת לקריאה בלבד ללא אפשרות עריכה ידנית */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--color-slate-50)',
                        padding: '9px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-card)',
                        fontSize: '0.82rem'
                      }}>
                        <span style={{ color: 'var(--color-slate-600)', fontWeight: 700 }}>יתרת קופה מחושבת:</span>
                        <strong style={{ color: bld.currentBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '0.88rem' }}>
                          ₪{(bld.currentBalance || 0).toLocaleString()} (מחושבת מתנועות בלבד)
                        </strong>
                      </div>

                      {/* בורר צבע מותאם לבניין */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                          חותמת צבע המותג של הבניין:
                        </label>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(8, 1fr)',
                          gap: 6,
                          background: 'var(--color-slate-50)',
                          padding: 10,
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border-card)'
                        }}>
                          {BUILDING_COLOR_PALETTE.map((pal) => {
                            const isSelected = (editBuildingForm.color?.id || bldColor.id) === pal.id;
                            return (
                              <button
                                key={pal.id}
                                type="button"
                                title={pal.name}
                                onClick={() => setEditBuildingForm({ ...editBuildingForm, color: pal })}
                                style={{
                                  height: 28,
                                  borderRadius: 6,
                                  background: pal.primary,
                                  border: isSelected ? '2px solid #0F172A' : '1px solid rgba(0,0,0,0.15)',
                                  boxShadow: isSelected ? '0 0 0 2px #FFFFFF, 0 2px 6px rgba(0,0,0,0.2)' : 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#FFFFFF'
                                }}
                              >
                                {isSelected && <Check size={14} strokeWidth={3} />}
                              </button>
                            );
                          })}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-slate-500)', marginTop: 4, display: 'block' }}>
                          נבחר: <strong>{editBuildingForm.color?.name || bldColor.name}</strong>
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button
                          onClick={() => handleSaveBuilding(bld.id)}
                          className="btn btn-primary"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        >
                          <Save size={16} />
                          <span>שמור שינויים</span>
                        </button>
                        <button
                          onClick={() => setEditingBuildingId(null)}
                          className="btn btn-secondary"
                          style={{ padding: '8px 16px' }}
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // כרטיס תצוגה
              return (
                <div key={bld.id} style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: `1.5px solid ${bldColor.border}`,
                  padding: 20,
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* פס צבע עליון */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    left: 0,
                    height: 5,
                    background: bldColor.primary
                  }} />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8, marginTop: 4 }}>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: 0 }}>
                          {bld.name}
                        </h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--color-slate-600)' }}>
                          {bld.address || 'לא הוגדרה כתובת'}
                        </p>
                      </div>

                      {/* תגית צבע הבניין */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: bldColor.tint,
                        border: `1px solid ${bldColor.border}`,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: bldColor.text
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: bldColor.primary }} />
                        <span>{bldColor.name}</span>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      margin: '14px 0',
                      background: 'var(--color-slate-50)',
                      padding: 12,
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.83rem'
                    }}>
                      <div>
                        <span style={{ color: 'var(--color-slate-500)', display: 'block' }}>דירות בבניין:</span>
                        <strong style={{ color: 'var(--color-slate-800)' }}>{(bld.apartments || []).length} דירות</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-slate-500)', display: 'block' }}>יתרת קופה:</span>
                        <strong style={{ color: bld.currentBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          ₪{(bld.currentBalance || 0).toLocaleString()}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-slate-500)', display: 'block' }}>קוד חיובית:</span>
                        <span style={{ color: 'var(--color-slate-700)' }}>{bld.hiyuvitCode || 'ללא'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-slate-500)', display: 'block' }}>חשבון בנק:</span>
                        <span style={{ color: 'var(--color-slate-700)' }}>{bld.bankAccount ? bld.bankAccount.slice(0, 16) + '...' : 'לא הוזן'}</span>
                      </div>
                    </div>
                  </div>

                  {/* כפתורי פעולה */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => startEditBuilding(bld)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontWeight: 700
                      }}
                    >
                      <Edit3 size={15} />
                      <span>ערוך פרטים וצבע</span>
                    </button>

                    <button
                      onClick={() => handleDeleteBuilding(bld)}
                      className="btn btn-sm"
                      title="מחיקת בניין מהמערכת"
                      style={{
                        background: 'var(--color-danger-bg)',
                        color: 'var(--color-danger)',
                        border: '1px solid var(--color-danger-border)',
                        padding: '6px 12px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          לשונית 2: ניהול דירות ודיירים
          ==================================================================== */}
      {innerTab === 'apartments' && (
        <div>
          {/* סרגל בחירת בניין + פעולות */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--color-border-card)',
            padding: '20px 24px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <label style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-slate-900)' }}>
                בחר בניין לעריכת דירותיו:
              </label>
              <select
                value={activeAptBuildingId}
                onChange={(e) => setActiveAptBuildingId(e.target.value)}
                className="input"
                style={{
                  minWidth: 240,
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  borderColor: targetBuildingForApts?.color?.primary || 'var(--color-border-card)'
                }}
              >
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({(b.apartments || []).length} דירות)
                  </option>
                ))}
              </select>

              {targetBuildingForApts && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: targetBuildingForApts.color?.tint || 'var(--color-slate-100)',
                  border: `1px solid ${targetBuildingForApts.color?.border || 'var(--color-border-card)'}`,
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: targetBuildingForApts.color?.text || 'var(--color-slate-800)'
                }}>
                  <span>סה״כ {(targetBuildingForApts.apartments || []).length} דירות</span>
                  <span>•</span>
                  <span>
                    צפי דמי ועד חודשי: ₪{(targetBuildingForApts.apartments || []).reduce((acc, a) => acc + (a.monthlyDues || 0), 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsAddAptOpen(true)}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: '0.92rem'
              }}
            >
              <PlusCircle size={18} />
              <span>הוספת דירה לבניין</span>
            </button>
          </div>

          {/* סינון וחיפוש דירות */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="חיפוש מהיר לפי מספר דירה, שם דייר, טלפון או מייל..."
              value={aptSearch}
              onChange={(e) => setAptSearch(e.target.value)}
              className="input"
              style={{ width: '100%', maxWidth: 450 }}
            />
          </div>

          {/* טבלת דירות מרוכזת לעריכה */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--color-border-card)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{
                    background: 'var(--color-slate-50)',
                    borderBottom: '1.5px solid var(--color-border-card)',
                    fontSize: '0.84rem',
                    color: 'var(--color-slate-600)'
                  }}>
                    <th style={{ padding: '12px 16px' }}>מס׳ דירה</th>
                    <th style={{ padding: '12px 16px' }}>שם דייר נוכחי</th>
                    <th style={{ padding: '12px 16px' }}>סוג מגורים</th>
                    <th style={{ padding: '12px 16px' }}>טלפון</th>
                    <th style={{ padding: '12px 16px' }}>דוא״ל</th>
                    <th style={{ padding: '12px 16px' }}>דמי ועד</th>
                    <th style={{ padding: '12px 16px' }}>אופן תשלום</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApartments.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: 36, textAlign: 'center', color: 'var(--color-slate-500)' }}>
                        לא נמצאו דירות התואמות את החיפוש בבניין זה.
                      </td>
                    </tr>
                  ) : (
                    filteredApartments.map((apt) => {
                      const isEditing = editingAptId === apt.id;

                      if (isEditing) {
                        return (
                          <tr key={apt.id} style={{ background: 'var(--color-gold-50)', borderBottom: '1px solid var(--color-gold-300)' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <input
                                type="text"
                                value={editAptForm.aptNum}
                                onChange={(e) => setEditAptForm({ ...editAptForm, aptNum: e.target.value })}
                                className="input"
                                style={{ width: 60, textAlign: 'center' }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <input
                                type="text"
                                value={editAptForm.tenantName}
                                onChange={(e) => setEditAptForm({ ...editAptForm, tenantName: e.target.value })}
                                className="input"
                                style={{ width: 140 }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <select
                                value={editAptForm.occupantType || 'שוכר'}
                                onChange={(e) => setEditAptForm({ ...editAptForm, occupantType: e.target.value })}
                                className="input"
                                style={{ width: 110 }}
                              >
                                <option value="בעל דירה">בעל דירה</option>
                                <option value="שוכר">שוכר</option>
                              </select>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <input
                                type="text"
                                value={editAptForm.phone || ''}
                                onChange={(e) => setEditAptForm({ ...editAptForm, phone: e.target.value })}
                                className="input"
                                style={{ width: 115 }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <input
                                type="text"
                                value={editAptForm.email || ''}
                                onChange={(e) => setEditAptForm({ ...editAptForm, email: e.target.value })}
                                className="input"
                                style={{ width: 160 }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <input
                                type="number"
                                value={editAptForm.monthlyDues}
                                onChange={(e) => setEditAptForm({ ...editAptForm, monthlyDues: e.target.value })}
                                className="input"
                                style={{ width: 80, textAlign: 'center' }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <select
                                value={editAptForm.paymentMethod || 'חיובית'}
                                onChange={(e) => setEditAptForm({ ...editAptForm, paymentMethod: e.target.value })}
                                className="input"
                                style={{ width: 110 }}
                              >
                                <option value="חיובית">חיובית</option>
                                <option value="הוראת קבע">הוראת קבע</option>
                                <option value="העברה בנקאית">העברה בנקאית</option>
                                <option value="מזומן">מזומן</option>
                              </select>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <button
                                  onClick={() => handleSaveApt(apt.id)}
                                  className="btn btn-primary btn-sm"
                                  title="שמור שינויים"
                                  style={{ padding: '6px 12px' }}
                                >
                                  <Save size={14} />
                                </button>
                                <button
                                  onClick={() => setEditingAptId(null)}
                                  className="btn btn-secondary btn-sm"
                                  title="בטל"
                                  style={{ padding: '6px 10px' }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={apt.id} style={{
                          borderBottom: '1px solid var(--color-border-card)',
                          fontSize: '0.88rem'
                        }}>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                            דירה {apt.aptNum}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-slate-800)' }}>
                            {apt.tenantName || 'לא הוזן'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              background: apt.occupantType === 'בעל דירה' ? 'var(--color-gold-100)' : 'var(--color-slate-100)',
                              color: apt.occupantType === 'בעל דירה' ? 'var(--color-gold-800)' : 'var(--color-slate-700)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.78rem',
                              fontWeight: 700
                            }}>
                              {apt.occupantType || 'שוכר'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--color-slate-600)', direction: 'ltr', textAlign: 'right' }}>
                            {apt.phone || '—'}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--color-slate-600)' }}>
                            {apt.email || '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                            ₪{(apt.monthlyDues || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              background: '#F1F5F9',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: '0.8rem',
                              color: 'var(--color-slate-700)'
                            }}>
                              {apt.paymentMethod || 'חיובית'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <button
                                onClick={() => startEditApt(apt)}
                                className="btn btn-secondary btn-sm"
                                title="ערוך פרטי דירה ודייר"
                                style={{ padding: '5px 10px' }}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteApt(apt)}
                                className="btn btn-sm"
                                title="הסר דירה"
                                style={{
                                  background: 'var(--color-danger-bg)',
                                  color: 'var(--color-danger)',
                                  border: '1px solid var(--color-danger-border)',
                                  padding: '5px 10px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* מודל הוספת דירה חדשה */}
          {isAddAptOpen && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 20
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                border: '1.5px solid var(--color-border-card)',
                width: '100%',
                maxWidth: 520,
                padding: 28,
                boxShadow: 'var(--shadow-pop)',
                animation: 'scaleIn 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: 0 }}>
                      הוספת דירה לבניין {targetBuildingForApts?.name}
                    </h3>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>
                      הזן את פרטי הדירה והדייר לאכלוס בבניין
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddAptOpen(false)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-slate-400)' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddApartment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                        מספר דירה *:
                      </label>
                      <input
                        type="text"
                        required
                        value={newAptForm.aptNum}
                        onChange={(e) => setNewAptForm({ ...newAptForm, aptNum: e.target.value })}
                        placeholder="למשל: 12"
                        className="input"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                        סכום ועד חודשי (₪) *:
                      </label>
                      <input
                        type="number"
                        required
                        value={newAptForm.monthlyDues}
                        onChange={(e) => setNewAptForm({ ...newAptForm, monthlyDues: e.target.value })}
                        className="input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                      שם דייר נוכחי:
                    </label>
                    <input
                      type="text"
                      value={newAptForm.tenantName}
                      onChange={(e) => setNewAptForm({ ...newAptForm, tenantName: e.target.value })}
                      placeholder="שם מלא / משפחה"
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                        סוג מגורים:
                      </label>
                      <select
                        value={newAptForm.occupantType}
                        onChange={(e) => setNewAptForm({ ...newAptForm, occupantType: e.target.value })}
                        className="input"
                        style={{ width: '100%' }}
                      >
                        <option value="שוכר">שוכר</option>
                        <option value="בעל דירה">בעל דירה</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                        אופן תשלום:
                      </label>
                      <select
                        value={newAptForm.paymentMethod}
                        onChange={(e) => setNewAptForm({ ...newAptForm, paymentMethod: e.target.value })}
                        className="input"
                        style={{ width: '100%' }}
                      >
                        <option value="חיובית">חיובית</option>
                        <option value="הוראת קבע">הוראת קבע</option>
                        <option value="העברה בנקאית">העברה בנקאית</option>
                        <option value="מזומן">מזומן</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                        טלפון נייד:
                      </label>
                      <input
                        type="text"
                        value={newAptForm.phone}
                        onChange={(e) => setNewAptForm({ ...newAptForm, phone: e.target.value })}
                        placeholder="050-0000000"
                        className="input"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                        כתובת דוא״ל:
                      </label>
                      <input
                        type="email"
                        value={newAptForm.email}
                        onChange={(e) => setNewAptForm({ ...newAptForm, email: e.target.value })}
                        placeholder="name@example.com"
                        className="input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1, padding: 12, fontWeight: 700 }}
                    >
                      הוסף דירה לבניין
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddAptOpen(false)}
                      className="btn btn-secondary"
                      style={{ padding: '12px 20px' }}
                    >
                      ביטול
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          לשונית 3: הגדרות אתר ומערכת (תאריך עברי, מיתוג ופקדים)
          ==================================================================== */}
      {innerTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} style={{ maxWidth: 880 }}>

          {/* כרטיס תאריך עברי ומודעות */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--color-border-card)',
            padding: 24,
            marginBottom: 20,
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-gold-100)',
                color: 'var(--color-gold-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: 0 }}>
                  הגדרות תאריך עברי במודעות ובמכתבים
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                  שילוב תאריך עברי אותנטי באופן אוטומטי בהנפקת מודעות לתלייה ובאשף המכתבים
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* אופן תצוגת התאריך - בחירה ישירה ובלעדית ללא צ'קבוקס כפול */}
              <div>
                <span style={{ display: 'block', fontSize: '0.92rem', fontWeight: 800, marginBottom: 10, color: 'var(--color-slate-900)' }}>
                  בחר את אופן הצגת התאריך במודעות ובמכתבים:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  {[
                    { id: 'both', label: 'משולב: עברי + לועזי (מומלץ)', desc: 'למשל: י״ד בתשרי תשפ״ז | 14.10.2026' },
                    { id: 'hebrew_only', label: 'עברי בלבד', desc: 'למשל: י״ד בתשרי תשפ״ז' },
                    { id: 'gregorian_only', label: 'לועזי בלבד', desc: 'למשל: 14.10.2026' }
                  ].map((fmt) => (
                    <label
                      key={fmt.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${prefForm.hebrewDateFormat === fmt.id ? 'var(--color-gold-500)' : 'var(--color-border-card)'}`,
                        background: prefForm.hebrewDateFormat === fmt.id ? 'var(--color-gold-50)' : '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="radio"
                          name="hebrewDateFormat"
                          value={fmt.id}
                          checked={prefForm.hebrewDateFormat === fmt.id}
                          onChange={() => setPrefForm({ ...prefForm, hebrewDateFormat: fmt.id })}
                          style={{ accentColor: 'var(--color-gold-600)' }}
                        />
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{fmt.label}</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-slate-500)', marginTop: 4, marginRight: 22 }}>
                        {fmt.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* תצוגה מקדימה חיה */}
              <div style={{
                background: 'var(--color-slate-50)',
                border: '1px dashed var(--color-slate-300)',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.83rem', color: 'var(--color-slate-600)' }}>
                  תצוגה מקדימה חיה של התאריך כפי שיופיע במודעות:
                </span>
                <span style={{ fontWeight: 800, color: 'var(--color-slate-900)', fontSize: '0.92rem' }}>
                  {formatFormattedDate(new Date(), prefForm.hebrewDateFormat)}
                </span>
              </div>
            </div>
          </div>

          {/* כרטיס נוסח קבוע למודעות */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--color-border-card)',
            padding: 24,
            marginBottom: 20,
            boxShadow: 'var(--shadow-xs)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: 14 }}>
              נוסח פתיח וחתימה קבועים למודעות
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                  פתיח קבוע בראש כל מודעה ומכתב:
                </label>
                <input
                  type="text"
                  value={prefForm.noticeHeaderPrefix}
                  onChange={(e) => setPrefForm({ ...prefForm, noticeHeaderPrefix: e.target.value })}
                  placeholder="למשל: בס״ד"
                  className="input"
                  style={{ width: '100%', maxWidth: 300 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                  נוסח חתימה קבוע בתחתית מודעות ומכתבים:
                </label>
                <input
                  type="text"
                  value={prefForm.noticeSignoff}
                  onChange={(e) => setPrefForm({ ...prefForm, noticeSignoff: e.target.value })}
                  placeholder="למשל: בברכת ועד הבית וההנהלה, בית ומנוחה"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* כרטיס פרטי מותג וחברה */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--color-border-card)',
            padding: 24,
            marginBottom: 24,
            boxShadow: 'var(--shadow-xs)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: 14 }}>
              פרטי חברת הניהול והוועד (מיתוג ודוחות)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                  שם החברה / הוועד:
                </label>
                <input
                  type="text"
                  value={prefForm.companyName}
                  onChange={(e) => setPrefForm({ ...prefForm, companyName: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                  שם מנהל המערכת:
                </label>
                <input
                  type="text"
                  value={prefForm.managerName}
                  onChange={(e) => setPrefForm({ ...prefForm, managerName: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                  טלפון רשמי לפניות:
                </label>
                <input
                  type="text"
                  value={prefForm.companyPhone}
                  onChange={(e) => setPrefForm({ ...prefForm, companyPhone: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                  דוא״ל רשמי:
                </label>
                <input
                  type="email"
                  value={prefForm.companyEmail}
                  onChange={(e) => setPrefForm({ ...prefForm, companyEmail: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                דמי ועד ברירת מחדל בהקמת בניין חדש (₪):
              </label>
              <input
                type="number"
                value={prefForm.defaultMonthlyDues}
                onChange={(e) => setPrefForm({ ...prefForm, defaultMonthlyDues: parseFloat(e.target.value) || 300 })}
                className="input"
                style={{ width: 140 }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '1rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-gold)'
            }}
          >
            <Save size={18} />
            <span>שמור את כל הגדרות המערכת</span>
          </button>
        </form>
      )}

      {/* ====================================================================
          לשונית 4: גיבוי, שחזור ואבטחת נתונים
          ==================================================================== */}
      {innerTab === 'backup' && (
        <div style={{ maxWidth: 840 }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--color-border-card)',
            padding: 24,
            marginBottom: 20,
            boxShadow: 'var(--shadow-xs)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: 8 }}>
              ייצוא גיבוי נתונים מלא למחשב
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-slate-600)', marginBottom: 16 }}>
              הורדת קובץ גיבוי מקיף המכיל את כל {buildings.length} הבניינים, כל הדירות, ההוצאות, התנועות וההגדרות.
            </p>
            <button
              onClick={exportFullBackup}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontWeight: 700 }}
            >
              <Download size={18} />
              <span>הורד גיבוי מלא עכשיו (קובץ נתונים)</span>
            </button>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--color-border-card)',
            padding: 24,
            boxShadow: 'var(--shadow-xs)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)', marginBottom: 8 }}>
              שחזור נתונים מקובץ גיבוי
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-slate-600)', marginBottom: 16 }}>
              טעינת קובץ גיבוי קיים שנשמר בעבר לצורך שחזור מלא של כל נתוני המערכת.
            </p>
            <label className="btn btn-secondary" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              fontWeight: 700,
              cursor: 'pointer'
            }}>
              <Upload size={18} />
              <span>בחר קובץ גיבוי לשחזור...</span>
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    importFullBackup(event.target.result);
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      )}

    </div>
  );
}

function innerTabBtnStyle(isActive) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 'var(--radius-md)',
    border: `1.5px solid ${isActive ? 'var(--color-gold-500)' : 'var(--color-border-card)'}`,
    background: isActive ? 'var(--color-gold-100)' : '#FFFFFF',
    color: isActive ? 'var(--color-gold-800)' : 'var(--color-slate-700)',
    fontWeight: 600,
    fontSize: '0.92rem',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    whiteSpace: 'nowrap',
    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'var(--shadow-xs)'
  };
}
