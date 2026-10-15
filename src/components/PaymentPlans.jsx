// ==========================================================================
// בית ומנוחה - פריסות חוב (אפיון 07): הבניין חייב לספק / חייבים לבניין
// כל פריסה עם לוח תשלומים. תשלומים מזוהים אוטומטית בקליטת עו"ש (צ'ק לפי מספר, או סכום ותאריך).
// ==========================================================================
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlusCircle, Building2, Home, CalendarClock, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { Kpi, Modal, Field, Segmented, EmptyState, BuildingName } from './ui';
import { formatILS, formatMonth, todayISO, withBuilding, requestBuildingPick, aptDebt } from '../utils/format';
import { formatDateIL } from '../utils/ledger';
import { unitLabel, unitDisplayName } from '../utils/units';
import {
  PLAN_METHODS, PLAN_STATUS, buildPlan, buildSchedule, planTotals, plansSummary, counterpartyText,
  installmentState, findPastMatches
} from '../utils/paymentPlans';

const STATE_UI = {
  paid: { label: 'שולם', cls: 'badge-success', Icon: CheckCircle2 },
  pending: { label: 'ממתין', cls: 'badge-neutral', Icon: Clock },
  late: { label: 'באיחור', cls: 'badge-danger', Icon: AlertTriangle },
  cancelled: { label: 'בוטל', cls: 'badge-neutral', Icon: XCircle }
};

export default function PaymentPlans({ showFlash }) {
  const { currentBuilding, buildings, setSelectedBuildingId, addPaymentPlan, setPlanInstallment, cancelPaymentPlan, planDraft, setPlanDraft } = useApp();
  const isGlobalMode = !currentBuilding;
  const today = todayISO();
  // פתיחה מתוך מסך אחר (למשל "הסדר חוב" בדירה) — הטיוטה נטענת פעם אחת
  const [form, setForm] = useState(() => planDraft); // { buildingId, direction, prefill }
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    if (planDraft) setPlanDraft(null);
  }, [planDraft, setPlanDraft]);

  const open = (direction) => {
    if (!currentBuilding) { requestBuildingPick('לאיזה בניין? בחרו בניין'); return; }
    setForm({ buildingId: currentBuilding.id, direction });
  };

  const scope = currentBuilding ? [currentBuilding] : buildings;
  const plans = scope.flatMap(b => withBuilding(b, b.paymentPlans).map(p => ({ ...p, building: b, totals: planTotals(p, today) })));
  const visible = plans.filter(p => showClosed || p.status === 'active');
  const payable = visible.filter(p => p.direction === 'payable');
  const receivable = visible.filter(p => p.direction === 'receivable');
  const sums = scope.reduce((acc, b) => { const s = plansSummary(b, today); return { payable: acc.payable + s.payable, receivable: acc.receivable + s.receivable }; }, { payable: 0, receivable: 0 });
  const lateCount = plans.filter(p => p.status === 'active').reduce((s, p) => s + p.totals.late.length, 0);
  const formBuilding = form ? buildings.find(b => b.id === form.buildingId) : null;

  const card = (p) => (
    <PlanCard
      key={`${p.buildingId}-${p.id}`}
      plan={p}
      today={today}
      isGlobalMode={isGlobalMode}
      onPickBuilding={() => setSelectedBuildingId(p.buildingId)}
      onMark={(n, paid) => setPlanInstallment(p.buildingId, p.id, n, paid ? { status: 'paid', manual: true, paidDate: today } : { status: 'pending', manual: false, paidDate: null, transactionId: null })}
      onCancel={() => { cancelPaymentPlan(p.buildingId, p.id); showFlash('הפריסה בוטלה.'); }}
    />
  );

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="section-sub" style={{ margin: 0 }}>חובות שנפרסים לתשלומים: של הבניין לספקים, ושל דיירים לבניין.</p>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => open('receivable')}><Home size={16} /> הסדר חוב של דייר</button>
          <button className="btn btn-primary" onClick={() => open('payable')}><PlusCircle size={16} /> פריסת חוב לספק</button>
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi variant="alert" icon={Building2} label="הבניין חייב לספקים" value={formatILS(sums.payable)} meta="יתרת התשלומים שנותרו" />
        <Kpi variant="good" icon={Home} label="חייבים לבניין בהסדר" value={formatILS(sums.receivable)} meta="יתרת ההסדרים של דיירים" />
        <Kpi variant={lateCount ? 'warn' : 'sky'} icon={CalendarClock} label="תשלומים באיחור" value={lateCount} meta={`יותר מ-5 ימים אחרי המועד`} />
      </div>

      {plans.some(p => p.status !== 'active') && (
        <label className="check-chip" style={{ alignSelf: 'flex-start' }}>
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
          הצגת פריסות שהושלמו או בוטלו
        </label>
      )}

      <section className="stack" style={{ gap: 12 }}>
        <h3 className="section-title">הבניין חייב</h3>
        {payable.length ? payable.map(card) : <div className="card"><EmptyState icon={Building2} title="אין פריסות חוב לספקים" text="למשל: חוב לחברת המעליות שמשולם בצ'קים דחויים." /></div>}
      </section>

      <section className="stack" style={{ gap: 12 }}>
        <h3 className="section-title">חייבים לבניין</h3>
        {receivable.length ? receivable.map(card) : <div className="card"><EmptyState icon={Home} title="אין הסדרי חוב של דיירים" text="דייר שצבר חוב יכול להסדיר אותו בתשלומים. אפשר לפתוח הסדר גם מכרטיס הדירה." /></div>}
      </section>

      <Modal
        isOpen={!!form}
        onClose={() => setForm(null)}
        title={form?.direction === 'receivable' ? 'הסדר חוב של דייר' : 'פריסת חוב לספק'}
        subtitle={formBuilding ? <BuildingName name={formBuilding.name} color={formBuilding.color} /> : null}
      >
        {formBuilding && (
          <PlanForm
            key={`${form.buildingId}-${form.direction}-${form.prefill?.unitId || ''}`}
            building={formBuilding}
            direction={form.direction}
            prefill={form.prefill || {}}
            onCancel={() => setForm(null)}
            onSubmit={(data, linkedCount) => {
              addPaymentPlan(formBuilding.id, data);
              setForm(null);
              showFlash(`הפריסה נשמרה${linkedCount ? ` · ${linkedCount} תשלומים שכבר יצאו מהבנק קושרו אליה` : ''}.`);
            }}
          />
        )}
      </Modal>
    </>
  );
}

function PlanCard({ plan, today, isGlobalMode, onPickBuilding, onMark, onCancel }) {
  const t = plan.totals;
  const percent = plan.totalAmount ? Math.round((t.paid / plan.totalAmount) * 100) : 0;
  return (
    <div className={`card stack${plan.status !== 'active' ? ' is-closed' : ''}`} style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="stack" style={{ gap: 6 }}>
          <div className="row" style={{ gap: 8 }}>
            {isGlobalMode && <BuildingName name={plan.buildingName} color={plan.buildingColor} onClick={onPickBuilding} />}
            <span className="badge badge-neutral">{PLAN_METHODS[plan.method]}</span>
            {plan.status !== 'active' && <span className="badge badge-warning">{PLAN_STATUS[plan.status]}</span>}
            {t.late.length > 0 && plan.status === 'active' && <span className="badge badge-danger">{t.late.length} באיחור</span>}
          </div>
          <h3 style={{ fontSize: '1.15rem' }}>{plan.direction === 'payable' ? '🏢 ← ' : '🏠 ← '}{counterpartyText(plan, plan.building)}</h3>
          <p className="section-sub" style={{ margin: 0 }}>{plan.purpose}{plan.debtMonths?.length ? ` · חודשים: ${plan.debtMonths.map(formatMonth).join(', ')}` : ''}</p>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div className="kpi-value" style={{ fontSize: '1.3rem' }}>
            {formatILS(t.remaining)}<span className="muted" style={{ fontSize: '0.9rem', fontWeight: 400 }}> נותרו</span>
          </div>
          <div className="muted" style={{ fontSize: '0.86rem' }}>
            שולמו {t.paidCount} מתוך {t.count} · {formatILS(plan.totalAmount)}
            {t.next && plan.status === 'active' ? ` · הבא: ${formatDateIL(t.next.dueDate)}` : ''}
          </div>
        </div>
      </div>
      <div className="progress"><div className="progress-bar" style={{ width: `${percent}%` }} /></div>

      <details>
        <summary className="muted" style={{ cursor: 'pointer', fontWeight: 600 }}>לוח התשלומים</summary>
        <div className="table-wrap" style={{ marginTop: 8 }}>
          <table className="data-table data-table-compact">
            <thead><tr><th>#</th><th>מועד</th><th className="num">סכום</th>{plan.method === 'checks' && <th>צ׳ק</th>}<th>סטטוס</th><th /></tr></thead>
            <tbody>
              {plan.installments.map(i => {
                const st = STATE_UI[installmentState(i, today)];
                return (
                  <tr key={i.n} className={st === STATE_UI.late ? 'row-alert' : ''}>
                    <td>{i.n}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{formatDateIL(i.dueDate)}</td>
                    <td className="num">{formatILS(i.amount)}</td>
                    {plan.method === 'checks' && <td className="ltr">{i.checkNumber || '—'}</td>}
                    <td>
                      <span className={`badge ${st.cls}`}><st.Icon size={12} /> {st.label}</span>
                      {i.status === 'paid' && <span className="cell-sub">{i.transactionId ? `נפרע ${formatDateIL(i.paidDate)} · מקושר לתנועה` : 'סומן ידנית'}</span>}
                    </td>
                    <td>
                      {plan.status === 'active' && i.status === 'pending' && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMark(i.n, true)}>סימון כשולם</button>}
                      {plan.status !== 'cancelled' && i.status === 'paid' && i.manual && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMark(i.n, false)}>ביטול הסימון</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      {plan.status === 'active' && (
        <div className="row"><button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>ביטול הפריסה</button></div>
      )}
    </div>
  );
}

function PlanForm({ building, direction, prefill, onSubmit, onCancel }) {
  const { expenseCategories } = useApp();
  const units = building.apartments || [];
  const [vendorName, setVendorName] = useState(prefill.vendorName || '');
  const [unitId, setUnitId] = useState(prefill.unitId || '');
  const unit = units.find(u => u.id === unitId);
  const [debtMonths, setDebtMonths] = useState(prefill.debtMonths || unit?.debtMonths || []);
  const [purpose, setPurpose] = useState(prefill.purpose || '');
  const [totalAmount, setTotalAmount] = useState(prefill.totalAmount ? String(prefill.totalAmount) : '');
  const [count, setCount] = useState(prefill.count ? String(prefill.count) : '');
  const [firstDate, setFirstDate] = useState(prefill.firstDate || todayISO());
  const [method, setMethod] = useState(prefill.method || (direction === 'payable' ? 'checks' : 'hiyuvit'));
  const [firstCheck, setFirstCheck] = useState('');
  const [category, setCategory] = useState(prefill.category || expenseCategories[0] || '');

  // בחירת דייר עם חוב: הסכום וחודשי החוב מתמלאים אוטומטית
  const pickUnit = (id) => {
    setUnitId(id);
    const u = units.find(x => x.id === id);
    setDebtMonths(u?.debtMonths || []);
    if (u?.debtMonths?.length) {
      setTotalAmount(String(aptDebt(u)));
      if (!purpose) setPurpose(`חוב דמי ועד ${u.debtMonths.map(formatMonth).join(', ')}`);
    }
  };

  const n = parseInt(count, 10) || 0;
  const schedule = n && totalAmount && firstDate ? buildSchedule({ totalAmount, count: n, firstDate, firstCheck: method === 'checks' ? firstCheck : '' }) : [];
  const draft = schedule.length ? buildPlan({ direction, vendorName, unitId, purpose, totalAmount, method, category, debtMonths, installments: schedule }) : null;
  const past = draft ? findPastMatches(building, draft) : [];

  const submit = (e) => {
    e.preventDefault();
    if (!draft || !purpose.trim() || (direction === 'payable' ? !vendorName.trim() : !unitId)) return;
    onSubmit({ direction, vendorName, unitId, purpose, totalAmount, method, category, debtMonths, installments: schedule }, past.length);
  };

  return (
    <form onSubmit={submit} className="form-stack">
      {direction === 'payable' ? (
        <div className="field-row">
          <Field label="ספק *">
            <input type="text" required className="input" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="למשל: שינדלר" />
          </Field>
          <Field label="קטגוריית הוצאה" hint="כל תשלום יירשם בקטגוריה הזו">
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      ) : (
        <Field label="דירה / יחידה *">
          <select className="select" required value={unitId} onChange={(e) => pickUnit(e.target.value)}>
            <option value="">— בחרו —</option>
            {units.map(u => <option key={u.id} value={u.id}>{unitLabel(u)} · {unitDisplayName(u)}{u.debtMonths?.length ? ` · חוב ${formatILS(aptDebt(u))}` : ''}</option>)}
          </select>
        </Field>
      )}
      {direction === 'receivable' && debtMonths.length > 0 && (
        <div className="info-panel" style={{ fontSize: '0.9rem' }}>
          חודשי החוב שייכנסו להסדר: <strong>{debtMonths.map(formatMonth).join(', ')}</strong>. הם יסומנו "בהסדר" ולא ייחשבו חוב מתמשך כל עוד ההסדר עומד בלוח הזמנים.
        </div>
      )}
      <Field label="על מה *">
        <input type="text" required className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={direction === 'payable' ? 'למשל: חוב תחזוקת מעלית 2025' : 'למשל: חוב דמי ועד 07–09.2026'} />
      </Field>
      <div className="field-row">
        <Field label="סכום החוב הכולל (₪) *">
          <input type="number" required min="1" step="0.01" className="input" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
        </Field>
        <Field label="מספר תשלומים *">
          <input type="number" required min="1" className="input" value={count} onChange={(e) => setCount(e.target.value)} />
        </Field>
        <Field label="תשלום ראשון *">
          <input type="date" required className="input" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} />
        </Field>
      </div>
      <div className="field">
        <span className="field-label">אמצעי תשלום</span>
        <Segmented
          value={method}
          onChange={setMethod}
          options={Object.entries(PLAN_METHODS)
            .filter(([k]) => direction === 'receivable' || k !== 'hiyuvit')
            .map(([id, label]) => ({ id, label }))}
        />
      </div>
      {method === 'checks' && (
        <Field label="מספר הצ׳ק הראשון" hint="המערכת מניחה מספרים רצים. בקליטת עו״ש, צ׳ק מזוהה לפי המספר שלו.">
          <input type="text" className="input ltr" value={firstCheck} onChange={(e) => setFirstCheck(e.target.value)} placeholder="0080000047" />
        </Field>
      )}

      {schedule.length > 0 && (
        <div className="table-wrap" style={{ maxHeight: 220, overflow: 'auto' }}>
          <table className="data-table data-table-compact">
            <thead><tr><th>#</th><th>מועד</th><th className="num">סכום</th>{method === 'checks' && <th>צ׳ק</th>}<th /></tr></thead>
            <tbody>
              {schedule.map(i => {
                const hit = past.find(p => p.n === i.n);
                return (
                  <tr key={i.n}>
                    <td>{i.n}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{formatDateIL(i.dueDate)}</td>
                    <td className="num">{formatILS(i.amount)}</td>
                    {method === 'checks' && <td className="ltr">{i.checkNumber || '—'}</td>}
                    <td>{hit ? <span className="badge badge-success">כבר שולם {formatDateIL(hit.tx.date)}</span> : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {past.length > 0 && (
        <div className="alert alert-success"><CheckCircle2 size={18} /><span>נמצאו {past.length} תשלומים שכבר יצאו מהבנק ומתאימים ללוח. הם יקושרו לפריסה.</span></div>
      )}

      <div className="modal-actions">
        <button type="submit" className="btn btn-primary">שמירת הפריסה</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>ביטול</button>
      </div>
    </form>
  );
}
