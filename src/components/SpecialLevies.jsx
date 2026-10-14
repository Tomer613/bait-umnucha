// ==========================================================================
// בית ומנוחה - גבייה מיוחדת לפרויקטים חד-פעמיים (תיקון צנרת / חשמל)
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Wrench, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  X, 
  Layers, 
  DollarSign, 
  Users 
} from 'lucide-react';

export default function SpecialLevies() {
  const { currentBuilding, buildings, setSelectedBuildingId, addSpecialLevy, toggleLevyPayment } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [splitMode, setSplitMode] = useState('total'); // 'total' | 'perApt'
  const [totalCost, setTotalCost] = useState('');
  const [amountPerApt, setAmountPerApt] = useState('');

  if (!currentBuilding) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center', padding: 20 }}>
        <Building size={48} color="var(--color-gold-400)" style={{ marginBottom: 16 }} />
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
          אנא בחר בניין לניהול גביות מיוחדות
        </h3>
        <p style={{ color: 'var(--color-brown-600)', marginBottom: 20 }}>
          בחר בניין כדי לנהל גביות חד-פעמיות לפרויקטים כמו תיקוני צנרת או חשמל:
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

  const apartmentsCount = currentBuilding.apartments ? currentBuilding.apartments.length : 1;

  const handleCreateLevy = (e) => {
    e.preventDefault();
    if (!title) return;

    let finalTotal = 0;
    let finalPerApt = 0;

    if (splitMode === 'total') {
      finalTotal = parseFloat(totalCost) || 0;
      finalPerApt = Math.round(finalTotal / (apartmentsCount || 1));
    } else {
      finalPerApt = parseFloat(amountPerApt) || 0;
      finalTotal = finalPerApt * apartmentsCount;
    }

    addSpecialLevy(currentBuilding.id, {
      title,
      totalAmount: finalTotal,
      amountPerApt: finalPerApt
    });

    setShowAddModal(false);
    setTitle('');
    setTotalCost('');
    setAmountPerApt('');
  };

  const leviesList = currentBuilding.specialLevies || [];

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Header */}
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
            גביות מיוחדות וקופות נפרדות — {currentBuilding.name}
          </h2>
          <p style={{ color: 'var(--color-brown-600)', fontSize: '0.92rem' }}>
            ניהול תקציב נפרד לפרויקטים חריגים (פיצוץ צנרת, שיפוץ לוח חשמל, זיפות גג וכד')
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <PlusCircle size={18} />
          <span>פרויקט גבייה חד-פעמי חדש</span>
        </button>
      </div>

      {/* Projects List */}
      {leviesList.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--color-brown-500)' }}>
          <Wrench size={40} color="var(--color-gold-400)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brown-800)', marginBottom: 6 }}>
            אין כרגע פרויקטים של גבייה מיוחדת בבניין זה
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: 18 }}>
            כאשר מתרחש אירוע חריג (כמו תיקון צנרת), ניתן להגדיר פרויקט גבייה עם מעקב מסודר מי שילם.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-secondary">
            + פתח פרויקט גבייה ראשון
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {leviesList.map(levy => {
            const paidCount = (levy.paidApartmentIds || []).length;
            const progressPct = apartmentsCount > 0 ? Math.round((paidCount / apartmentsCount) * 100) : 0;
            const collectedSum = paidCount * (levy.amountPerApt || 0);

            return (
              <div key={levy.id} className="card" style={{ padding: 24 }}>
                {/* Project Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                        {levy.title}
                      </h3>
                      <span className="badge badge-gold">{levy.status || 'פעיל'}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-brown-500)' }}>
                      תאריך פתיחה: {levy.createdAt} | עלות כוללת: {levy.totalAmount.toLocaleString('he-IL')} ₪ | חיוב לדירה: {levy.amountPerApt} ₪
                    </div>
                  </div>

                  {/* Summary Metric */}
                  <div style={{ textAlign: 'left', background: 'var(--color-gold-50)', padding: '10px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-gold-200)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-brown-600)' }}>נגבו עד כה:</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-success)' }}>
                      {collectedSum.toLocaleString('he-IL')} ₪ / {levy.totalAmount.toLocaleString('he-IL')} ₪
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: 10, background: 'var(--color-cream-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 20 }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-gold-400), var(--color-success))', transition: 'width 0.3s' }} />
                </div>

                {/* Apartments Grid - Tracking who paid vs who owes */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, color: 'var(--color-brown-800)' }}>
                    מעקב תשלום לפי דירות ({paidCount} מתוך {apartmentsCount} שילמו — לחץ לסימון תשלום):
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                    {(currentBuilding.apartments || []).map(apt => {
                      const isPaid = (levy.paidApartmentIds || []).includes(apt.id);
                      return (
                        <div
                          key={apt.id}
                          onClick={() => toggleLevyPayment(currentBuilding.id, levy.id, apt.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${isPaid ? '#C8E6C9' : 'var(--color-beige-border)'}`,
                            background: isPaid ? 'var(--color-success-bg)' : '#FFFFFF',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-brown-900)' }}>
                              דירה {apt.aptNum}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-brown-600)' }}>
                              {apt.tenantName}
                            </div>
                          </div>

                          <div>
                            {isPaid ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-success)', fontWeight: 700, fontSize: '0.85rem' }}>
                                <CheckCircle2 size={16} />
                                שולם
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: '0.82rem' }}>
                                טרם שולם
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Special Levy */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                הגדרת פרויקט גבייה חד-פעמי
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--color-brown-500)" />
              </button>
            </div>

            <form onSubmit={handleCreateLevy} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>
                  שם הפרויקט / סיבת הגבייה:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="למשל: תיקון פיצוץ צנרת ראשי / שדרוג לוח חשמל / זיפות גג"
                />
              </div>

              {/* Split Mode Options (The exact option 3 we decided!) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 6 }}>
                  אופן חישוב החיוב:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setSplitMode('total')}
                    className={`btn ${splitMode === 'total' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.85rem', padding: 10 }}
                  >
                    הזנת עלות כוללת (חלוקה שווה)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSplitMode('perApt')}
                    className={`btn ${splitMode === 'perApt' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.85rem', padding: 10 }}
                  >
                    הזנת סכום קבוע לדירה
                  </button>
                </div>
              </div>

              {splitMode === 'total' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>
                    עלות כוללת של התיקון (₪):
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    className="input"
                    placeholder="למשל 3000"
                  />
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-gold-700)', marginTop: 4 }}>
                    {totalCost ? `הסכום יחולק בין ${apartmentsCount} דירות: כ-${Math.round((parseFloat(totalCost) || 0) / apartmentsCount)} ₪ לדירה.` : ''}
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>
                    סכום לתשלום לכל דירה (₪):
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amountPerApt}
                    onChange={(e) => setAmountPerApt(e.target.value)}
                    className="input"
                    placeholder="למשל 250"
                  />
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-gold-700)', marginTop: 4 }}>
                    {amountPerApt ? `סך הגבייה הצפויה מ-${apartmentsCount} דירות: ${(parseFloat(amountPerApt) || 0) * apartmentsCount} ₪.` : ''}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  צור פרויקט גבייה והפעל מעקב
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
