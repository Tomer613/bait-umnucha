// ==========================================================================
// בית ומנוחה - דירות ודיירים: רשימה, הוספה/עריכה/מחיקה, ייבוא אקסל ונוהל החלפת דייר
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  downloadSingleBuildingTemplate,
  downloadMasterBuildingsTemplate,
  readTenantExcelFile
} from '../utils/excelHelper';
import { PAYMENT_METHODS, OCCUPANT_TYPES } from '../data/initialData';
import { Download, Upload, UserPlus, Edit3, Trash2, Repeat, Search, Users } from 'lucide-react';
import { PageHeader, Segmented, Modal, Field, EmptyState, BuildingName, FlashMessage, useFlash } from './ui';
import ConfirmModal from './ConfirmModal';
import { formatILS, aptDebt, hasDebt, withBuilding, todayISO, monthName, requestBuildingPick } from '../utils/format';

const emptyAptForm = (defaultDues) => ({
  aptNum: '',
  floor: '',
  entrance: '',
  tenantName: '',
  occupantType: OCCUPANT_TYPES[0],
  phone: '',
  email: '',
  monthlyDues: defaultDues,
  paymentMethod: PAYMENT_METHODS[0]
});

export default function ApartmentRegistry() {
  const {
    currentBuilding,
    buildings,
    setSelectedBuildingId,
    systemSettings,
    importApartmentsForBuilding,
    importMasterSheets,
    handleTenantTurnover,
    addApartment,
    updateApartment,
    deleteApartment
  } = useApp();

  const isGlobalMode = !currentBuilding;
  const defaultDues = systemSettings?.defaultMonthlyDues || 300;
  const [flash, showFlash] = useFlash();

  // חיפוש וסינון
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebt, setFilterDebt] = useState('all'); // all | debt_only

  // הוספה / עריכה של דירה
  const [aptModal, setAptModal] = useState(null); // { mode: 'add'|'edit', buildingId, aptId? }
  const [aptForm, setAptForm] = useState(emptyAptForm(defaultDues));

  // החלפת דייר
  const [turnover, setTurnover] = useState(null); // { buildingId, aptId }
  const [newTenant, setNewTenant] = useState({ tenantName: '', phone: '', email: '', monthlyDues: '', paymentMethod: PAYMENT_METHODS[0] });
  const [moveOutDate, setMoveOutDate] = useState(() => todayISO());

  // אישור מחיקה
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ------------------------------------------------------------------------
  // נתונים
  // ------------------------------------------------------------------------
  const scopeBuildings = currentBuilding ? [currentBuilding] : buildings;
  const apartments = scopeBuildings.flatMap(b => withBuilding(b, b.apartments));
  const debtors = apartments.filter(hasDebt);
  const debtTotal = debtors.reduce((sum, a) => sum + aptDebt(a), 0);

  const q = searchTerm.trim().toLowerCase();
  const filteredApartments = apartments.filter(apt => {
    if (filterDebt === 'debt_only' && !hasDebt(apt)) return false;
    if (!q) return true;
    return [apt.tenantName, apt.buildingName, apt.phone, apt.email, String(apt.aptNum)]
      .some(v => (v || '').toLowerCase().includes(q));
  });

  const findApt = (buildingId, aptId) =>
    (buildings.find(b => b.id === buildingId)?.apartments || []).find(a => a.id === aptId);

  // ------------------------------------------------------------------------
  // פעולות
  // ------------------------------------------------------------------------
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const sheets = await readTenantExcelFile(file);
      const sheetNames = Object.keys(sheets);
      if (sheetNames.length > 1 || isGlobalMode) {
        importMasterSheets(sheets);
        showFlash(`קובץ המאסטר נקלט: עודכנו ${sheetNames.length} לשוניות בניינים.`);
      } else {
        const apts = sheets[sheetNames[0]];
        importApartmentsForBuilding(currentBuilding.id, apts);
        showFlash(`נקלטו ${apts.length} דירות לבניין ${currentBuilding.name}.`);
      }
    } catch (err) {
      showFlash(`לא הצלחנו לקרוא את קובץ האקסל: ${err.message}`, 'error');
    }
  };

  const openAdd = () => {
    if (!currentBuilding) {
      requestBuildingPick('לאיזה בניין להוסיף דירה? בחרו בניין');
      return;
    }
    setAptForm(emptyAptForm(defaultDues));
    setAptModal({ mode: 'add', buildingId: currentBuilding.id });
  };

  const openEdit = (apt) => {
    setAptForm({ ...emptyAptForm(defaultDues), ...apt });
    setAptModal({ mode: 'edit', buildingId: apt.buildingId, aptId: apt.id });
  };

  const submitApt = (e) => {
    e.preventDefault();
    if (!aptModal?.buildingId || !aptForm.aptNum) return;
    const bName = buildings.find(b => b.id === aptModal.buildingId)?.name;
    const { buildingId: _b, buildingName: _n, buildingColor: _c, ...data } = aptForm;
    if (aptModal.mode === 'add') {
      addApartment(aptModal.buildingId, data);
      showFlash(`דירה ${aptForm.aptNum} נוספה לבניין ${bName}.`);
    } else {
      updateApartment(aptModal.buildingId, aptModal.aptId, data);
      showFlash(`פרטי דירה ${aptForm.aptNum} עודכנו.`);
    }
    setAptModal(null);
  };

  const openTurnover = (apt) => {
    setTurnover({ buildingId: apt.buildingId, aptId: apt.id });
    setNewTenant({ tenantName: '', phone: '', email: '', monthlyDues: apt.monthlyDues, paymentMethod: PAYMENT_METHODS[0] });
  };

  const submitTurnover = (e) => {
    e.preventDefault();
    if (!turnover || !newTenant.tenantName) return;
    handleTenantTurnover(
      turnover.buildingId,
      turnover.aptId,
      { ...newTenant, monthlyDues: parseFloat(newTenant.monthlyDues) || defaultDues },
      moveOutDate
    );
    setTurnover(null);
    showFlash('הדייר הוחלף. החוב הקודם נשמר על שם הדייר היוצא, והדייר החדש מתחיל עם כרטיס נקי.');
  };

  const turnoverApt = turnover ? findApt(turnover.buildingId, turnover.aptId) : null;
  const setField = (key) => (e) => setAptForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="page">
      <PageHeader
        title="דירות ודיירים"
        subtitle={isGlobalMode ? `${apartments.length} דירות ב-${buildings.length} בניינים` : `${apartments.length} דירות`}
        actions={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => isGlobalMode ? downloadMasterBuildingsTemplate(buildings) : downloadSingleBuildingTemplate(currentBuilding.name)}
              title={isGlobalMode ? 'תבנית אקסל עם לשונית לכל בניין' : 'תבנית אקסל ריקה לבניין'}
            >
              <Download size={16} /> {isGlobalMode ? 'תבנית מאסטר' : 'תבנית אקסל'}
            </button>
            <label className="btn btn-secondary" title="טעינת קובץ אקסל לעדכון רשימת הדיירים">
              <Upload size={16} /> ייבוא מאקסל
              <input type="file" accept=".xlsx, .xls, .csv" hidden onChange={handleExcelUpload} />
            </label>
            <button className="btn btn-primary" onClick={openAdd}>
              <UserPlus size={16} /> הוספת דירה
            </button>
          </>
        }
      />

      <FlashMessage flash={flash} />

      <div className="card card-flush">
        <div className="card-header">
          <div className="row">
            <Segmented
              className={filterDebt === 'debt_only' ? 'seg--danger' : ''}
              value={filterDebt}
              onChange={setFilterDebt}
              options={[
                { id: 'all', label: 'כל הדירות', count: apartments.length },
                { id: 'debt_only', label: 'בחוב', count: debtors.length }
              ]}
            />
            {debtTotal > 0 && <span className="badge badge-danger">סך חובות {formatILS(debtTotal)}</span>}
          </div>
          <div className="search-box">
            <Search size={17} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם, טלפון, אימייל או מספר דירה..."
              className="input"
            />
          </div>
        </div>

        {filteredApartments.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchTerm || filterDebt !== 'all' ? 'לא נמצאו דירות' : 'עדיין אין דירות'}
            text={searchTerm || filterDebt !== 'all' ? 'נסו לשנות את החיפוש או את הסינון.' : 'הוסיפו דירה ידנית או ייבאו את רשימת הדיירים מקובץ אקסל.'}
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {isGlobalMode && <th>בניין</th>}
                  <th>דירה</th>
                  <th>דייר</th>
                  <th>טלפון</th>
                  <th>אימייל</th>
                  <th className="num">דמי ועד</th>
                  <th>תשלום</th>
                  <th>מצב חוב</th>
                  <th className="col-center">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredApartments.map(apt => {
                  const debt = hasDebt(apt);
                  const location = [apt.entrance && `כניסה ${apt.entrance}`, apt.floor && `קומה ${apt.floor}`].filter(Boolean).join(' · ');
                  return (
                    <tr key={`${apt.buildingId}-${apt.id}`} className={debt ? 'row-alert' : ''}>
                      {isGlobalMode && (
                        <td><BuildingName name={apt.buildingName} color={apt.buildingColor} onClick={() => setSelectedBuildingId(apt.buildingId)} /></td>
                      )}
                      <td className="cell-strong">{apt.aptNum}{location && <span className="cell-sub">{location}</span>}</td>
                      <td>
                        <span className="cell-strong">{apt.tenantName || 'לא הוזן'}</span>
                        <span className="cell-sub">{apt.occupantType || 'שוכר'}</span>
                      </td>
                      <td>{apt.phone ? <a href={`tel:${apt.phone}`} className="ltr" style={{ textDecoration: 'none', fontWeight: 500 }}>{apt.phone}</a> : <span className="muted">—</span>}</td>
                      <td className="muted" style={{ fontSize: '0.87rem' }}>{apt.email || '—'}</td>
                      <td className="num">{formatILS(apt.monthlyDues)}</td>
                      <td><span className="badge badge-neutral">{apt.paymentMethod || 'חיובית'}</span></td>
                      <td>
                        {debt ? (
                          <span className="amount-out" title={apt.debtMonths.map(monthName).join(', ')}>
                            {formatILS(aptDebt(apt))}
                            <span className="cell-sub">{apt.debtMonths.length} חודשים</span>
                          </span>
                        ) : (
                          <span className="badge badge-success">תקין</span>
                        )}
                      </td>
                      <td className="cell-actions">
                        <div>
                          <button className="btn btn-secondary btn-sm btn-icon" title="עריכת פרטי הדירה" onClick={() => openEdit(apt)}><Edit3 size={14} /></button>
                          <button className="btn btn-secondary btn-sm btn-icon" title="החלפת דייר" onClick={() => openTurnover(apt)}><Repeat size={14} /></button>
                          <button className="btn btn-danger btn-sm btn-icon" title="מחיקת הדירה" onClick={() => setDeleteTarget(apt)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* מודל: הוספה / עריכה */}
      <Modal
        isOpen={!!aptModal}
        onClose={() => setAptModal(null)}
        title={aptModal?.mode === 'edit' ? `עריכת דירה ${aptForm.aptNum}` : 'הוספת דירה'}
        subtitle={(() => { const mb = buildings.find(b => b.id === aptModal?.buildingId); return mb ? <BuildingName name={mb.name} color={mb.color} /> : null; })()}
      >
        <form onSubmit={submitApt} className="form-stack">
          <div className="field-row">
            <Field label="מספר דירה *">
              <input type="text" required value={aptForm.aptNum} onChange={setField('aptNum')} className="input" placeholder="12" />
            </Field>
            <Field label="כניסה">
              <input type="text" value={aptForm.entrance} onChange={setField('entrance')} className="input" placeholder="א" />
            </Field>
            <Field label="קומה">
              <input type="text" value={aptForm.floor} onChange={setField('floor')} className="input" placeholder="3" />
            </Field>
          </div>
          <div className="field-row">
            <Field label="שם הדייר">
              <input type="text" value={aptForm.tenantName} onChange={setField('tenantName')} className="input" placeholder="שם מלא או משפחה" />
            </Field>
            <Field label="סוג מגורים">
              <select value={aptForm.occupantType} onChange={setField('occupantType')} className="select">
                {OCCUPANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <div className="field-row">
            <Field label="טלפון">
              <input type="tel" value={aptForm.phone} onChange={setField('phone')} className="input ltr" placeholder="050-0000000" />
            </Field>
            <Field label="אימייל">
              <input type="email" value={aptForm.email} onChange={setField('email')} className="input ltr" placeholder="name@example.com" />
            </Field>
          </div>
          <div className="field-row">
            <Field label="דמי ועד חודשיים (₪) *">
              <input type="number" required min="0" value={aptForm.monthlyDues} onChange={setField('monthlyDues')} className="input" />
            </Field>
            <Field label="אופן תשלום">
              <select value={aptForm.paymentMethod} onChange={setField('paymentMethod')} className="select">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">{aptModal?.mode === 'edit' ? 'שמירת השינויים' : 'הוספת הדירה'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setAptModal(null)}>ביטול</button>
          </div>
        </form>
      </Modal>

      {/* מודל: החלפת דייר */}
      <Modal
        isOpen={!!turnover}
        onClose={() => setTurnover(null)}
        title={`החלפת דייר · דירה ${turnoverApt?.aptNum || ''}`}
        subtitle={buildings.find(b => b.id === turnover?.buildingId)?.name}
      >
        {turnoverApt && (
          <div className={`alert ${hasDebt(turnoverApt) ? 'alert-warning' : 'alert-info'}`} style={{ marginBottom: 16, alignItems: 'flex-start' }}>
            <div>
              <strong>דייר יוצא: {turnoverApt.tenantName}</strong>
              <div style={{ fontSize: '0.88rem', marginTop: 2 }}>
                {hasDebt(turnoverApt)
                  ? `חוב פתוח של ${formatILS(aptDebt(turnoverApt))} (${turnoverApt.debtMonths.length} חודשים) יישאר על שמו ויוצג בהיסטוריה.`
                  : 'אין לדייר חוב פתוח.'}
                {' '}הדייר החדש מתחיל עם כרטיס נקי.
              </div>
            </div>
          </div>
        )}
        <form onSubmit={submitTurnover} className="form-stack">
          <Field label="שם הדייר החדש *">
            <input type="text" required value={newTenant.tenantName} onChange={(e) => setNewTenant(p => ({ ...p, tenantName: e.target.value }))} className="input" placeholder="שוכר או רוכש" />
          </Field>
          <div className="field-row">
            <Field label="טלפון">
              <input type="tel" value={newTenant.phone} onChange={(e) => setNewTenant(p => ({ ...p, phone: e.target.value }))} className="input ltr" placeholder="050-0000000" />
            </Field>
            <Field label="אימייל">
              <input type="email" value={newTenant.email} onChange={(e) => setNewTenant(p => ({ ...p, email: e.target.value }))} className="input ltr" placeholder="name@example.com" />
            </Field>
          </div>
          <div className="field-row">
            <Field label="דמי ועד (₪)">
              <input type="number" value={newTenant.monthlyDues} onChange={(e) => setNewTenant(p => ({ ...p, monthlyDues: e.target.value }))} className="input" />
            </Field>
            <Field label="אופן תשלום">
              <select value={newTenant.paymentMethod} onChange={(e) => setNewTenant(p => ({ ...p, paymentMethod: e.target.value }))} className="select">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="תאריך המעבר">
              <input type="date" value={moveOutDate} onChange={(e) => setMoveOutDate(e.target.value)} className="input" />
            </Field>
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">ביצוע ההחלפה</button>
            <button type="button" onClick={() => setTurnover(null)} className="btn btn-secondary">ביטול</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteApartment(deleteTarget.buildingId, deleteTarget.id);
          showFlash(`דירה ${deleteTarget.aptNum} הוסרה מבניין ${deleteTarget.buildingName}.`);
        }}
        title="מחיקת דירה"
        question={`למחוק את דירה ${deleteTarget?.aptNum || ''}?`}
        description={deleteTarget ? `${deleteTarget.tenantName || 'ללא שם'} · ${deleteTarget.buildingName}` : ''}
        subDescription="פרטי הדירה, הדייר ונתוני הגבייה שלה יימחקו לצמיתות."
        confirmText="מחיקת הדירה"
      />
    </div>
  );
}
