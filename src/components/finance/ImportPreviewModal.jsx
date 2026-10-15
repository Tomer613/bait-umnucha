// ==========================================================================
// בית ומנוחה - תצוגה מקדימה לפני קליטת קובץ (אפיון 04, סעיף 5)
// שום דבר לא נשמר עד שהמנהל מאשר. תנועות שכבר קיימות מדולגות אוטומטית.
// ==========================================================================
import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Info, Scale, Link2, PlusCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal, BuildingName } from '../ui';
import { formatILS, formatMonth } from '../../utils/format';
import { formatDateIL } from '../../utils/ledger';
import { summarizeBankPlan, INCOME_CATEGORIES } from '../../utils/importPlan';
import { classifyHiyuvit, groupUnitsText } from '../../utils/hiyuvitClassify';
import { unitLabel, unitDisplayName } from '../../utils/units';
import LevyForm from '../levies/LevyForm';

const ils2 = (n) => `${(n || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪`;

export default function ImportPreviewModal({ plan, building, onClose, onDone }) {
  if (!plan || !building) return null;
  return plan.type === 'bank'
    ? <BankPreview plan={plan} building={building} onClose={onClose} onDone={onDone} />
    : <HiyuvitPreview plan={plan} building={building} onClose={onClose} onDone={onDone} />;
}

function BankPreview({ plan: initialPlan, building, onClose, onDone }) {
  const { commitBankImport, expenseCategories, setActiveTab } = useApp();
  const [plan, setPlan] = useState(initialPlan);
  const [showExisting, setShowExisting] = useState(false);
  const [reason, setReason] = useState('');
  const summary = useMemo(() => summarizeBankPlan(building, plan), [building, plan]);

  const updateRow = (key, changes) => setPlan(p => ({ ...p, rows: p.rows.map(r => (r.key === key ? { ...r, ...changes } : r)) }));

  const visibleRows = plan.rows.filter(r => showExisting || r.status === 'new');
  const needsReason = summary.closedMonths.length > 0;
  const canCommit = summary.includedCount > 0 && (!needsReason || reason.trim());
  const rec = summary.reconciliation;

  const commit = () => {
    commitBankImport(building.id, plan, { reason: reason.trim() });
    onDone(`נקלטו ${summary.includedCount} תנועות מדו״ח העו״ש לבניין ${building.name}${summary.duplicates ? ` · ${summary.duplicates} שכבר היו קיימות דולגו` : ''}.`);
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" title="קליטת דו״ח עו״ש · תצוגה מקדימה" subtitle={<><BuildingName name={building.name} color={building.color} /> · <bdi dir="ltr">{plan.fileName}</bdi></>}>
      <div className="stack" style={{ gap: 14 }}>
        {plan.sameFile && (
          <div className="alert alert-warning">
            <Copy size={18} />
            <span>הקובץ הזה כבר נקלט ב-{formatDateIL(plan.sameFile.at.slice(0, 10))}. תנועות שכבר קיימות לא ייקלטו פעמיים.</span>
          </div>
        )}

        <div className="import-summary">
          <div className="import-stat is-good"><strong>{summary.newCount}</strong><span>תנועות חדשות</span></div>
          <div className="import-stat"><strong>{summary.duplicates}</strong><span>כבר קיימות · ידולגו</span></div>
          <div className="import-stat"><strong>{summary.allMonths.length}</strong><span>{summary.allMonths.length === 1 ? 'חודש' : 'חודשים'} בקובץ</span></div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {summary.allMonths.map(m => <span key={m} className="badge badge-neutral">{formatMonth(m)}</span>)}
        </div>

        {plan.chainBreaks > 0 && (
          <div className="alert alert-warning">
            <AlertTriangle size={18} />
            <span>ברצף היתרות בקובץ יש {plan.chainBreaks} קפיצות שלא מוסברות בתנועות. ייתכן שחסרות שורות בקובץ.</span>
          </div>
        )}

        {needsReason && (
          <div className="alert alert-warning stack" style={{ gap: 8, alignItems: 'stretch' }}>
            <span className="row" style={{ gap: 8 }}>
              <AlertTriangle size={18} />
              תנועות חדשות שייכות ל{summary.closedMonths.map(formatMonth).join(', ')}, {summary.closedMonths.length === 1 ? 'שכבר נסגר' : 'שכבר נסגרו'}. הקליטה {summary.closedMonths.length === 1 ? 'תפתח אותו' : 'תפתח אותם'} מחדש.
            </span>
            <input type="text" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="סיבה (חובה), למשל: תנועות מאוחרות מהבנק" aria-label="סיבה לפתיחת חודש סגור" />
          </div>
        )}

        <div className="table-wrap import-table">
          <table className="data-table data-table-compact">
            <thead>
              <tr>
                <th className="col-center">לקלוט</th>
                <th>תאריך</th>
                <th>תיאור</th>
                <th className="num">סכום</th>
                <th>קטגוריה</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(r => (
                <tr key={r.key} className={r.status === 'duplicate' ? 'is-muted' : ''}>
                  <td className="col-center">
                    {r.status === 'duplicate'
                      ? <span className="badge badge-neutral">קיים</span>
                      : <input type="checkbox" checked={r.include} onChange={(e) => updateRow(r.key, { include: e.target.checked })} aria-label="לקלוט את התנועה" />}
                  </td>
                  <td className="num" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{formatDateIL(r.row.date)}</td>
                  <td>
                    {r.row.description}
                    {r.planMatch && <span className="cell-sub unit-match">← {r.planMatch.text} ✓</span>}
                    {r.managerMode && r.status === 'new' && (
                      <select
                        className="select input-sm manager-mode"
                        value={r.managerMode}
                        onChange={(e) => updateRow(r.key, { managerMode: e.target.value, category: e.target.value === 'expense' ? 'החזר הוצאות למנהל (ללא פירוט)' : r.category })}
                        aria-label="העברה למנהל"
                      >
                        <option value="settle">העברה למנהל: סוגרת הוצאות שהוא שילם (לא הוצאה נוספת)</option>
                        <option value="expense">העברה למנהל: החזר בלי פירוט (נרשם כהוצאה)</option>
                      </select>
                    )}
                    {!r.planMatch && r.unitText && <span className="cell-sub unit-match">← {r.unitText}</span>}
                    {r.row.reference && <span className="cell-sub">אסמכתא {r.row.reference}</span>}
                  </td>
                  <td className={`num ${r.row.direction === 'in' ? 'amount-in' : 'amount-out'}`}>
                    <span className="money-signed">{r.row.direction === 'in' ? '+' : '−'}{ils2(r.row.amount)}</span>
                  </td>
                  <td>
                    <select
                      className="select input-sm"
                      value={r.category}
                      disabled={r.status === 'duplicate'}
                      onChange={(e) => updateRow(r.key, { category: e.target.value, ruleName: null })}
                      aria-label="קטגוריה"
                    >
                      {(r.row.direction === 'in' ? INCOME_CATEGORIES : expenseCategories).concat(
                        [r.category].filter(c => !(r.row.direction === 'in' ? INCOME_CATEGORIES : expenseCategories).includes(c))
                      ).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {r.ruleName && <span className="cell-sub">לפי כלל: {r.ruleName}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          {summary.duplicates > 0 ? (
            <label className="check-chip">
              <input type="checkbox" checked={showExisting} onChange={(e) => setShowExisting(e.target.checked)} />
              הצגת {summary.duplicates} התנועות שכבר קיימות
            </label>
          ) : <span />}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActiveTab('settings', 'categories')}>
            כללי סיווג אוטומטי בהגדרות ←
          </button>
        </div>

        {rec && (
          <div className={`reconcile ${rec.matches ? 'is-match' : 'is-gap'}`}>
            <Scale size={20} />
            <div>
              <div>יתרה לפי הבנק בסוף הקובץ ({formatDateIL(rec.date)}): <strong>{ils2(rec.bank)}</strong></div>
              <div>יתרת הבנק לפי המערכת אחרי הקליטה: <strong>{ils2(rec.computed)}</strong></div>
              {rec.matches ? (
                <div className="reconcile-verdict"><CheckCircle2 size={16} /> תואם לבנק</div>
              ) : (
                <div className="reconcile-verdict">
                  <AlertTriangle size={16} /> פער של {ils2(Math.abs(rec.diff))}.
                  {' '}בדרך כלל: יתרת פתיחה שלא עודכנה, תנועה שהוזנה ידנית וגם הגיעה מהבנק, או תנועה שנמחקה.
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActiveTab('settings', 'buildings')}>יתרת פתיחה בהגדרות ←</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-primary" disabled={!canCommit} onClick={commit}>
            אישור וקליטה של {summary.includedCount} תנועות
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </Modal>
  );
}

function HiyuvitPreview({ plan, building, onClose, onDone }) {
  const { commitHiyuvitImport, setActiveTab, systemSettings, currentMonth } = useApp();
  const nothingNew = plan.freshRowIds.length === 0;
  const blocked = plan.codeMismatch || nothingNew;

  const [overrides, setOverrides] = useState({}); // שיוך לקוח → יחידה
  const [decisions, setDecisions] = useState({}); // קבוצה → החלטה
  const [newLevies, setNewLevies] = useState([]); // גביות שהוגדרו מתוך הקליטה
  const [levyFormFor, setLevyFormFor] = useState(null); // קבוצה שעבורה מגדירים גבייה חדשה

  const freshRows = useMemo(() => plan.rows.filter(r => plan.freshRowIds.includes(r.id)), [plan]);
  // הגביות החדשות נכנסות לסיווג רק אחרי האישור, אבל כבר מוצגות כאפשרות שיוך
  const levyOptions = [...(building.specialLevies || []).filter(l => l.status === 'active'), ...newLevies];
  const classification = useMemo(
    () => classifyHiyuvit(building, freshRows, { overrides, threshold: systemSettings.levyDetectThreshold ?? 0.3 }),
    [building, freshRows, overrides, systemSettings.levyDetectThreshold]
  );
  const unitsById = Object.fromEntries((building.apartments || []).map(u => [u.id, u]));
  const unmappedClients = classification.clients.filter(c => !c.savedUnitId);

  // חיובים שזוהו כגבייה קיימת — מקובצים לפי גבייה, עם אפשרות לשיוך אחר
  const levyGroups = Object.values(classification.levyItems.reduce((acc, i) => {
    (acc[i.levyId] = acc[i.levyId] || { key: `levy:${i.levyId}`, levyId: i.levyId, amount: i.amount, items: [] }).items.push(i);
    return acc;
  }, {}));
  const confirmMode = systemSettings.levyConfirm || 'first_time';

  const decide = (key, d) => setDecisions(prev => ({ ...prev, [key]: d }));

  const commit = () => {
    // שיוך אחר לחיובים שזוהו כגבייה קיימת: הופכים אותם לקבוצה עם החלטה
    const moved = new Set(levyGroups.filter(g => decisions[g.key] && !(decisions[g.key].action === 'levy' && decisions[g.key].levyId === g.levyId)).map(g => g.levyId));
    const effective = {
      ...classification,
      levyItems: classification.levyItems.filter(i => !moved.has(i.levyId)),
      otherGroups: [
        ...classification.otherGroups,
        ...levyGroups.filter(g => moved.has(g.levyId)).map(g => ({ key: g.key, amount: g.amount, items: g.items }))
      ]
    };
    commitHiyuvitImport(building.id, plan, { classification: effective, decisions, newLevies });
    const pendingCount = [...effective.suspectedGroups, ...effective.otherGroups]
      .filter(g => !decisions[g.key] || decisions[g.key].action === 'later')
      .reduce((s, g) => s + g.items.length, 0);
    onDone(`דו״ח חיובית נקלט לבניין ${building.name}: ${plan.counts.success} גביות, נטו ${ils2(plan.totals.net)}${pendingCount ? ` · ${pendingCount} חיובים ממתינים לשיוך (במסך הגביות המיוחדות)` : ''}.`);
  };

  const failedDues = classification.dues.filter(i => i.status === 'failed');
  const paidDues = classification.dues.filter(i => i.status === 'paid');

  const decisionSelect = (g, { allowNew = true } = {}) => {
    const d = decisions[g.key];
    const value = d ? (d.action === 'levy' ? `levy:${d.levyId}` : d.action) : (g.defaultValue || 'later');
    return (
      <select
        className="select input-sm"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'new') { setLevyFormFor(g); return; }
          if (v.startsWith('levy:')) decide(g.key, { action: 'levy', levyId: v.slice(5) });
          else decide(g.key, { action: v });
        }}
        aria-label="שיוך החיובים"
      >
        <option value="later">אחר כך (ממתין לשיוך)</option>
        <option value="dues">דמי ועד</option>
        {levyOptions.map(l => <option key={l.id} value={`levy:${l.id}`}>גבייה: {l.name}</option>)}
        {allowNew && <option value="new">+ הגדרת גבייה מיוחדת חדשה…</option>}
      </select>
    );
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" title="קליטת דו״ח חיובית · תצוגה מקדימה" subtitle={<><BuildingName name={building.name} color={building.color} /> · <bdi dir="ltr">{plan.fileName}</bdi></>}>
      <div className="stack" style={{ gap: 14 }}>
        {plan.codeMismatch && (
          <div className="alert alert-error">
            <AlertTriangle size={18} />
            <span>
              הקובץ שייך לקוד בניין {plan.codes.join(', ')} בחיובית, אבל הקוד של {building.name} הוא {building.hiyuvitCode}. כנראה נבחר קובץ של בניין אחר.
              {' '}<button type="button" className="btn btn-ghost btn-sm" onClick={() => setActiveTab('settings', 'buildings')}>קוד חיובית בהגדרות ←</button>
            </span>
          </div>
        )}
        {(plan.sameFile || plan.duplicates > 0) && (
          <div className="alert alert-warning">
            <Copy size={18} />
            <span>{nothingNew ? 'כל השורות בקובץ כבר נקלטו.' : `${plan.duplicates} שורות כבר נקלטו בעבר ידולגו.`}</span>
          </div>
        )}

        <div className="import-summary">
          <div className="import-stat is-good"><strong>{plan.counts.success}</strong><span>גביות שהצליחו · {plan.counts.clients} לקוחות</span></div>
          <div className="import-stat is-bad"><strong>{plan.counts.failed}</strong><span>חיובים שנכשלו</span></div>
          <div className="import-stat"><strong>{ils2(plan.totals.net)}</strong><span>נטו להפקדה</span></div>
        </div>

        {!blocked && unmappedClients.length > 0 && (
          <details className="import-section" open>
            <summary><Link2 size={16} /> שיוך לקוחות חיובית ליחידות ({unmappedClients.length})</summary>
            <p className="section-sub" style={{ margin: '6px 0 10px' }}>
              לקוחות שעוד לא משויכים ליחידה. המערכת הציעה שיוך לפי השם — בדקו ותקנו. השיוך נשמר, ומהקליטה הבאה הזיהוי אוטומטי.
            </p>
            <div className="table-wrap import-table" style={{ maxHeight: '32vh' }}>
              <table className="data-table data-table-compact">
                <thead><tr><th>לקוח בחיובית</th><th>מספר לקוח</th><th>יחידה</th></tr></thead>
                <tbody>
                  {unmappedClients.map(c => {
                    const key = c.clientNumber || c.name;
                    return (
                      <tr key={key}>
                        <td>{c.name}</td>
                        <td className="ltr">{c.clientNumber}</td>
                        <td>
                          <select className="select input-sm" value={c.unitId || ''} onChange={(e) => setOverrides(prev => ({ ...prev, [key]: e.target.value }))} aria-label={`יחידה עבור ${c.name}`}>
                            <option value="">— לא משויך —</option>
                            {(building.apartments || []).map(u => <option key={u.id} value={u.id}>{unitLabel(u)}{unitDisplayName(u) ? ` · ${unitDisplayName(u)}` : ''}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {!blocked && unmappedClients.some(c => !c.unitId) && (
          <div className="alert alert-warning">
            <AlertTriangle size={18} />
            <span>
              {unmappedClients.filter(c => !c.unitId).length} לקוחות לא משויכים ליחידה. בלי שיוך אי אפשר לדעת מה דמי הוועד שלהם, ולכן החיובים שלהם מגיעים ל״דורשים שיוך״.
              {' '}כדאי לשייך למעלה, או לייבא את רשימת הדיירים מאקסל עם עמודת ״מספר לקוח בחיובית״.
            </span>
          </div>
        )}

        {!blocked && (
          <div className="import-section stack" style={{ gap: 8 }}>
            <span className="field-label">סיווג החיובים</span>
            <div className="class-line">
              <CheckCircle2 size={16} color="var(--success)" />
              <span><strong>דמי ועד:</strong> {paidDues.length} שולמו{failedDues.length ? ` · ${failedDues.length} נכשלו — ${Array.from(new Set(failedDues.map(i => unitLabel(unitsById[i.unitId])))).join(', ')} ייכנסו לחוב` : ''}</span>
            </div>
            {levyGroups.map(g => {
              const levy = levyOptions.find(l => l.id === g.levyId);
              const needsConfirm = confirmMode === 'always' || !levy?.confirmedAt;
              return (
                <div key={g.key} className="class-line">
                  <Info size={16} color="var(--petrol-600)" />
                  <span>{g.items.length} חיובים של {formatILS(g.amount)} שויכו לגבייה <strong>{levy?.name}</strong></span>
                  {needsConfirm && <span className="class-actions">{decisionSelect({ ...g, defaultValue: `levy:${g.levyId}` }, { allowNew: false })}</span>}
                </div>
              );
            })}
          </div>
        )}

        {!blocked && classification.suspectedGroups.map(g => {
          const d = decisions[g.key];
          const created = d?.action === 'levy' && newLevies.find(l => l.id === d.levyId);
          return (
            <div key={g.key} className="suspect-box">
              <div className="row" style={{ gap: 8 }}>
                <AlertTriangle size={18} />
                <strong>זוהו {g.items.length} חיובים של {formatILS(g.amount)} שאינם דמי ועד</strong>
              </div>
              <p style={{ margin: 0 }}>
                אצל {g.clientCount} מתוך {classification.totalClients} הלקוחות ({Math.round(g.share * 100)}%), {g.months.map(formatMonth).join(', ')}. כנראה גבייה מיוחדת שעוד לא הוגדרה במערכת.
              </p>
              {created ? (
                <div className="row" style={{ gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--success)" /> תוגדר גבייה חדשה: <strong>{created.name}</strong> · {created.purpose}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLevyFormFor(g)}>עריכה</button>
                </div>
              ) : (
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setLevyFormFor(g)}><PlusCircle size={15} /> להגדיר עכשיו גבייה מיוחדת</button>
                  <span className="muted">או:</span>
                  {decisionSelect(g, { allowNew: false })}
                </div>
              )}
            </div>
          );
        })}

        {!blocked && classification.otherGroups.length > 0 && (
          <div className="import-section stack" style={{ gap: 8 }}>
            <span className="field-label">דורשים שיוך ({classification.otherGroups.reduce((s, g) => s + g.items.length, 0)})</span>
            {classification.otherGroups.map(g => (
              <div key={g.key} className="class-line">
                <span className="badge badge-warning">{formatILS(g.amount)}</span>
                <span>{g.items.length === 1 ? 'חיוב אחד' : `${g.items.length} חיובים`} · {groupUnitsText(building, g)}{g.items.some(i => i.status === 'failed') ? ' · כולל חיובים שנכשלו' : ''}</span>
                <span className="class-actions">{decisionSelect(g)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="table-wrap">
          <table className="data-table data-table-compact">
            <tbody>
              <tr><td>גבייה ברוטו</td><td className="num amount-in">{ils2(plan.totals.gross)}</td></tr>
              <tr><td>עמלות סליקה</td><td className="num amount-out">−{ils2(plan.totals.fees - plan.totals.returnFees)}</td></tr>
              {plan.totals.returnFees > 0 && <tr><td>עמלות על חיובים שחזרו ({plan.counts.returnFees})</td><td className="num amount-out">−{ils2(plan.totals.returnFees)}</td></tr>}
              <tr className="cell-strong"><td>נטו להפקדה בבנק</td><td className="num">{ils2(plan.totals.net)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="alert alert-info">
          <Info size={18} />
          <span>
            הקובץ <strong>לא משנה את היתרה</strong>. חיובית מעבירה את הכסף לבנק, והוא ייספר כשההפקדה תופיע בדו״ח העו״ש
            {plan.lastDate ? ` (בדרך כלל בסביבות ה-7 בחודש שאחרי ${formatMonth(plan.lastDate.slice(0, 7))})` : ''}.
          </span>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-primary" disabled={blocked} onClick={commit}>אישור וקליטה</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>ביטול</button>
        </div>
      </div>

      <Modal isOpen={!!levyFormFor} onClose={() => setLevyFormFor(null)} title="גבייה מיוחדת חדשה" subtitle={levyFormFor ? `${levyFormFor.items.length} חיובים של ${formatILS(levyFormFor.amount)} מקובץ חיובית` : ''}>
        {levyFormFor && (
          <LevyForm
            building={building}
            currentMonth={currentMonth}
            initial={newLevies.find(l => decisions[levyFormFor.key]?.levyId === l.id) || {
              mode: 'one_time',
              amountPerApt: levyFormFor.amount,
              startMonth: levyFormFor.months[0],
              participantIds: Array.from(new Set(levyFormFor.items.map(i => i.unitId).filter(Boolean))),
              origin: 'auto_detected'
            }}
            submitText="הגדרת הגבייה"
            onCancel={() => setLevyFormFor(null)}
            onSubmit={(data) => {
              const id = data.id || `levy-${Date.now()}`;
              const levy = { ...data, id, origin: 'auto_detected' };
              setNewLevies(prev => [...prev.filter(l => l.id !== id), levy]);
              decide(levyFormFor.key, { action: 'levy', levyId: id });
              setLevyFormFor(null);
            }}
          >
            <div className="alert alert-info"><Info size={16} /> <span>חובה לרשום בעבור מה נגבה הכסף. הגבייה תישמר רק כשתאשרו את הקליטה.</span></div>
          </LevyForm>
        )}
      </Modal>
    </Modal>
  );
}
