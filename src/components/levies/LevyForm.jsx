// ==========================================================================
// בית ומנוחה - טופס גבייה מיוחדת: חד-פעמית או בפריסה לתשלומים (אפיון 05, סעיף 3)
// משמש גם ליצירה ידנית וגם להגדרה מתוך קליטת חיובית (סעיף 4.3)
// ==========================================================================
import React, { useState } from 'react';
import { Store } from 'lucide-react';
import { Field, Segmented } from '../ui';
import { formatILS, formatMonth } from '../../utils/format';
import { unitLabel, unitDisplayName, residentialUnits, commercialUnits } from '../../utils/units';
import { round2 } from '../../utils/ledger';

// initial: ערכי פתיחה (למשל מזיהוי בחיובית). onSubmit מקבל את נתוני הגבייה המלאים.
export default function LevyForm({ building, initial = {}, currentMonth, submitText = 'שמירת הגבייה', onSubmit, onCancel, children }) {
  const residential = residentialUnits(building);
  const commercial = commercialUnits(building);
  const isEdit = !!initial.id;

  const [name, setName] = useState(initial.name || '');
  const [purpose, setPurpose] = useState(initial.purpose || '');
  const [mode, setMode] = useState(initial.mode || 'one_time');
  // אופן הזנת הסכום: total (לבניין) | perUnit (לדירה) | monthly (לחודש)
  const [entry, setEntry] = useState(initial.mode === 'monthly' ? 'monthly' : 'perUnit');
  const [amount, setAmount] = useState(initial.amountPerApt ? String(initial.amountPerApt) : '');
  const [installments, setInstallments] = useState(initial.installments && initial.mode === 'monthly' ? String(initial.installments) : '');
  const [startMonth, setStartMonth] = useState(initial.startMonth || currentMonth);
  const [selected, setSelected] = useState(() => new Set(initial.participantIds || residential.map(u => u.id)));
  const [includesCommercial, setIncludesCommercial] = useState(!!initial.includesCommercial);
  const [commercialAmount, setCommercialAmount] = useState(initial.amountPerCommercialUnit ? String(initial.amountPerCommercialUnit) : '');

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const setAll = (units, on) => setSelected(prev => {
    const next = new Set(prev);
    units.forEach(u => (on ? next.add(u.id) : next.delete(u.id)));
    return next;
  });

  const chosenRes = residential.filter(u => selected.has(u.id));
  const chosenCom = includesCommercial ? commercial.filter(u => selected.has(u.id)) : [];
  const unitCount = chosenRes.length + chosenCom.length;
  const n = parseInt(installments, 10) || 0;
  const raw = parseFloat(amount) || 0;

  // הסכום לדירה (לחודש, בפריסה)
  const perUnit = (() => {
    if (mode === 'one_time') return entry === 'total' ? (unitCount ? raw / unitCount : 0) : raw;
    if (entry === 'perUnit') return n ? raw / n : 0;
    return raw;
  })();
  const months = mode === 'one_time' ? 1 : n;
  const comAmount = parseFloat(commercialAmount) || perUnit;
  const target = round2(chosenRes.length * perUnit * (months || 1) + chosenCom.length * comAmount * (months || 1));

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !purpose.trim() || !perUnit || unitCount === 0) return;
    if (mode === 'monthly' && entry === 'perUnit' && !n) return;
    onSubmit({
      ...initial,
      name,
      purpose,
      mode,
      amountPerApt: round2(perUnit),
      installments: mode === 'monthly' ? (n || null) : 1,
      startMonth,
      participantIds: [...chosenRes, ...chosenCom].map(u => u.id),
      includesCommercial: chosenCom.length > 0,
      amountPerCommercialUnit: chosenCom.length && commercialAmount ? round2(parseFloat(commercialAmount)) : null
    });
  };

  return (
    <form onSubmit={submit} className="form-stack">
      {children}
      <div className="field-row">
        <Field label="שם הגבייה *">
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="למשל: שיפוץ לובי" />
        </Field>
        <Field label="חודש התחלה *">
          <input type="month" required value={startMonth} onChange={(e) => setStartMonth(e.target.value)} className="input" />
        </Field>
      </div>
      <Field label="בעבור מה נגבה הכסף? *" hint="מופיע בדוחות לדיירים ולנציגים.">
        <input type="text" required value={purpose} onChange={(e) => setPurpose(e.target.value)} className="input" placeholder="למשל: החלפת ריצוף ותאורה בלובי הכניסה" />
      </Field>

      <div className="field">
        <span className="field-label">אופן הגבייה</span>
        <Segmented
          value={mode}
          onChange={(m) => { setMode(m); setEntry(m === 'monthly' ? 'monthly' : 'perUnit'); }}
          options={[{ id: 'one_time', label: 'חד-פעמי' }, { id: 'monthly', label: 'פריסה לתשלומים' }]}
        />
      </div>

      <div className="field">
        <span className="field-label">איך להזין את הסכום</span>
        <Segmented
          value={entry}
          onChange={setEntry}
          options={mode === 'one_time'
            ? [{ id: 'perUnit', label: 'סכום לדירה' }, { id: 'total', label: 'סכום כולל לבניין' }]
            : [{ id: 'monthly', label: 'סכום חודשי לדירה' }, { id: 'perUnit', label: 'סכום לדירה ÷ תשלומים' }]}
        />
      </div>

      <div className="field-row">
        <Field label={entry === 'total' ? 'סכום כולל (₪) *' : entry === 'monthly' ? 'סכום לחודש לדירה (₪) *' : mode === 'monthly' ? 'סכום כולל לדירה (₪) *' : 'סכום לדירה (₪) *'}>
          <input type="number" required min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" />
        </Field>
        {mode === 'monthly' && (
          <Field label={entry === 'perUnit' ? 'מספר תשלומים *' : 'מספר תשלומים'} hint={entry === 'monthly' ? 'ריק = ללא הגבלה (למשל קרן שמורה)' : undefined}>
            <input type="number" min="1" required={entry === 'perUnit'} value={installments} onChange={(e) => setInstallments(e.target.value)} className="input" />
          </Field>
        )}
      </div>

      {/* דירות משתתפות — מסחר לא כלול כברירת מחדל (אפיון 06, סעיף 5.1) */}
      <div className="info-panel stack" style={{ gap: 10 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="field-label">דירות משתתפות ({chosenRes.length} מתוך {residential.length})</span>
          <span className="row" style={{ gap: 6 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAll(residential, true)}>סמן הכול</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAll(residential, false)}>נקה הכול</button>
          </span>
        </div>
        <div className="unit-checklist">
          {residential.map(u => (
            <label key={u.id} className="check-chip">
              <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
              {unitLabel(u)}{unitDisplayName(u) ? ` · ${unitDisplayName(u)}` : ''}
            </label>
          ))}
          {residential.length === 0 && <span className="muted">אין דירות רשומות בבניין.</span>}
        </div>

        {commercial.length > 0 && (
          includesCommercial ? (
            <div className="stack" style={{ gap: 8 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="field-label"><Store size={14} /> יחידות מסחר</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIncludesCommercial(false)}>בלי מסחר</button>
              </div>
              <div className="unit-checklist">
                {commercial.map(u => (
                  <label key={u.id} className="check-chip">
                    <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
                    {unitLabel(u)}{unitDisplayName(u) ? ` · ${unitDisplayName(u)}` : ''}
                  </label>
                ))}
              </div>
              <Field label="סכום ליחידת מסחר (₪)" hint="ריק = אותו סכום כמו דירה">
                <input type="number" min="0" step="0.01" value={commercialAmount} onChange={(e) => setCommercialAmount(e.target.value)} className="input" />
              </Field>
            </div>
          ) : (
            <div className="commercial-bar">
              <span><Store size={16} /> הגבייה לא כוללת יחידות מסחר ({commercial.length})</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setIncludesCommercial(true); setAll(commercial, true); }}>+ לכלול מסחר</button>
            </div>
          )
        )}
      </div>

      {perUnit > 0 && unitCount > 0 && (
        <div className="alert alert-info">
          <span>
            {formatILS(perUnit)} {mode === 'monthly' ? 'לחודש ' : ''}ל{unitCount === 1 ? 'יחידה אחת' : `כל אחת מ-${unitCount} היחידות`}
            {mode === 'monthly' ? (n ? ` · ${n} תשלומים מ${formatMonth(startMonth)}` : ` · ללא הגבלה, מ${formatMonth(startMonth)}`) : ` · ${formatMonth(startMonth)}`}
            {months ? ` · יעד כולל ${formatILS(target)}` : ''}
          </span>
        </div>
      )}

      <div className="modal-actions">
        <button type="submit" className="btn btn-primary">{isEdit ? 'שמירת השינויים' : submitText}</button>
        {onCancel && <button type="button" className="btn btn-secondary" onClick={onCancel}>ביטול</button>}
      </div>
    </form>
  );
}

