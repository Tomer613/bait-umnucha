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
import { Download, Upload, UserPlus, Edit3, Trash2, Repeat, Search, Users, Store, Package, CalendarClock, Plus, FileSpreadsheet, Phone, Mail } from 'lucide-react';
import { PageHeader, Segmented, Modal, Field, EmptyState, BuildingName, FlashMessage, useFlash, MenuButton, Drawer } from './ui';
import ConfirmModal from './ConfirmModal';
import { formatILS, aptDebt, hasDebt, withBuilding, todayISO, monthName, requestBuildingPick } from '../utils/format';
import { isCommercial, unitLabel, unitDisplayName, unitsSummary, COMMERCIAL_LABELS } from '../utils/units';

const emptyAptForm = (defaultDues, unitType = 'residential') => ({
  unitType,
  commercialLabel: 'shop',
  businessName: '',
  bankPayerNames: '',
  hiyuvitClientNumber: '',
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
    deleteApartment,
    setPlanDraft,
    setActiveTab
  } = useApp();

  const isGlobalMode = !currentBuilding;
  const defaultDues = systemSettings?.defaultMonthlyDues || 300;
  const [flash, showFlash] = useFlash();

  // חיפוש וסינון
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebt, setFilterDebt] = useState('all'); // all | debt_only
  const [filterType, setFilterType] = useState('all'); // all | residential | commercial

  // הוספה / עריכה של דירה
  const [aptModal, setAptModal] = useState(null); // { mode: 'add'|'edit', buildingId, aptId? }
  const [aptForm, setAptForm] = useState(emptyAptForm(defaultDues));

  // החלפת דייר
  const [turnover, setTurnover] = useState(null); // { buildingId, aptId }
  const [newTenant, setNewTenant] = useState({ tenantName: '', phone: '', email: '', monthlyDues: '', paymentMethod: PAYMENT_METHODS[0] });
  const [moveOutDate, setMoveOutDate] = useState(() => todayISO());

  // אישור מחיקה
  const [deleteTarget, setDeleteTarget] = useState(null);

  // חלונית הפרטים של דירה: { buildingId, aptId }
  const [detail, setDetail] = useState(null);

  // ------------------------------------------------------------------------
  // נתונים
  // ------------------------------------------------------------------------
  const scopeBuildings = currentBuilding ? [currentBuilding] : buildings;
  const apartments = scopeBuildings.flatMap(b => withBuilding(b, b.apartments));
  const debtors = apartments.filter(hasDebt);
  const debtTotal = debtors.reduce((sum, a) => sum + aptDebt(a), 0);

  const q = searchTerm.trim().toLowerCase();
  const hasCommercial = apartments.some(isCommercial);
  const filteredApartments = apartments.filter(apt => {
    if (filterDebt === 'debt_only' && !hasDebt(apt)) return false;
    if (filterType === 'residential' && isCommercial(apt)) return false;
    if (filterType === 'commercial' && !isCommercial(apt)) return false;
    if (!q) return true;
    return [apt.tenantName, apt.businessName, apt.buildingName, apt.phone, apt.email, String(apt.aptNum)]
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

  // יחידת מסחר מתחילה מהסכום של הדירות, והשדה פתוח לעריכה מיד (אפיון 06, סעיף 2.3)
  const openAdd = (unitType = 'residential') => {
    if (!currentBuilding) {
      requestBuildingPick(unitType === 'commercial' ? 'לאיזה בניין להוסיף יחידת מסחר? בחרו בניין' : 'לאיזה בניין להוסיף דירה? בחרו בניין');
      return;
    }
    setAptForm(emptyAptForm(defaultDues, unitType));
    setAptModal({ mode: 'add', buildingId: currentBuilding.id });
  };

  const openEdit = (apt) => {
    setAptForm({ ...emptyAptForm(defaultDues), ...apt, bankPayerNames: (apt.bankPayerNames || []).join(', ') });
    setAptModal({ mode: 'edit', buildingId: apt.buildingId, aptId: apt.id });
  };

  const submitApt = (e) => {
    e.preventDefault();
    if (!aptModal?.buildingId || !aptForm.aptNum) return;
    const bName = buildings.find(b => b.id === aptModal.buildingId)?.name;
    const { buildingId: _b, buildingName: _n, buildingColor: _c, ...data } = aptForm;
    const label = unitLabel(aptForm);
    if (aptModal.mode === 'add') {
      addApartment(aptModal.buildingId, data);
      showFlash(`${label} נוספה לבניין ${bName}.`);
    } else {
      updateApartment(aptModal.buildingId, aptModal.aptId, data);
      showFlash(`הפרטים של ${label} עודכנו.`);
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
  const detailApt = detail ? apartments.find(a => a.buildingId === detail.buildingId && a.id === detail.aptId) || null : null;
  const setField = (key) => (e) => setAptForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="page">
      <PageHeader
        title="דירות ודיירים"
        subtitle={isGlobalMode ? `${unitsSummary(apartments)} ב-${buildings.length} בניינים` : unitsSummary(apartments)}
        actions={
          <>
            <MenuButton
              label="אקסל"
              icon={FileSpreadsheet}
              items={[
                {
                  label: isGlobalMode ? 'הורדת תבנית מאסטר' : 'הורדת תבנית אקסל',
                  hint: isGlobalMode ? 'לשונית לכל בניין' : 'ריקה לבניין',
                  icon: Download,
                  onClick: () => isGlobalMode ? downloadMasterBuildingsTemplate(buildings) : downloadSingleBuildingTemplate(currentBuilding.name)
                },
                { label: 'ייבוא רשימת דיירים', icon: Upload, file: { accept: '.xlsx, .xls, .csv', onChange: handleExcelUpload } }
              ]}
            />
            <MenuButton
              label="הוספה"
              icon={Plus}
              variant="primary"
              items={[
                { label: 'דירה', icon: UserPlus, onClick: () => openAdd('residential') },
                { label: 'חנות או מחסן', icon: Store, onClick: () => openAdd('commercial') }
              ]}
            />
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
                { id: 'all', label: 'כל היחידות', count: apartments.length },
                { id: 'debt_only', label: 'בחוב', count: debtors.length }
              ]}
            />
            {hasCommercial && (
              <Segmented
                value={filterType}
                onChange={setFilterType}
                options={[
                  { id: 'all', label: 'הכול' },
                  { id: 'residential', label: 'דירות' },
                  { id: 'commercial', label: 'מסחר' }
                ]}
              />
            )}
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
                  <th>יחידה</th>
                  <th>דייר / עסק</th>
                  <th>טלפון</th>
                  <th className="num">דמי ועד</th>
                  <th>תשלום</th>
                  <th>מצב חוב</th>
                </tr>
              </thead>
              <tbody>
                {filteredApartments.map(apt => {
                  const debt = hasDebt(apt);
                  const location = [apt.entrance && `כניסה ${apt.entrance}`, apt.floor && `קומה ${apt.floor}`].filter(Boolean).join(' · ');
                  return (
                    <tr
                      key={`${apt.buildingId}-${apt.id}`}
                      className={`row-click${debt ? ' row-alert' : ''}`}
                      tabIndex={0}
                      onClick={() => setDetail({ buildingId: apt.buildingId, aptId: apt.id })}
                      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) setDetail({ buildingId: apt.buildingId, aptId: apt.id }); }}
                      title="לחיצה לפרטים ופעולות"
                    >
                      {isGlobalMode && (
                        <td onClick={(e) => e.stopPropagation()}><BuildingName name={apt.buildingName} color={apt.buildingColor} onClick={() => setSelectedBuildingId(apt.buildingId)} /></td>
                      )}
                      <td className="cell-strong">
                        {isCommercial(apt) ? (
                          <span className="unit-tag">
                            {apt.commercialLabel === 'storage' ? <Package size={14} /> : <Store size={14} />}
                            {unitLabel(apt)}
                          </span>
                        ) : apt.aptNum}
                        {location && <span className="cell-sub">{location}</span>}
                      </td>
                      <td>
                        <span className="cell-strong">{unitDisplayName(apt) || 'לא הוזן'}</span>
                        <span className="cell-sub">{isCommercial(apt) ? (apt.tenantName ? `איש קשר: ${apt.tenantName}` : COMMERCIAL_LABELS[apt.commercialLabel] || 'מסחר') : (apt.occupantType || 'שוכר')}</span>
                      </td>
                      <td>{apt.phone ? <a href={`tel:${apt.phone}`} className="ltr" style={{ textDecoration: 'none', fontWeight: 500 }} onClick={(e) => e.stopPropagation()}>{apt.phone}</a> : <span className="muted">—</span>}</td>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AptDrawer
        apt={detailApt}
        onClose={() => setDetail(null)}
        onEdit={() => { setDetail(null); openEdit(detailApt); }}
        onTurnover={() => { setDetail(null); openTurnover(detailApt); }}
        onPlan={() => {
          const apt = detailApt;
          setDetail(null);
          setPlanDraft({ buildingId: apt.buildingId, direction: 'receivable', prefill: { unitId: apt.id, debtMonths: apt.debtMonths, totalAmount: aptDebt(apt), purpose: `חוב דמי ועד ${apt.debtMonths.map(monthName).join(', ')}` } });
          setSelectedBuildingId(apt.buildingId);
          setActiveTab('finance', 'plans');
        }}
        onDelete={() => { setDetail(null); setDeleteTarget(detailApt); }}
      />

      {/* מודל: הוספה / עריכה */}
      <Modal
        isOpen={!!aptModal}
        onClose={() => setAptModal(null)}
        title={aptModal?.mode === 'edit' ? `עריכת ${unitLabel(aptForm)}` : isCommercial(aptForm) ? 'הוספת מסחר' : 'הוספת דירה'}
        subtitle={(() => { const mb = buildings.find(b => b.id === aptModal?.buildingId); return mb ? <BuildingName name={mb.name} color={mb.color} /> : null; })()}
      >
        <form onSubmit={submitApt} className="form-stack">
          {isCommercial(aptForm) && (
            <div className="field">
              <span className="field-label">סוג</span>
              <Segmented
                value={aptForm.commercialLabel}
                onChange={(v) => setAptForm(prev => ({ ...prev, commercialLabel: v }))}
                options={[{ id: 'shop', label: 'חנות' }, { id: 'storage', label: 'מחסן' }]}
              />
            </div>
          )}
          <div className="field-row">
            <Field label={isCommercial(aptForm) ? 'מספר / שם יחידה *' : 'מספר דירה *'}>
              <input type="text" required value={aptForm.aptNum} onChange={setField('aptNum')} className="input" placeholder={isCommercial(aptForm) ? '2' : '12'} />
            </Field>
            <Field label="כניסה">
              <input type="text" value={aptForm.entrance} onChange={setField('entrance')} className="input" placeholder="א" />
            </Field>
            <Field label="קומה">
              <input type="text" value={aptForm.floor} onChange={setField('floor')} className="input" placeholder="3" />
            </Field>
          </div>
          {isCommercial(aptForm) ? (
            <div className="field-row">
              <Field label="שם העסק / המחזיק">
                <input type="text" value={aptForm.businessName} onChange={setField('businessName')} className="input" placeholder="למשל: פאפאיה אופנה בע״מ" />
              </Field>
              <Field label="איש קשר">
                <input type="text" value={aptForm.tenantName} onChange={setField('tenantName')} className="input" placeholder="בעל העסק או המנהל" />
              </Field>
            </div>
          ) : (
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
          )}
          <div className="field-row">
            <Field label="טלפון">
              <input type="tel" value={aptForm.phone} onChange={setField('phone')} className="input ltr" placeholder="050-0000000" />
            </Field>
            <Field label="אימייל">
              <input type="email" value={aptForm.email} onChange={setField('email')} className="input ltr" placeholder="name@example.com" />
            </Field>
          </div>
          <div className="field-row">
            <Field label="דמי ועד חודשיים (₪) *" hint={isCommercial(aptForm) && aptModal?.mode === 'add' ? 'מתחיל מהסכום של הדירות. אפשר לשנות.' : undefined}>
              <input type="number" required min="0" step="0.01" value={aptForm.monthlyDues} onChange={setField('monthlyDues')} className="input" />
            </Field>
            <Field label="אופן תשלום">
              <select value={aptForm.paymentMethod} onChange={setField('paymentMethod')} className="select">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>
          <div className="field-row">
            <Field label="שם המעביר בדו״ח הבנק" hint="העברה שהתיאור שלה מכיל את השם תשויך ליחידה אוטומטית. כמה שמות — מופרדים בפסיק.">
              <input type="text" value={aptForm.bankPayerNames} onChange={setField('bankPayerNames')} className="input" placeholder={isCommercial(aptForm) ? 'למשל: פאפאיה אופנה' : 'למשל: קרפמן אליעזר'} />
            </Field>
            <Field label="מספר לקוח בחיובית">
              <input type="text" value={aptForm.hiyuvitClientNumber} onChange={setField('hiyuvitClientNumber')} className="input ltr" placeholder="6460038" />
            </Field>
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">{aptModal?.mode === 'edit' ? 'שמירת השינויים' : isCommercial(aptForm) ? 'הוספת היחידה' : 'הוספת הדירה'}</button>
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

// חלונית הפרטים: כל המידע על היחידה וכל הפעולות, עם טקסט
function AptDrawer({ apt, onClose, onEdit, onTurnover, onPlan, onDelete }) {
  if (!apt) return null;
  const debt = hasDebt(apt);
  const commercial = isCommercial(apt);
  const location = [apt.entrance && `כניסה ${apt.entrance}`, apt.floor && `קומה ${apt.floor}`].filter(Boolean).join(' · ');
  const rows = [
    [commercial ? 'עסק' : 'דייר', unitDisplayName(apt) || 'לא הוזן'],
    commercial ? ['איש קשר', apt.tenantName] : ['סוג', apt.occupantType],
    ['מיקום', location],
    ['טלפון', apt.phone && <a key="phone" href={`tel:${apt.phone}`} className="ltr"><Phone size={13} /> {apt.phone}</a>],
    ['מייל', apt.email && <a key="email" href={`mailto:${apt.email}`} className="ltr"><Mail size={13} /> {apt.email}</a>],
    ['דמי ועד', formatILS(apt.monthlyDues)],
    ['אופן תשלום', apt.paymentMethod || 'חיובית'],
    commercial && ['שם המשלם בבנק', (apt.bankPayerNames || []).join(', ')],
    commercial && ['מספר לקוח בחיובית', apt.hiyuvitClientNumber]
  ].filter(r => r && r[1]);

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={unitLabel(apt)}
      subtitle={<BuildingName name={apt.buildingName} color={apt.buildingColor} />}
      footer={
        <button type="button" className="btn btn-danger btn-sm" onClick={onDelete}>
          <Trash2 size={15} /> מחיקת {commercial ? 'היחידה' : 'הדירה'}
        </button>
      }
    >
      {debt ? (
        <div className="alert alert-error stack" style={{ gap: 4, alignItems: 'stretch' }}>
          <strong>חוב {formatILS(aptDebt(apt))}</strong>
          <span style={{ fontWeight: 500 }}>{apt.debtMonths.length} חודשים: {apt.debtMonths.map(monthName).join(', ')}</span>
        </div>
      ) : (
        <div className="alert alert-success">אין חוב</div>
      )}

      <section>
        <h3 className="drawer-section-title">פרטים</h3>
        <dl className="detail-list">
          {rows.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}
        </dl>
      </section>

      <section>
        <h3 className="drawer-section-title">פעולות</h3>
        <div className="drawer-actions">
          <button type="button" className="btn btn-secondary" onClick={onEdit}><Edit3 size={16} /> עריכת פרטים</button>
          <button type="button" className="btn btn-secondary" onClick={onTurnover}><Repeat size={16} /> החלפת דייר</button>
          {debt && <button type="button" className="btn btn-secondary" onClick={onPlan}><CalendarClock size={16} /> הסדר חוב בתשלומים</button>}
        </div>
      </section>
    </Drawer>
  );
}
