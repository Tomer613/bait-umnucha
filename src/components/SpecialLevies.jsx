// ==========================================================================
// בית ומנוחה - גביות מיוחדות (אפיון 05): חד-פעמיות או בפריסה לתשלומים,
// כל גבייה קופה נפרדת עם מעקב תשלום לכל יחידה × חודש. מוצג כתת-לשונית במסך הכספים.
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, PlusCircle, Target, PiggyBank, FolderKanban, Pencil, CheckCircle2, XCircle, Store } from 'lucide-react';
import { Kpi, Modal, EmptyState, BuildingName } from './ui';
import { formatILS, formatMonth, monthName, withBuilding, requestBuildingPick } from '../utils/format';
import { levyTotals, levyMonths, paymentOf, amountFor, unitBalance, LEVY_STATUS } from '../utils/levies';
import { unitLabel, unitDisplayName, isCommercial } from '../utils/units';
import LevyForm from './levies/LevyForm';
import PendingCharges from './levies/PendingCharges';

// מחזור סימון בתא: ריק → שולם → נכשל → ריק
const NEXT_STATUS = { none: 'paid', paid: 'failed', failed: null };

function modeText(levy, currentMonth) {
  if (levy.mode !== 'monthly') return `חד-פעמי · ${formatMonth(levy.startMonth)}`;
  const months = levyMonths(levy, currentMonth);
  const range = levy.installments
    ? `${formatMonth(months[0])}–${formatMonth(months[months.length - 1])} (${levy.installments} תשלומים)`
    : `מ${formatMonth(levy.startMonth)}, ללא הגבלה`;
  return `${formatILS(levy.amountPerApt)} לחודש · ${range}`;
}

export default function SpecialLevies() {
  const { currentBuilding, buildings, setSelectedBuildingId, addLevy, updateLevy, setLevyStatus, setLevyPayment, currentMonth } = useApp();
  const isGlobalMode = !currentBuilding;
  const [form, setForm] = useState(null); // { buildingId, levy? }
  const [showClosed, setShowClosed] = useState(false);

  const openNewLevy = () => {
    if (!currentBuilding) {
      requestBuildingPick('לאיזה בניין לפתוח את הגבייה? בחרו בניין');
      return;
    }
    setForm({ buildingId: currentBuilding.id });
  };

  const scopeBuildings = currentBuilding ? [currentBuilding] : buildings;
  const all = scopeBuildings.flatMap(b => withBuilding(b, b.specialLevies).map(l => ({ ...l, building: b, totals: levyTotals(l, b, currentMonth) })));
  const active = all.filter(l => l.status === 'active');
  const closed = all.filter(l => l.status !== 'active');
  const shown = showClosed ? all : active;

  const targetSum = active.reduce((s, l) => s + l.totals.target, 0);
  const collectedSum = active.reduce((s, l) => s + l.totals.collected, 0);
  const formBuilding = form ? buildings.find(b => b.id === form.buildingId) : null;

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="section-sub" style={{ margin: 0 }}>
          גבייה מעבר לדמי הוועד, חד-פעמית או בפריסה לתשלומים. כל גבייה היא קופה נפרדת עם מעקב מי שילם.
        </p>
        <button onClick={openNewLevy} className="btn btn-primary">
          <PlusCircle size={17} /> גבייה מיוחדת חדשה
        </button>
      </div>

      <div className="kpi-grid">
        <Kpi variant="sky" icon={FolderKanban} label="גביות פעילות" value={active.length} meta={isGlobalMode ? 'בכלל הבניינים' : currentBuilding.name} />
        <Kpi variant="gold" icon={Target} label="יעד" value={formatILS(targetSum)} meta="כל התשלומים של הגביות הפעילות" />
        <Kpi variant="good" icon={PiggyBank} label="נגבה בפועל" value={formatILS(collectedSum)} meta={`${targetSum ? Math.round((collectedSum / targetSum) * 100) : 0}% מהיעד`} />
      </div>

      {currentBuilding && <PendingCharges building={currentBuilding} />}

      {closed.length > 0 && (
        <label className="check-chip" style={{ alignSelf: 'flex-start' }}>
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
          הצגת גביות שהושלמו או בוטלו ({closed.length})
        </label>
      )}

      {shown.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Wrench}
            title="אין גביות מיוחדות פעילות"
            text="כשיש תיקון חריג או פרויקט (צנרת, לוח חשמל, שיפוץ לובי), פותחים גבייה מיוחדת: חד-פעמית או בפריסה לתשלומים."
            action={<button onClick={openNewLevy} className="btn btn-primary"><PlusCircle size={16} /> פתיחת גבייה</button>}
          />
        </div>
      ) : (
        <div className="stack" style={{ gap: 16 }}>
          {shown.map(levy => (
            <LevyCard
              key={`${levy.buildingId}-${levy.id}`}
              levy={levy}
              currentMonth={currentMonth}
              isGlobalMode={isGlobalMode}
              onPickBuilding={() => setSelectedBuildingId(levy.buildingId)}
              onEdit={() => setForm({ buildingId: levy.buildingId, levy })}
              onStatus={(status) => setLevyStatus(levy.buildingId, levy.id, status)}
              onCell={(unitId, month, current) => setLevyPayment(levy.buildingId, levy.id, unitId, month, NEXT_STATUS[current || 'none'])}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={!!form}
        onClose={() => setForm(null)}
        title={form?.levy ? `עריכת גבייה · ${form.levy.name}` : 'גבייה מיוחדת חדשה'}
        subtitle={formBuilding ? <BuildingName name={formBuilding.name} color={formBuilding.color} /> : null}
      >
        {formBuilding && (
          <LevyForm
            building={formBuilding}
            initial={form.levy ? stripView(form.levy) : {}}
            currentMonth={currentMonth}
            submitText="פתיחת הגבייה"
            onCancel={() => setForm(null)}
            onSubmit={(data) => {
              if (form.levy) updateLevy(form.buildingId, form.levy.id, data);
              else addLevy(form.buildingId, data);
              setForm(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

// שדות התצוגה שנוספו לגבייה ברשימה — לא נשמרים
function stripView(l) {
  const { building: _b, totals: _t, buildingId: _i, buildingName: _n, buildingColor: _c, ...data } = l;
  return data;
}

function LevyCard({ levy, currentMonth, isGlobalMode, onPickBuilding, onEdit, onStatus, onCell }) {
  const { totals } = levy;
  const months = totals.months;
  const units = totals.units;

  return (
    <div className={`card stack${levy.status !== 'active' ? ' is-closed' : ''}`} style={{ gap: 14 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="stack" style={{ gap: 6 }}>
          <div className="row" style={{ gap: 8 }}>
            {isGlobalMode && <BuildingName name={levy.buildingName} color={levy.buildingColor} onClick={onPickBuilding} />}
            <span className="badge badge-neutral">{modeText(levy, currentMonth)}</span>
            {levy.includesCommercial && <span className="badge badge-gold"><Store size={12} /> כולל מסחר</span>}
            {levy.origin === 'auto_detected' && <span className="badge badge-petrol">זוהתה בחיובית</span>}
            {levy.status !== 'active' && <span className="badge badge-warning">{LEVY_STATUS[levy.status]}</span>}
          </div>
          <h3 style={{ fontSize: '1.2rem' }}>{levy.name}</h3>
          {levy.purpose && <p className="section-sub" style={{ margin: 0 }}>{levy.purpose}</p>}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>
            {formatILS(totals.collected)}
            <span className="muted" style={{ fontSize: '0.93rem', fontWeight: 400 }}> / {formatILS(totals.target)}</span>
          </div>
          <div className="muted" style={{ fontSize: '0.86rem' }}>{units.length} יחידות משתתפות · {totals.percent}%</div>
        </div>
      </div>

      <div className="progress">
        <div className="progress-bar" style={{ width: `${Math.min(totals.percent, 100)}%`, background: levy.buildingColor?.primary }} />
      </div>

      <div className="table-wrap levy-matrix">
        <table className="data-table data-table-compact">
          <thead>
            <tr>
              <th>יחידה</th>
              {months.map(m => <th key={m} className="col-center">{levy.mode === 'monthly' ? monthName(m).slice(0, 3) : formatMonth(m)}</th>)}
              <th className="num">שולם</th>
              <th className="num">חוב</th>
            </tr>
          </thead>
          <tbody>
            {units.map(u => {
              const bal = unitBalance(levy, u, currentMonth);
              return (
                <tr key={u.id}>
                  <td className="cell-strong" style={{ whiteSpace: 'nowrap' }}>
                    {unitLabel(u)}
                    <span className="cell-sub">{unitDisplayName(u)}{isCommercial(u) ? ` · ${formatILS(amountFor(levy, u))}` : ''}</span>
                  </td>
                  {months.map(m => {
                    const st = paymentOf(levy, u.id, m)?.status || null;
                    const future = m > currentMonth;
                    return (
                      <td key={m} className="col-center">
                        <button
                          type="button"
                          className={`levy-cell${st ? ` is-${st}` : ''}${future ? ' is-future' : ''}`}
                          onClick={() => onCell(u.id, m, st)}
                          title={`${unitLabel(u)} · ${formatMonth(m)} · לחיצה: ${st === 'paid' ? 'סימון כנכשל' : st === 'failed' ? 'ניקוי' : 'סימון כשולם'}`}
                          aria-label={`${unitLabel(u)} ${formatMonth(m)} ${st === 'paid' ? 'שולם' : st === 'failed' ? 'נכשל' : 'לא שולם'}`}
                        >
                          {st === 'paid' ? <CheckCircle2 size={16} /> : st === 'failed' ? <XCircle size={16} /> : future ? '·' : '—'}
                        </button>
                      </td>
                    );
                  })}
                  <td className="num amount-in">{formatILS(bal.paid)}</td>
                  <td className="num">{bal.owed > 0 ? <span className="amount-out">{formatILS(bal.owed)}</span> : <span className="muted">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: '0.84rem', margin: 0 }}>
        תשלומים מחיובית מסומנים אוטומטית בקליטת הקובץ. לחיצה על תא מסמנת ידנית: שולם ← נכשל ← ריק.
      </p>

      <div className="row" style={{ gap: 8 }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onEdit}><Pencil size={14} /> עריכה</button>
        {levy.status === 'active' ? (
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onStatus('completed')}>סימון כהושלמה</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onStatus('cancelled')}>ביטול הגבייה</button>
          </>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onStatus('active')}>החזרה לפעילה</button>
        )}
      </div>
    </div>
  );
}
