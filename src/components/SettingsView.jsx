// ==========================================================================
// בית ומנוחה - מרכז הגדרות ועריכת מערכת ראשי
// ניהול הבניינים, פרטי החברה והמכתבים, וגיבוי (ניהול הדירות נמצא במסך הדיירים)
// ==========================================================================
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BUILDING_COLOR_PALETTE } from '../data/initialData';
import { formatFormattedDate } from '../utils/hebrewDate';
import ConfirmModal from './ConfirmModal';
import { PageHeader, SubTabs, FlashMessage } from './ui';
import {
  Building2,
  Sliders,
  ShieldCheck,
  PlusCircle,
  Edit3,
  Trash2,
  Check,
  Download,
  Upload,
  Save,
  X,
  Calendar,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';

export default function SettingsView({ onOpenAddBuilding }) {
  const {
    buildings,
    updateBuilding,
    deleteBuilding,
    systemSettings,
    updateSystemSettings,
    exportFullBackup,
    importFullBackup
  } = useApp();

  // לשונית פנימית פעילה בתוך מרכז ההגדרות
  const [innerTab, setInnerTab] = useState('buildings'); // 'buildings' | 'preferences' | 'backup'

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

  // מודל אישור מחיקה מרכזי ("אתה בטוח?")
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    title: 'אישור מחיקה',
    question: 'אתה בטוח שברצונך למחוק?',
    description: null,
    subDescription: '',
    confirmText: 'כן, מחק לצמיתות',
    onConfirm: null
  });

  const handleDeleteBuilding = (bld) => {
    const aptCount = (bld.apartments || []).length;
    setDeleteConfirm({
      isOpen: true,
      title: 'מחיקת בניין מהמערכת',
      question: 'אתה בטוח שברצונך למחוק את הבניין?',
      description: (
        <div>
          האם אתה בטוח שברצונך למחוק לצמיתות את הבניין{' '}
          <strong style={{ color: '#0F172A', fontSize: '1.05rem' }}>"{bld.name}"</strong>
          {bld.address ? ` (${bld.address})` : ''}?
        </div>
      ),
      subDescription: `כל הנתונים, ${aptCount} הדירות והדיירים, ההוצאות, קופות הגבייה וההיסטוריה של הבניין יימחקו לצמיתות ולא ניתן יהיה לשחזרם!`,
      confirmText: 'כן, מחק את הבניין לצמיתות',
      onConfirm: () => {
        deleteBuilding(bld.id);
        triggerSuccess(`הבניין "${bld.name}" נמחק בהצלחה מהמערכת.`);
      }
    });
  };

  // מעקב אחר הוספת בניין חדש לעדכון מיידי של הודעת הצלחה
  const prevBldCountRef = useRef(buildings.length);
  useEffect(() => {
    if (buildings.length > prevBldCountRef.current) {
      triggerSuccess('הבניין החדש נוסף בהצלחה למערכת ומוצג כעת בראש הרשימה!');
    }
    prevBldCountRef.current = buildings.length;
  }, [buildings.length]);

  // --- הגדרות מערכת ואתר ---
  const [prefForm, setPrefForm] = useState(() => {
    const pList = systemSettings?.phoneList && systemSettings.phoneList.length > 0
      ? systemSettings.phoneList
      : [
          { id: 'phone-1', number: systemSettings?.phoneCalls || '052-7623803', label: 'לשיחות בלבד' },
          { id: 'phone-2', number: systemSettings?.phoneWhatsapp || '055-6704029', label: 'וואטסאפ בלבד' }
        ];

    const eList = systemSettings?.emailList && systemSettings.emailList.length > 0
      ? systemSettings.emailList
      : [
          { id: 'email-1', email: systemSettings?.companyEmail || 'bm4923359@gmail.com', label: 'ראשי' },
          { id: 'email-2', email: systemSettings?.companyEmailSecondary || '9926606@gmail.com', label: 'משני' }
        ];

    return {
      useHebrewDateDefault: systemSettings?.useHebrewDateDefault ?? true,
      hebrewDateFormat: systemSettings?.hebrewDateFormat || 'both',
      noticeHeaderPrefix: systemSettings?.noticeHeaderPrefix || 'בס״ד',
      noticeSignoff: systemSettings?.noticeSignoff || 'בברכת ועד הבית וההנהלה, בית ומנוחה',
      companyName: systemSettings?.companyName || 'בית ומנוחה',
      managerName: systemSettings?.managerName || 'ישי לוי',
      phoneList: pList,
      emailList: eList,
      companyPhone: systemSettings?.companyPhone || 'שיחות: 052-7623803 | וואטסאפ: 055-6704029',
      defaultMonthlyDues: systemSettings?.defaultMonthlyDues || 300,
      enableIssuesModule: systemSettings?.enableIssuesModule ?? true
    };
  });

  useEffect(() => {
    if (systemSettings) {
      setPrefForm(prev => {
        const pList = systemSettings.phoneList && systemSettings.phoneList.length > 0
          ? systemSettings.phoneList
          : prev.phoneList;
        const eList = systemSettings.emailList && systemSettings.emailList.length > 0
          ? systemSettings.emailList
          : prev.emailList;

        return {
          ...prev,
          useHebrewDateDefault: systemSettings.useHebrewDateDefault ?? prev.useHebrewDateDefault,
          hebrewDateFormat: systemSettings.hebrewDateFormat || prev.hebrewDateFormat,
          noticeHeaderPrefix: systemSettings.noticeHeaderPrefix || prev.noticeHeaderPrefix,
          noticeSignoff: systemSettings.noticeSignoff || prev.noticeSignoff,
          companyName: systemSettings.companyName || prev.companyName,
          managerName: systemSettings.managerName || prev.managerName,
          phoneList: pList,
          emailList: eList,
          companyPhone: systemSettings.companyPhone || prev.companyPhone,
          defaultMonthlyDues: systemSettings.defaultMonthlyDues || prev.defaultMonthlyDues,
          enableIssuesModule: systemSettings.enableIssuesModule ?? prev.enableIssuesModule
        };
      });
    }
  }, [systemSettings]);

  const handleAddPhone = () => {
    const newId = `phone-${Date.now()}`;
    setPrefForm(prev => ({
      ...prev,
      phoneList: [...prev.phoneList, { id: newId, number: '', label: '' }]
    }));
  };

  const handleUpdatePhone = (id, field, value) => {
    setPrefForm(prev => ({
      ...prev,
      phoneList: prev.phoneList.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleRemovePhone = (id) => {
    const item = prefForm.phoneList.find(p => p.id === id);
    if (item && item.number && item.number.trim()) {
      setDeleteConfirm({
        isOpen: true,
        title: 'הסרת מספר טלפון',
        question: 'אתה בטוח שברצונך להסיר מספר זה?',
        description: (
          <div>
            האם להסיר את מספר הטלפון{' '}
            <strong style={{ color: '#0F172A', direction: 'ltr', display: 'inline-block' }}>{item.number}</strong>
            {item.label ? ` (${item.label})` : ''} מרשימת מספרי הקשר של החברה?
          </div>
        ),
        subDescription: 'המספר לא יישמר בפרטי החברה לאחר השמירה.',
        confirmText: 'כן, הסר מספר זה',
        onConfirm: () => {
          setPrefForm(prev => ({
            ...prev,
            phoneList: prev.phoneList.filter(p => p.id !== id)
          }));
          triggerSuccess(`מספר הטלפון ${item.number} הוסר.`);
        }
      });
    } else {
      setPrefForm(prev => ({
        ...prev,
        phoneList: prev.phoneList.filter(p => p.id !== id)
      }));
    }
  };

  const handleAddEmail = () => {
    const newId = `email-${Date.now()}`;
    setPrefForm(prev => ({
      ...prev,
      emailList: [...prev.emailList, { id: newId, email: '', label: '' }]
    }));
  };

  const handleUpdateEmail = (id, field, value) => {
    setPrefForm(prev => ({
      ...prev,
      emailList: prev.emailList.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleRemoveEmail = (id) => {
    const item = prefForm.emailList.find(e => e.id === id);
    if (item && item.email && item.email.trim()) {
      setDeleteConfirm({
        isOpen: true,
        title: 'הסרת כתובת אימייל',
        question: 'אתה בטוח שברצונך להסיר אימייל זה?',
        description: (
          <div>
            האם להסיר את כתובת האימייל{' '}
            <strong style={{ color: '#0F172A', direction: 'ltr', display: 'inline-block' }}>{item.email}</strong>
            {item.label ? ` (${item.label})` : ''} מרשימת כתובות הקשר של החברה?
          </div>
        ),
        subDescription: 'כתובת האימייל לא תישמר בפרטי החברה לאחר השמירה.',
        confirmText: 'כן, הסר אימייל זה',
        onConfirm: () => {
          setPrefForm(prev => ({
            ...prev,
            emailList: prev.emailList.filter(e => e.id !== id)
          }));
          triggerSuccess(`כתובת האימייל ${item.email} הוסרה.`);
        }
      });
    } else {
      setPrefForm(prev => ({
        ...prev,
        emailList: prev.emailList.filter(e => e.id !== id)
      }));
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    const phoneParts = prefForm.phoneList
      .filter(p => p.number && p.number.trim())
      .map(p => p.label && p.label.trim() ? `${p.label.trim()}: ${p.number.trim()}` : p.number.trim());
    const autoCompanyPhone = phoneParts.length > 0 ? phoneParts.join(' | ') : '';

    const primaryPhone = prefForm.phoneList[0]?.number || '';
    const whatsappPhone = prefForm.phoneList.find(p => p.label?.includes('וואטסאפ') || p.label?.includes('ווצאפ'))?.number || prefForm.phoneList[1]?.number || '';
    const primaryEmail = prefForm.emailList[0]?.email || '';
    const secondaryEmail = prefForm.emailList[1]?.email || '';

    const dataToSave = {
      ...prefForm,
      phoneCalls: primaryPhone,
      phoneWhatsapp: whatsappPhone,
      companyEmail: primaryEmail,
      companyEmailSecondary: secondaryEmail,
      companyPhone: prefForm.companyPhone?.trim() ? prefForm.companyPhone : autoCompanyPhone
    };
    updateSystemSettings(dataToSave);
    triggerSuccess('כל הגדרות המערכת והאתר נשמרו בהצלחה!');
  };

  return (
    <div className="page">

      <PageHeader
        title="הגדרות"
        subtitle="בניינים, פרטי החברה ומכתבים, וגיבוי הנתונים"
      />

      <FlashMessage flash={saveSuccessMsg ? { text: saveSuccessMsg, type: 'success' } : null} />

      <SubTabs
        active={innerTab}
        onChange={setInnerTab}
        tabs={[
          { id: 'buildings', label: `בניינים (${buildings.length})`, icon: Building2 },
          { id: 'preferences', label: 'פרטי החברה ומכתבים', icon: Sliders },
          { id: 'backup', label: 'גיבוי ושחזור', icon: ShieldCheck }
        ]}
      />

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
                            קוד בניין בחיובית:
                          </label>
                          <input
                            type="text"
                            value={editBuildingForm.hiyuvitCode}
                            onChange={(e) => setEditBuildingForm({ ...editBuildingForm, hiyuvitCode: e.target.value })}
                            className="input"
                            style={{ width: '100%' }}
                            placeholder="למשל: 643"
                          />
                        </div>
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
                    <div style={{ marginBottom: 8, marginTop: 4 }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: 0 }}>
                        {bld.name}
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--color-slate-600)' }}>
                        {bld.address || 'לא הוגדרה כתובת'}
                      </p>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
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
                        <span style={{ color: 'var(--color-slate-500)', display: 'block' }}>קוד בניין בחיובית:</span>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                    נוסח חתימה קבוע בתחתית מודעות ומכתבים:
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-slate-500)' }}>
                    (ניתן ללחוץ Enter לירידת שורה)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={prefForm.noticeSignoff}
                  onChange={(e) => setPrefForm({ ...prefForm, noticeSignoff: e.target.value })}
                  placeholder={`למשל:\nבברכת ועד הבית,\nהנהלת בית ומנוחה`}
                  className="textarea"
                  style={{ width: '100%', lineHeight: 1.6, resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* כרטיס נפרד: דמי ועד ברירת מחדל למבנים */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--color-border-card)',
            padding: 24,
            marginBottom: 20,
            boxShadow: 'var(--shadow-xs)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-gold-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-gold-700)'
              }}>
                <DollarSign size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-slate-900)', margin: 0 }}>
                  דמי ועד ברירת מחדל למבנים
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-slate-500)', margin: '2px 0 0 0' }}>
                  סכום חודשי שיוגדר אוטומטית לדירות בעת הקמת בניין חדש במערכת (ניתן להתאמה אישית לכל דירה)
                </p>
              </div>
            </div>

            <div style={{ maxWidth: 280, marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-slate-700)' }}>
                סכום דמי ועד ברירת מחדל (₪):
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={prefForm.defaultMonthlyDues}
                  onChange={(e) => setPrefForm({ ...prefForm, defaultMonthlyDues: parseFloat(e.target.value) || 0 })}
                  className="input"
                  style={{ width: '100%', paddingLeft: 34, fontWeight: 700, fontSize: '1rem' }}
                />
                <span style={{ position: 'absolute', left: 12, color: 'var(--color-slate-500)', fontWeight: 700 }}>
                  ₪
                </span>
              </div>
            </div>
          </div>

          {/* כרטיס פרטי מותג וחברה - הכי למטה */}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
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
                  placeholder="ישי לוי"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* מספרי טלפון - רשימה דינמית עם הוספה והסרה */}
            <div style={{
              marginTop: 20,
              padding: '16px 18px',
              background: 'var(--color-cream-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={18} color="var(--color-gold-600)" />
                  <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                    מספרי טלפון ליצירת קשר ({prefForm.phoneList.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddPhone}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    border: '1.5px solid var(--color-gold-500)',
                    background: '#FFFFFF',
                    color: 'var(--color-gold-800)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <PlusCircle size={15} color="var(--color-gold-600)" />
                  <span>הוסף מספר טלפון</span>
                </button>
              </div>

              {prefForm.phoneList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-slate-500)', fontSize: '0.85rem' }}>
                  לא הוגדרו מספרי טלפון. לחץ על ״הוסף מספר טלפון״ כדי להוסיף.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {prefForm.phoneList.map((item, index) => (
                    <div
                      key={item.id || index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        background: '#FFFFFF',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-beige-border)',
                        boxShadow: 'var(--shadow-xs)',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: '1 1 200px' }}>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-slate-600)', marginBottom: 3 }}>
                          מספר טלפון #{index + 1}:
                        </label>
                        <input
                          type="text"
                          value={item.number}
                          onChange={(e) => handleUpdatePhone(item.id, 'number', e.target.value)}
                          placeholder="למשל: 052-7623803"
                          className="input"
                          dir="ltr"
                          style={{ width: '100%', textAlign: 'right' }}
                        />
                      </div>

                      <div style={{ flex: '1.2 1 240px' }}>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-slate-600)', marginBottom: 3 }}>
                          ייעוד המספר:
                        </label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => handleUpdatePhone(item.id, 'label', e.target.value)}
                          placeholder="לשיחות בלבד / וואטסאפ בלבד / ראשי / משני"
                          className="input"
                          style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                          {['לשיחות בלבד', 'וואטסאפ בלבד', 'ראשי', 'משני', 'חירום'].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => handleUpdatePhone(item.id, 'label', chip)}
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                border: item.label === chip ? '1px solid var(--color-gold-600)' : '1px solid var(--color-beige-border)',
                                background: item.label === chip ? 'var(--color-gold-100)' : '#F8FAFC',
                                color: item.label === chip ? 'var(--color-gold-900)' : 'var(--color-slate-600)',
                                cursor: 'pointer',
                                fontWeight: item.label === chip ? 700 : 500
                              }}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* כפתור הסרה X מודגש */}
                      <div style={{ paddingTop: 20 }}>
                        <button
                          type="button"
                          onClick={() => handleRemovePhone(item.id)}
                          title="הסר מספר זה"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 38,
                            height: 38,
                            borderRadius: 'var(--radius-md)',
                            border: '1.5px solid #FCA5A5',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* כתובות דוא״ל - רשימה דינמית עם הוספה והסרה */}
            <div style={{
              marginTop: 18,
              padding: '16px 18px',
              background: 'var(--color-cream-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={18} color="var(--color-gold-600)" />
                  <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                    כתובות דוא״ל ליצירת קשר ({prefForm.emailList.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    border: '1.5px solid var(--color-gold-500)',
                    background: '#FFFFFF',
                    color: 'var(--color-gold-800)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <PlusCircle size={15} color="var(--color-gold-600)" />
                  <span>הוסף כתובת דוא״ל</span>
                </button>
              </div>

              {prefForm.emailList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-slate-500)', fontSize: '0.85rem' }}>
                  לא הוגדרו כתובות דוא״ל. לחץ על ״הוסף כתובת דוא״ל״ כדי להוסיף.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {prefForm.emailList.map((item, index) => (
                    <div
                      key={item.id || index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        background: '#FFFFFF',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-beige-border)',
                        boxShadow: 'var(--shadow-xs)',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: '1 1 240px' }}>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-slate-600)', marginBottom: 3 }}>
                          כתובת דוא״ל #{index + 1}:
                        </label>
                        <input
                          type="email"
                          value={item.email}
                          onChange={(e) => handleUpdateEmail(item.id, 'email', e.target.value)}
                          placeholder="למשל: bm4923359@gmail.com"
                          className="input"
                          dir="ltr"
                          style={{ width: '100%', textAlign: 'right' }}
                        />
                      </div>

                      <div style={{ flex: '1.2 1 240px' }}>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-slate-600)', marginBottom: 3 }}>
                          ייעוד הכתובת:
                        </label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => handleUpdateEmail(item.id, 'label', e.target.value)}
                          placeholder="ראשי / משני / הנהלת חשבונות / פניות"
                          className="input"
                          style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                          {['ראשי', 'משני', 'הנהלת חשבונות', 'פניות דיירים', 'כללי'].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => handleUpdateEmail(item.id, 'label', chip)}
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                border: item.label === chip ? '1px solid var(--color-gold-600)' : '1px solid var(--color-beige-border)',
                                background: item.label === chip ? 'var(--color-gold-100)' : '#F8FAFC',
                                color: item.label === chip ? 'var(--color-gold-900)' : 'var(--color-slate-600)',
                                cursor: 'pointer',
                                fontWeight: item.label === chip ? 700 : 500
                              }}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* כפתור הסרה X מודגש */}
                      <div style={{ paddingTop: 20 }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(item.id)}
                          title="הסר כתובת זו"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 38,
                            height: 38,
                            borderRadius: 'var(--radius-md)',
                            border: '1.5px solid #FCA5A5',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700 }}>
                  שורת יצירת קשר משולבת לדוחות ומכתבים:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const phoneParts = prefForm.phoneList
                      .filter(p => p.number && p.number.trim())
                      .map(p => p.label && p.label.trim() ? `${p.label.trim()}: ${p.number.trim()}` : p.number.trim());
                    const emailParts = prefForm.emailList
                      .filter(e => e.email && e.email.trim())
                      .map(e => e.label && e.label.trim() ? `${e.label.trim()}: ${e.email.trim()}` : e.email.trim());
                    const combined = [...phoneParts, ...emailParts].join(' | ');
                    setPrefForm(prev => ({ ...prev, companyPhone: combined }));
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '3px 10px', height: 26 }}
                >
                  רענן שורה אוטומטית לפי הרשימות
                </button>
              </div>
              <input
                type="text"
                value={prefForm.companyPhone}
                onChange={(e) => setPrefForm({ ...prefForm, companyPhone: e.target.value })}
                placeholder="שיחות: 052-7623803 | וואטסאפ: 055-6704029"
                className="input"
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: 3, display: 'block' }}>
                ניתן לערוך ידנית, להשמיט שדות, או להשאיר ריק כדי שיופק אוטומטית ממספרי הטלפון והוואטסאפ.
              </span>
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

      {/* מודל אישור מחיקה מרכזי ומעוצב ("אתה בטוח?") */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm || (() => {})}
        title={deleteConfirm.title}
        question={deleteConfirm.question}
        description={deleteConfirm.description}
        subDescription={deleteConfirm.subDescription}
        confirmText={deleteConfirm.confirmText}
        isDanger={true}
      />

    </div>
  );
}
