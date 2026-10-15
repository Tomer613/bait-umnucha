// ==========================================================================
// בית ומנוחה - הבניינים המנוהלים וברירות מחדל לבניין חדש (הגדרות)
// ==========================================================================
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BUILDING_COLOR_PALETTE } from '../data/initialData';
import ConfirmModal from './ConfirmModal';
import { SettingsCard, FlashMessage, Field, BuildingAvatar } from './ui';
import { buildingDebt, formatILS } from '../utils/format';
import { closeStatus } from '../utils/monthClose';
import { buildingBalance } from '../utils/ledger';
import { Building2, PlusCircle, Edit3, Trash2, Save, X, Landmark, DollarSign } from 'lucide-react';

export default function BuildingsSettings({ onOpenAddBuilding }) {
  const {
    buildings,
    currentMonth,
    updateBuilding,
    deleteBuilding,
    setOpeningBalance,
    systemSettings,
    updateSystemSettings
  } = useApp();

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
    color: null,
    openingBank: '',
    openingBankDate: '',
    openingCash: '',
    openingCashDate: ''
  });

  const startEditBuilding = (bld) => {
    setEditingBuildingId(bld.id);
    setEditBuildingForm({
      name: bld.name,
      address: bld.address || '',
      bankAccount: bld.bankAccount || '',
      hiyuvitCode: bld.hiyuvitCode || '',
      color: bld.color || BUILDING_COLOR_PALETTE[0],
      openingBank: String(bld.openingBalance?.bank?.amount ?? 0),
      openingBankDate: bld.openingBalance?.bank?.date || '',
      openingCash: String(bld.openingBalance?.cash?.amount ?? 0),
      openingCashDate: bld.openingBalance?.cash?.date || ''
    });
  };

  const handleSaveBuilding = (bldId) => {
    const { openingBank, openingBankDate, openingCash, openingCashDate, ...details } = editBuildingForm;
    updateBuilding(bldId, details);
    setOpeningBalance(bldId, 'bank', openingBank, openingBankDate);
    setOpeningBalance(bldId, 'cash', openingCash, openingCashDate);
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
        <div className="title-with-plaque" style={{ gap: 12, fontSize: '1rem' }}>
          <BuildingAvatar name={bld.name} color={bld.color} />
          <span>
            <strong style={{ color: 'var(--ink-900)' }}>{bld.name}</strong>
            {bld.address && <span className="muted" style={{ display: 'block', fontSize: '0.88rem' }}>{bld.address}</span>}
          </span>
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

  return (
    <>
      <FlashMessage flash={saveSuccessMsg ? { text: saveSuccessMsg, type: 'success' } : null} />

      <SettingsCard
        icon={Building2}
        title={`הבניינים המנוהלים (${buildings.length})`}
        sub="פרטי כל בניין, חשבון הבנק, קוד חיובית, יתרת פתיחה וצבע השלט שמזהה אותו בכל האתר."
        actions={<button onClick={onOpenAddBuilding} className="btn btn-primary btn-sm"><PlusCircle size={16} /> בניין חדש</button>}
      />

          <div className="bcard-grid">
            {buildings.map((bld) => {
              const isEditing = editingBuildingId === bld.id;
              const bldColor = bld.color || BUILDING_COLOR_PALETTE[0];

              if (isEditing) {
                const previewColor = editBuildingForm.color || bldColor;
                return (
                  <div key={bld.id} className="bcard is-editing" style={{ '--c': previewColor.primary }}>
                    <div className="bcard-head">
                      <BuildingAvatar name={editBuildingForm.name || bld.name} color={previewColor} size="lg" />
                      <div className="bcard-title">
                        <h3>{editBuildingForm.name || 'ללא שם'}</h3>
                        <p>עריכת פרטי הבניין</p>
                      </div>
                      <button type="button" className="modal-close" onClick={() => setEditingBuildingId(null)} aria-label="ביטול העריכה">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="bcard-body form-stack" style={{ gap: 14 }}>
                      <Field label="שם הבניין">
                        <input type="text" value={editBuildingForm.name} onChange={(e) => setEditBuildingForm({ ...editBuildingForm, name: e.target.value })} className="input" />
                      </Field>
                      <Field label="כתובת מלאה ועיר">
                        <input type="text" value={editBuildingForm.address} onChange={(e) => setEditBuildingForm({ ...editBuildingForm, address: e.target.value })} className="input" />
                      </Field>
                      <div className="field-row">
                        <Field label="חשבון בנק">
                          <input type="text" value={editBuildingForm.bankAccount} onChange={(e) => setEditBuildingForm({ ...editBuildingForm, bankAccount: e.target.value })} className="input" />
                        </Field>
                        <Field label="קוד בניין בחיובית">
                          <input type="text" value={editBuildingForm.hiyuvitCode} onChange={(e) => setEditBuildingForm({ ...editBuildingForm, hiyuvitCode: e.target.value })} className="input" placeholder="643" />
                        </Field>
                      </div>

                      <div className="info-panel stack" style={{ gap: 10 }}>
                        <span className="field-label">יתרת פתיחה</span>
                        <span className="field-hint" style={{ marginTop: -6 }}>
                          היתרה בקופה מחושבת מיתרת הפתיחה ועוד כל התנועות. יתרת פתיחת הבנק היא היתרה בבנק <strong>לפני</strong> התנועה הראשונה שנקלטה.
                          יתרה נוכחית: {formatILS(buildingBalance(bld))}.
                        </span>
                        <div className="field-row">
                          <Field label="בנק (₪)">
                            <input type="number" step="0.01" value={editBuildingForm.openingBank} onChange={(e) => setEditBuildingForm({ ...editBuildingForm, openingBank: e.target.value })} className="input" />
                          </Field>
                          <Field label="נכון לתאריך">
                            <input type="date" value={editBuildingForm.openingBankDate} onChange={(e) => setEditBuildingForm({ ...editBuildingForm, openingBankDate: e.target.value })} className="input" />
                          </Field>
                        </div>
                        <div className="field-row">
                          <Field label="קופת מזומן (₪)">
                            <input type="number" step="0.01" value={editBuildingForm.openingCash} onChange={(e) => setEditBuildingForm({ ...editBuildingForm, openingCash: e.target.value })} className="input" />
                          </Field>
                          <Field label="נכון לתאריך">
                            <input type="date" value={editBuildingForm.openingCashDate} onChange={(e) => setEditBuildingForm({ ...editBuildingForm, openingCashDate: e.target.value })} className="input" />
                          </Field>
                        </div>
                      </div>

                      <div className="field">
                        <span className="field-label">צבע השלט · {previewColor.name}</span>
                        <div className="swatch-grid">
                          {BUILDING_COLOR_PALETTE.map((pal) => (
                            <button
                              key={pal.id}
                              type="button"
                              title={pal.name}
                              className={`swatch${previewColor.id === pal.id ? ' is-selected' : ''}`}
                              onClick={() => setEditBuildingForm({ ...editBuildingForm, color: pal })}
                            >
                              <BuildingAvatar name={editBuildingForm.name || bld.name} color={pal} size="sm" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="modal-actions">
                        <button onClick={() => handleSaveBuilding(bld.id)} className="btn btn-primary">
                          <Save size={16} /> שמירת השינויים
                        </button>
                        <button onClick={() => setEditingBuildingId(null)} className="btn btn-secondary">ביטול</button>
                      </div>
                    </div>
                  </div>
                );
              }

              // כרטיס תצוגה
              const aptCount = (bld.apartments || []).length;
              const debt = buildingDebt(bld);
              return (
                <div key={bld.id} className="bcard" style={{ '--c': bldColor.primary }}>
                  <div className="bcard-head">
                    <BuildingAvatar name={bld.name} color={bldColor} size="lg" />
                    <div className="bcard-title">
                      <h3>{bld.name}</h3>
                      <p>{bld.address || 'לא הוגדרה כתובת'}</p>
                    </div>
                  </div>

                  <div className="bcard-body">
                    <div className="row" style={{ gap: 6 }}>
                      {(() => {
                        const st = closeStatus(bld, currentMonth);
                        return <span className={`badge badge-dot ${st.id === 'closed' ? 'badge-success' : 'badge-warning'}`}>{st.label}</span>;
                      })()}
                      {debt > 0 && <span className="badge badge-danger">חוב {formatILS(debt)}</span>}
                    </div>

                    <div className="bcard-stats">
                      <div><span>דירות</span><strong>{aptCount}</strong></div>
                      <div><span>יתרת קופה</span><strong>{formatILS(buildingBalance(bld))}</strong></div>
                      <div><span>קוד חיובית</span><strong>{bld.hiyuvitCode || '—'}</strong></div>
                    </div>

                    <div className="bcard-bank">
                      <Landmark size={16} />
                      <span>{bld.bankAccount || 'חשבון בנק לא הוזן'}</span>
                    </div>
                  </div>

                  <div className="bcard-actions">
                    <button onClick={() => startEditBuilding(bld)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                      <Edit3 size={15} /> עריכת פרטים וצבע
                    </button>
                    <button onClick={() => handleDeleteBuilding(bld)} className="btn btn-danger btn-sm btn-icon" title="מחיקת הבניין מהמערכת">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

      <SettingsCard icon={DollarSign} title="ברירות מחדל לבניין חדש" sub="נקבעות אוטומטית לכל דירה בהקמת בניין חדש. אפשר לשנות אחר כך לכל דירה בנפרד.">
        <Field label="דמי ועד חודשיים (₪)">
          <input
            type="number"
            min="0"
            step="10"
            className="input"
            style={{ maxWidth: 200 }}
            value={systemSettings.defaultMonthlyDues ?? 300}
            onChange={(e) => updateSystemSettings({ defaultMonthlyDues: parseFloat(e.target.value) || 0 })}
          />
        </Field>
      </SettingsCard>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm || (() => {})}
        title={deleteConfirm.title}
        question={deleteConfirm.question}
        description={deleteConfirm.description}
        subDescription={deleteConfirm.subDescription}
        confirmText={deleteConfirm.confirmText}
      />
    </>
  );
}
