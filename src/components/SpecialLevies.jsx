// ==========================================================================
// בית ומנוחה - גבייה מיוחדת לפרויקטים חד-פעמיים (תיקון צנרת / חשמל / גג)
// מוצג כתת-לשונית במסך הכספים
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, PlusCircle, CheckCircle2, Target, PiggyBank, FolderKanban } from 'lucide-react';
import { Kpi, Modal, Field, EmptyState, BuildingName } from './ui';
import { formatILS, withBuilding } from '../utils/format';

export default function SpecialLevies() {
  const { currentBuilding, buildings, setSelectedBuildingId, addSpecialLevy, toggleLevyPayment } = useApp();

  const isGlobalMode = !currentBuilding;

  const [showAddModal, setShowAddModal] = useState(false);
  const [pickedBuildingId, setPickedBuildingId] = useState(buildings[0]?.id || '');
  const [title, setTitle] = useState('');
  const [splitMode, setSplitMode] = useState('total'); // 'total' | 'perApt'
  const [totalCost, setTotalCost] = useState('');
  const [amountPerApt, setAmountPerApt] = useState('');

  const targetBuilding = currentBuilding || buildings.find(b => b.id === pickedBuildingId) || buildings[0];
  const aptCount = targetBuilding?.apartments?.length || 0;

  const closeModal = () => {
    setShowAddModal(false);
    setTitle('');
    setTotalCost('');
    setAmountPerApt('');
  };

  const handleCreateLevy = (e) => {
    e.preventDefault();
    if (!title || !targetBuilding) return;
    const divisor = aptCount || 1;
    const finalTotal = splitMode === 'total' ? (parseFloat(totalCost) || 0) : (parseFloat(amountPerApt) || 0) * divisor;
    const finalPerApt = splitMode === 'total' ? Math.round(finalTotal / divisor) : (parseFloat(amountPerApt) || 0);
    addSpecialLevy(targetBuilding.id, { title, totalAmount: finalTotal, amountPerApt: finalPerApt });
    closeModal();
  };

  const scopeBuildings = currentBuilding ? [currentBuilding] : buildings;
  const levies = scopeBuildings.flatMap(b =>
    withBuilding(b, b.specialLevies).map(l => ({ ...l, apartments: b.apartments || [] }))
  );

  const totalCostSum = levies.reduce((acc, l) => acc + (l.totalAmount || 0), 0);
  const totalCollected = levies.reduce((acc, l) => acc + (l.paidApartmentIds?.length || 0) * (l.amountPerApt || 0), 0);
  const percentAll = totalCostSum > 0 ? Math.round((totalCollected / totalCostSum) * 100) : 0;

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="section-sub" style={{ margin: 0 }}>
          קופות נפרדות לתיקונים ופרויקטים חריגים, עם מעקב מי שילם את חלקו.
        </p>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <PlusCircle size={17} /> פרויקט גבייה חדש
        </button>
      </div>

      <div className="kpi-grid">
        <Kpi icon={FolderKanban} label="פרויקטים פעילים" value={levies.length} meta={isGlobalMode ? 'בכלל הבניינים' : currentBuilding.name} />
        <Kpi variant="gold" icon={Target} label="יעד גבייה" value={formatILS(totalCostSum)} meta="סך עלות הפרויקטים" />
        <Kpi variant="good" icon={PiggyBank} label="נגבה בפועל" value={formatILS(totalCollected)} meta={`${percentAll}% מהיעד`} />
      </div>

      {levies.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Wrench}
            title="אין פרויקטי גבייה פעילים"
            text="כשיש תיקון חריג (צנרת, לוח חשמל, איטום גג) פותחים פרויקט גבייה, והמערכת מחלקת את העלות בין הדירות ועוקבת אחרי התשלומים."
            action={<button onClick={() => setShowAddModal(true)} className="btn btn-primary"><PlusCircle size={16} /> פתיחת פרויקט ראשון</button>}
          />
        </div>
      ) : (
        <div className="stack" style={{ gap: 16 }}>
          {levies.map(levy => {
            const paidCount = levy.paidApartmentIds?.length || 0;
            const collected = paidCount * (levy.amountPerApt || 0);
            const percent = Math.round((collected / (levy.totalAmount || 1)) * 100);

            return (
              <div key={`${levy.buildingId}-${levy.id}`} className="card stack">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="stack" style={{ gap: 6 }}>
                    <div className="row" style={{ gap: 8 }}>
                      {isGlobalMode && (
                        <BuildingName name={levy.buildingName} color={levy.buildingColor} onClick={() => setSelectedBuildingId(levy.buildingId)} />
                      )}
                      <span className="badge badge-neutral">נפתח {levy.createdAt || '—'}</span>
                    </div>
                    <h3 style={{ fontSize: '1.2rem' }}>{levy.title}</h3>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div className="kpi-value" style={{ fontSize: '1.4rem' }}>
                      {formatILS(collected)}
                      <span className="muted" style={{ fontSize: '0.9rem', fontWeight: 400 }}> / {formatILS(levy.totalAmount)}</span>
                    </div>
                    <div className="muted" style={{ fontSize: '0.82rem' }}>
                      {formatILS(levy.amountPerApt)} לדירה · {paidCount} מתוך {levy.apartments.length} שילמו
                    </div>
                  </div>
                </div>

                <div className="progress">
                  <div className="progress-bar" style={{ width: `${Math.min(percent, 100)}%`, background: levy.buildingColor?.primary }} />
                </div>

                <div className="info-panel">
                  <div className="field-label" style={{ marginBottom: 10 }}>לחצו על דירה כדי לסמן תשלום</div>
                  <div className="row" style={{ gap: 8 }}>
                    {levy.apartments.map(apt => {
                      const isPaid = (levy.paidApartmentIds || []).includes(apt.id);
                      return (
                        <label key={apt.id} className="check-chip" title={apt.tenantName}>
                          <input
                            type="checkbox"
                            checked={isPaid}
                            onChange={() => toggleLevyPayment(levy.buildingId, levy.id, apt.id)}
                          />
                          דירה {apt.aptNum}
                          {isPaid && <CheckCircle2 size={14} color="var(--success)" />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={closeModal} title="פרויקט גבייה חדש" subtitle="העלות תחולק בין הדירות, ותיפתח טבלת מעקב תשלומים.">
        <form onSubmit={handleCreateLevy} className="form-stack">
          {isGlobalMode && (
            <Field label="בניין">
              <select value={pickedBuildingId} onChange={(e) => setPickedBuildingId(e.target.value)} className="select">
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.apartments?.length || 0} דירות)</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="שם הפרויקט">
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="למשל: תיקון פיצוץ צנרת ראשי" />
          </Field>

          <div className="field">
            <span className="field-label">אופן החישוב</span>
            <div className="choice-grid">
              <button type="button" className={`choice${splitMode === 'total' ? ' is-active' : ''}`} onClick={() => setSplitMode('total')}>
                עלות כוללת<small>מתחלקת שווה בין הדירות</small>
              </button>
              <button type="button" className={`choice${splitMode === 'perApt' ? ' is-active' : ''}`} onClick={() => setSplitMode('perApt')}>
                סכום קבוע לדירה<small>כל דירה משלמת אותו סכום</small>
              </button>
            </div>
          </div>

          {splitMode === 'total' ? (
            <Field
              label="עלות כוללת (₪)"
              hint={totalCost && aptCount ? `כ-${formatILS((parseFloat(totalCost) || 0) / aptCount)} לכל אחת מ-${aptCount} הדירות` : undefined}
            >
              <input type="number" required min="1" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} className="input" placeholder="3000" />
            </Field>
          ) : (
            <Field
              label="סכום לדירה (₪)"
              hint={amountPerApt && aptCount ? `סך הכל ${formatILS((parseFloat(amountPerApt) || 0) * aptCount)} מ-${aptCount} דירות` : undefined}
            >
              <input type="number" required min="1" value={amountPerApt} onChange={(e) => setAmountPerApt(e.target.value)} className="input" placeholder="250" />
            </Field>
          )}

          {aptCount === 0 && (
            <div className="alert alert-warning">בבניין הזה עדיין אין דירות רשומות. הוסיפו דירות במסך הדיירים לפני פתיחת הגבייה.</div>
          )}

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">פתיחת הפרויקט</button>
            <button type="button" onClick={closeModal} className="btn btn-secondary">ביטול</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
