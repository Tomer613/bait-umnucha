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
  const [selectedBuildingForLevy, setSelectedBuildingForLevy] = useState(buildings[0]?.id || '');
  const [title, setTitle] = useState('');
  const [splitMode, setSplitMode] = useState('total'); // 'total' | 'perApt'
  const [totalCost, setTotalCost] = useState('');
  const [amountPerApt, setAmountPerApt] = useState('');

  const targetBuilding = currentBuilding || buildings.find(b => b.id === selectedBuildingForLevy) || buildings[0];
  const apartmentsCount = targetBuilding?.apartments ? targetBuilding.apartments.length : 1;

  const handleCreateLevy = (e) => {
    e.preventDefault();
    if (!title) return;

    const bId = currentBuilding ? currentBuilding.id : selectedBuildingForLevy;
    const bld = buildings.find(b => b.id === bId) || buildings[0];
    const bldAptsCount = bld?.apartments ? bld.apartments.length : 1;

    let finalTotal = 0;
    let finalPerApt = 0;

    if (splitMode === 'total') {
      finalTotal = parseFloat(totalCost) || 0;
      finalPerApt = Math.round(finalTotal / (bldAptsCount || 1));
    } else {
      finalPerApt = parseFloat(amountPerApt) || 0;
      finalTotal = finalPerApt * bldAptsCount;
    }

    addSpecialLevy(bId, {
      title,
      totalAmount: finalTotal,
      amountPerApt: finalPerApt
    });

    setShowAddModal(false);
    setTitle('');
    setTotalCost('');
    setAmountPerApt('');
  };

  // כלל הפרויקטים מכלל הבניינים
  const allMasterLevies = buildings.flatMap(b => (b.specialLevies || []).map(levy => ({
    ...levy,
    buildingId: b.id,
    buildingName: b.name,
    buildingColor: b.color || { primary: 'var(--color-gold-500)', tint: 'var(--color-gold-50)' },
    apartments: b.apartments || []
  })));

  const totalLeviesCost = allMasterLevies.reduce((acc, l) => acc + (l.totalAmount || 0), 0);
  const totalLeviesCollected = allMasterLevies.reduce((acc, l) => {
    const paidCount = l.paidApartmentIds ? l.paidApartmentIds.length : 0;
    return acc + (paidCount * (l.amountPerApt || 0));
  }, 0);
  const totalLeviesPercent = totalLeviesCost > 0 ? Math.round((totalLeviesCollected / totalLeviesCost) * 100) : 0;

  if (!currentBuilding) {
    return (
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Master Header Bar */}
        <div className="card" style={{ padding: '22px 24px', marginBottom: 24, border: '1.5px solid var(--color-gold-300)', background: 'linear-gradient(135deg, #FFFFFF 0%, var(--color-gold-50) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="badge badge-gold" style={{ fontSize: '0.8rem' }}>מבט-על פרויקטים</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-gold-700)', fontWeight: 700 }}>
                  ריכוז פרויקטים לכלל {buildings.length} הבניינים המנוהלים
                </span>
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
                גביות מיוחדות וקופות פרויקטים
              </h2>
              <p style={{ color: 'var(--color-brown-600)', fontSize: '0.92rem', margin: '6px 0 0' }}>
                מעקב וניהול קופות גבייה נפרדות לפרויקטים הנדסיים, שיפוצים ותיקונים דחופים (צנרת, חשמל, מעליות, גג).
              </p>
            </div>

            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <PlusCircle size={18} />
              <span>פרויקט גבייה חדש</span>
            </button>
          </div>
        </div>

        {/* Master KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-gold-500)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>פרויקטים פעילים</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brown-900)', marginTop: 4 }}>
              {allMasterLevies.length} פרויקטים
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-600)' }}>
              בכלל הבניינים המנוהלים
            </span>
          </div>

          <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-brown-500)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>סך תקציב פרויקטים כולל</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brown-900)', marginTop: 4 }}>
              {totalLeviesCost.toLocaleString('he-IL')} ₪
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-600)' }}>
              יעד גבייה מרוכז
            </span>
          </div>

          <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-success)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>סך שנגבה בפועל</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-success)', marginTop: 4 }}>
              {totalLeviesCollected.toLocaleString('he-IL')} ₪
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 700 }}>
              {totalLeviesPercent}% שיעור גבייה כולל
            </span>
          </div>
        </div>

        {/* Projects List */}
        {allMasterLevies.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--color-brown-500)' }}>
            <Wrench size={40} color="var(--color-gold-400)" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-brown-800)', marginBottom: 6 }}>
              אין כרגע פרויקטים של גבייה מיוחדת באף בניין
            </h3>
            <p style={{ fontSize: '0.9rem', marginBottom: 18 }}>
              כאשר מתרחש אירוע חריג (כמו תיקון צנרת או שיפוץ), ניתן להגדיר פרויקט גבייה ייעודי לבניין.
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              + פתח פרויקט גבייה ראשון
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {allMasterLevies.map(levy => {
              const bColor = levy.buildingColor;
              const paidCount = levy.paidApartmentIds ? levy.paidApartmentIds.length : 0;
              const totalApts = levy.apartments.length || 1;
              const collectedAmount = paidCount * (levy.amountPerApt || 0);
              const percent = Math.round((collectedAmount / (levy.totalAmount || 1)) * 100);

              return (
                <div key={`${levy.buildingId}-${levy.id}`} className="card" style={{ padding: 24, borderRight: `4px solid ${bColor.primary}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <button
                          onClick={() => setSelectedBuildingId(levy.buildingId)}
                          style={{
                            background: bColor.tint,
                            border: `1px solid ${bColor.border}`,
                            color: bColor.text,
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                          title={`מעבר לניהול בניין ${levy.buildingName}`}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: bColor.primary, display: 'inline-block' }} />
                          <span>{levy.buildingName}</span>
                        </button>
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)' }}>
                          נוצר בתאריך: {levy.dateCreated}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
                        {levy.title}
                      </h3>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--color-brown-900)' }}>
                        {collectedAmount.toLocaleString('he-IL')} ₪
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-brown-500)', fontWeight: 500 }}> / {levy.totalAmount.toLocaleString('he-IL')} ₪</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-gold-700)', fontWeight: 700 }}>
                        חיוב לדירה: {levy.amountPerApt} ₪ ({paidCount} מתוך {totalApts} שילמו)
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: 10, background: 'var(--color-gold-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ width: `${Math.min(percent, 100)}%`, height: '100%', background: bColor.primary, borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
                  </div>

                  {/* Interactive Apartments Mini-Grid */}
                  <div style={{ background: 'var(--color-cream-subtle)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-beige-border)' }}>
                    <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--color-brown-800)', marginBottom: 10 }}>
                      מעקב גבייה לפי דירה (לחץ לסימון תשלום ישירות מכאן):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                      {levy.apartments.map(apt => {
                        const isPaid = (levy.paidApartmentIds || []).includes(apt.id);
                        return (
                          <div
                            key={apt.id}
                            onClick={() => toggleLevyPayment(levy.buildingId, levy.id, apt.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              background: isPaid ? 'var(--color-success-bg)' : '#FFFFFF',
                              border: `1px solid ${isPaid ? 'var(--color-success-border)' : 'var(--color-beige-border)'}`,
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            <span style={{ fontWeight: 700, color: isPaid ? 'var(--color-success)' : 'var(--color-brown-800)' }}>
                              דירה {apt.aptNum}
                            </span>
                            {isPaid ? (
                              <CheckCircle2 size={15} color="var(--color-success)" />
                            ) : (
                              <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: 600 }}>
                                טרם שולם
                              </span>
                            )}
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

        {/* Modal: Create Special Levy (Also rendered for Master View!) */}
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
                    בחירת הבניין המיועד:
                  </label>
                  <select
                    value={selectedBuildingForLevy}
                    onChange={(e) => setSelectedBuildingForLevy(e.target.value)}
                    className="select"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.apartments?.length || 0} דירות)
                      </option>
                    ))}
                  </select>
                </div>

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
