// ==========================================================================
// בית ומנוחה - פניות (אפיון 02): כרטיס לכל פנייה עם מספר רץ ושרשור עד לסגירה.
// פתוחות / ארכיון (קריאה בלבד), "בטיפול", דחיפות, קטגוריה, הערות פנימיות ורישום הוצאה.
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlusCircle, CheckCircle2, Clock, Send, Search, MessageSquare, RotateCcw, Lock, Wrench, Flame, Pencil, Receipt, Archive, CornerDownLeft } from 'lucide-react';
import { PageHeader, Segmented, Modal, Field, EmptyState, BuildingName, FlashMessage, useFlash } from './ui';
import { withBuilding, requestBuildingPick, todayISO } from '../utils/format';
import { formatDateIL } from '../utils/ledger';
import { unitLabel, unitDisplayName } from '../utils/units';
import { isMonthClosed } from '../utils/monthClose';
import { ISSUE_SOURCES, MANAGER_NAME, sortIssues, awaitingManager, waitingDays, canEdit } from '../utils/issues';

const issueKey = (i) => `${i.buildingId}:${i.id}`;
const when = (iso) => (iso ? `${formatDateIL(iso.slice(0, 10))} ${iso.slice(11, 16)}` : '');

export default function IssuesTracker() {
  const {
    currentBuilding, buildings, setSelectedBuildingId, systemSettings, expenseCategories, setActiveTab,
    createIssue, addIssueMessage, editIssueMessage, closeIssue, reopenIssue, setIssueInProgress, linkIssueExpense
  } = useApp();
  const isGlobalMode = !currentBuilding;
  const [flash, showFlash] = useFlash();
  const categories = systemSettings.issueCategories || [];

  const [tab, setTab] = useState('open'); // open | archive
  const [category, setCategory] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newIssue, setNewIssue] = useState(null); // טיוטת פנייה חדשה
  const [closing, setClosing] = useState(null);
  const [expenseFor, setExpenseFor] = useState(null);

  const scope = currentBuilding ? [currentBuilding] : buildings;
  const all = scope.flatMap(b => withBuilding(b, b.issues));
  const openCount = all.filter(i => i.status === 'open').length;
  const archiveCount = all.length - openCount;

  const q = searchQuery.trim().toLowerCase();
  const filtered = sortIssues(all.filter(i => {
    if ((tab === 'open') !== (i.status === 'open')) return false;
    if (category && i.category !== category) return false;
    if (!q) return true;
    const hay = [String(i.number), `#${i.number}`, i.title, i.buildingName, i.author, ...(i.messages || []).filter(m => m.kind !== 'event').map(m => m.text)];
    return hay.some(v => (v || '').toLowerCase().includes(q));
  }));

  const active = all.find(i => issueKey(i) === selectedKey) || filtered[0] || null;

  const openNew = (followUp = null) => {
    const b = followUp ? buildings.find(x => x.id === followUp.buildingId) : currentBuilding;
    if (!b) { requestBuildingPick('לאיזה בניין לפתוח את הפנייה? בחרו בניין'); return; }
    setNewIssue({
      buildingId: b.id,
      title: followUp ? `בהמשך לפנייה #${followUp.number}: ${followUp.title}` : '',
      body: '',
      category: followUp?.category || '',
      urgent: false,
      source: 'phone',
      reportedBy: '',
      followUpOf: followUp ? followUp.id : null,
      followUpNumber: followUp?.number || null
    });
  };

  const submitNew = (e) => {
    e.preventDefault();
    if (!newIssue.title.trim() || !newIssue.body.trim()) return;
    createIssue(newIssue.buildingId, {
      title: newIssue.title,
      body: newIssue.body,
      author: MANAGER_NAME,
      isManager: true,
      urgent: newIssue.urgent,
      category: newIssue.category,
      source: newIssue.source,
      reportedBy: newIssue.reportedBy,
      followUpOf: newIssue.followUpOf
    });
    setNewIssue(null);
    setTab('open');
    setSelectedKey(null);
    showFlash('הפנייה נפתחה.');
  };

  return (
    <div className="page">
      <PageHeader
        title="פניות"
        subtitle={`${openCount} פתוחות · ${archiveCount} בארכיון`}
        actions={<button onClick={() => openNew()} className="btn btn-primary"><PlusCircle size={17} /> פנייה חדשה</button>}
      />
      <FlashMessage flash={flash} />

      <div className="issues-split">
        {/* רשימה */}
        <div className="card card-flush">
          <div className="card-header" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <Segmented
              value={tab}
              onChange={(v) => { setTab(v); setSelectedKey(null); }}
              options={[{ id: 'open', label: 'פתוחות', count: openCount }, { id: 'archive', label: 'ארכיון', count: archiveCount }]}
            />
            <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
              <div className="search-box" style={{ maxWidth: 'none', flex: 1 }}>
                <Search size={16} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="חיפוש לפי מספר, נושא או טקסט..." className="input input-sm" />
              </div>
              {categories.length > 0 && (
                <select className="select input-sm" style={{ width: 'auto' }} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="קטגוריה">
                  <option value="">כל הקטגוריות</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="issue-list">
            {filtered.length === 0 ? (
              <EmptyState icon={tab === 'open' ? MessageSquare : Archive} title={tab === 'open' ? 'אין פניות פתוחות' : 'הארכיון ריק'} text={tab === 'open' ? 'אין כרגע פניות שממתינות לטיפול.' : 'פניות שנסגרו יופיעו כאן.'} />
            ) : filtered.map(i => {
              const selected = active && issueKey(active) === issueKey(i);
              const waiting = awaitingManager(i);
              const days = waiting ? waitingDays(i) : 0;
              return (
                <button key={issueKey(i)} type="button" className={`issue-item${selected ? ' is-selected' : ''}${i.urgent && i.status === 'open' ? ' is-urgent' : ''}`} style={{ '--issue-color': i.buildingColor?.primary }} onClick={() => setSelectedKey(issueKey(i))}>
                  <span className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                    {isGlobalMode ? <BuildingName name={i.buildingName} color={i.buildingColor} /> : <span className="muted" style={{ fontSize: '0.85rem' }}>#{i.number} · {i.author}</span>}
                    <span className="muted" style={{ fontSize: '0.82rem' }}>{formatDateIL((i.lastActivityAt || i.createdAt || '').slice(0, 10))}</span>
                  </span>
                  <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                    {i.status === 'open' ? <Clock size={15} color="var(--warning)" style={{ flexShrink: 0 }} /> : <CheckCircle2 size={15} color="var(--success)" style={{ flexShrink: 0 }} />}
                    <span className="issue-title">{isGlobalMode ? `#${i.number} ` : ''}{i.title}</span>
                  </span>
                  <span className="row" style={{ gap: 6 }}>
                    {i.urgent && i.status === 'open' && <span className="badge badge-danger"><Flame size={11} /> דחופה</span>}
                    {i.inProgress && i.status === 'open' && <span className="badge badge-petrol"><Wrench size={11} /> בטיפול</span>}
                    {i.category && <span className="badge badge-neutral">{i.category}</span>}
                    {waiting && <span className="badge badge-warning">ממתינה לתשובה{days ? ` · ${days} ימים` : ''}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* כרטיס הפנייה */}
        {active ? (
          <IssueCard
            key={issueKey(active)}
            issue={active}
            isGlobalMode={isGlobalMode}
            onPickBuilding={() => setSelectedBuildingId(active.buildingId)}
            onSend={(text, internal) => addIssueMessage(active.buildingId, active.id, { text, internal })}
            onEdit={(mid, text) => editIssueMessage(active.buildingId, active.id, mid, text)}
            onInProgress={(v) => setIssueInProgress(active.buildingId, active.id, v)}
            onClose={() => setClosing(active)}
            onReopen={() => { reopenIssue(active.buildingId, active.id); setTab('open'); showFlash(`פנייה #${active.number} נפתחה מחדש.`); }}
            onFollowUp={() => openNew(active)}
            onExpense={() => setExpenseFor(active)}
            parent={active.followUpOf ? all.find(x => x.id === active.followUpOf) || buildings.flatMap(b => b.issues || []).find(x => x.id === active.followUpOf) : null}
          />
        ) : (
          <div className="card"><EmptyState icon={MessageSquare} title="לא נבחרה פנייה" text="בחרו פנייה מהרשימה כדי לראות את הכרטיס." /></div>
        )}
      </div>

      {/* פנייה חדשה */}
      <Modal isOpen={!!newIssue} onClose={() => setNewIssue(null)} title={newIssue?.followUpNumber ? `פנייה בהמשך לפנייה #${newIssue.followUpNumber}` : 'פנייה חדשה'} subtitle={(() => { const b = buildings.find(x => x.id === newIssue?.buildingId); return b ? <BuildingName name={b.name} color={b.color} /> : null; })()}>
        {newIssue && (
          <form onSubmit={submitNew} className="form-stack">
            <Field label="נושא *">
              <input type="text" required className="input" value={newIssue.title} onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })} placeholder="למשל: שער החניון תקוע" />
            </Field>
            <Field label="תיאור *">
              <textarea rows={4} required className="textarea" value={newIssue.body} onChange={(e) => setNewIssue({ ...newIssue, body: e.target.value })} placeholder="מה קרה? אם הפנייה הגיעה בכתב — אפשר להדביק כאן את הנוסח המקורי." />
            </Field>
            <div className="field-row">
              <Field label="מקור הפנייה">
                <select className="select" value={newIssue.source} onChange={(e) => setNewIssue({ ...newIssue, source: e.target.value })}>
                  {Object.entries(ISSUE_SOURCES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </Field>
              {newIssue.source !== 'manager' && (
                <Field label="פנה">
                  <input
                    type="text"
                    className="input"
                    list="issue-reporters"
                    value={newIssue.reportedBy}
                    onChange={(e) => setNewIssue({ ...newIssue, reportedBy: e.target.value })}
                    placeholder="בחירה מהדיירים או טקסט חופשי"
                  />
                  <datalist id="issue-reporters">
                    {(buildings.find(b => b.id === newIssue.buildingId)?.apartments || []).map(u => (
                      <option key={u.id} value={`${unitDisplayName(u)} (${unitLabel(u)})`} />
                    ))}
                  </datalist>
                </Field>
              )}
            </div>
            <div className="field-row">
              <Field label="קטגוריה">
                <select className="select" value={newIssue.category} onChange={(e) => setNewIssue({ ...newIssue, category: e.target.value })}>
                  <option value="">ללא</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <div className="field">
                <span className="field-label">דחיפות</span>
                <Segmented value={newIssue.urgent ? 'urgent' : 'normal'} onChange={(v) => setNewIssue({ ...newIssue, urgent: v === 'urgent' })} options={[{ id: 'normal', label: 'רגילה' }, { id: 'urgent', label: 'דחופה' }]} />
              </div>
            </div>
            <div className="modal-actions">
              <button type="submit" className="btn btn-primary">פתיחת הפנייה</button>
              <button type="button" className="btn btn-secondary" onClick={() => setNewIssue(null)}>ביטול</button>
            </div>
          </form>
        )}
      </Modal>

      <CloseModal issue={closing} onCancel={() => setClosing(null)} onConfirm={(summary) => {
        closeIssue(closing.buildingId, closing.id, summary);
        showFlash(`פנייה #${closing.number} נסגרה ועברה לארכיון.`);
        setClosing(null);
        setSelectedKey(null);
      }} />

      <ExpenseModal
        issue={expenseFor}
        building={expenseFor ? buildings.find(b => b.id === expenseFor.buildingId) : null}
        categories={expenseCategories}
        onCancel={() => setExpenseFor(null)}
        onOpenSettings={() => setActiveTab('settings', 'categories')}
        onConfirm={(data) => {
          linkIssueExpense(expenseFor.buildingId, expenseFor.id, data);
          showFlash(data.method === 'cash' ? 'ההוצאה נרשמה בכספים וקושרה לפנייה.' : 'נרשם בשרשור: שולם בהעברה בנקאית.');
          setExpenseFor(null);
        }}
      />
    </div>
  );
}

function IssueCard({ issue, isGlobalMode, onPickBuilding, onSend, onEdit, onInProgress, onClose, onReopen, onFollowUp, onExpense, parent }) {
  const [text, setText] = useState('');
  const [internal, setInternal] = useState(false);
  const [editing, setEditing] = useState(null); // { id, text }
  const isOpen = issue.status === 'open';
  const source = issue.source && issue.source !== 'manager' ? ` · בעקבות ${ISSUE_SOURCES[issue.source]}${issue.reportedBy ? ` מ${issue.reportedBy}` : ''}` : '';

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text, internal);
    setText('');
    setInternal(false);
  };

  return (
    <div className="card stack" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: 14 }}>
        <div className="stack" style={{ gap: 6 }}>
          <div className="row" style={{ gap: 8 }}>
            {isGlobalMode && <BuildingName name={issue.buildingName} color={issue.buildingColor} onClick={onPickBuilding} />}
            <span className={`badge badge-dot ${isOpen ? 'badge-warning' : 'badge-success'}`}>{isOpen ? 'פתוחה' : 'בארכיון'}</span>
            {issue.urgent && isOpen && <span className="badge badge-danger"><Flame size={12} /> דחופה</span>}
            {issue.inProgress && isOpen && <span className="badge badge-petrol"><Wrench size={12} /> בטיפול</span>}
            {issue.category && <span className="badge badge-neutral">{issue.category}</span>}
          </div>
          <h2 style={{ fontSize: '1.3rem' }}><span className="muted">#{issue.number}</span> {issue.title}</h2>
          <span className="muted" style={{ fontSize: '0.86rem' }}>נפתחה ע״י {issue.author} · {when(issue.createdAt)}{source}</span>
          {parent && <span className="muted" style={{ fontSize: '0.86rem' }}><CornerDownLeft size={13} /> בהמשך לפנייה #{parent.number}: {parent.title}</span>}
        </div>
        <div className="row" style={{ gap: 8 }}>
          {isOpen ? (
            <>
              <button type="button" className={`btn btn-sm ${issue.inProgress ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => onInProgress(!issue.inProgress)}>
                <Wrench size={15} /> {issue.inProgress ? 'הסרת "בטיפול"' : 'בטיפול'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onExpense} title="רישום הוצאה שהטיפול בפנייה עלה"><Receipt size={15} /> רישום הוצאה</button>
              <button type="button" className="btn btn-success btn-sm" onClick={onClose}><CheckCircle2 size={15} /> סגירה</button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onFollowUp}><PlusCircle size={15} /> פנייה בהמשך</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onReopen}><RotateCcw size={15} /> פתיחה מחדש</button>
            </>
          )}
        </div>
      </div>

      <div className="stack" style={{ gap: 10 }}>
        {(issue.messages || []).map(m => {
          if (m.kind === 'event') return <div key={m.id} className="thread-event">{m.text} · {when(m.at)}</div>;
          const isInternal = m.kind === 'internal';
          const editable = isOpen && canEdit(m);
          return (
            <div key={m.id} className={`comment${m.isManager ? ' comment--manager' : ''}${isInternal ? ' comment--internal' : ''}`}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="row" style={{ gap: 8 }}>
                  <strong style={{ fontSize: '0.93rem' }}>{m.author}</strong>
                  {isInternal ? <span className="badge badge-warning"><Lock size={11} /> הערה פנימית · הנציגים לא רואים</span> : m.isManager && <span className="badge badge-gold">הנהלה</span>}
                </span>
                <span className="muted" style={{ fontSize: '0.82rem' }}>
                  {when(m.at)}{m.editedAt ? ' · נערך' : ''}
                  {editable && editing?.id !== m.id && <button type="button" className="icon-link" onClick={() => setEditing({ id: m.id, text: m.text })} title="עריכה (עד 15 דקות מהשליחה)"><Pencil size={13} /></button>}
                </span>
              </div>
              {editing?.id === m.id ? (
                <div className="stack" style={{ gap: 6 }}>
                  <textarea className="textarea" rows={3} value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} />
                  <div className="row" style={{ gap: 6 }}>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => { onEdit(m.id, editing.text); setEditing(null); }}>שמירה</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}>ביטול</button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', color: 'var(--ink-800)', margin: 0 }}>{m.text}</p>
              )}
            </div>
          );
        })}
      </div>

      {isOpen ? (
        <form onSubmit={send} className="stack" style={{ gap: 10, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <Field label={internal ? 'הערה פנימית (רק למנהל)' : 'תגובה'}>
            <textarea rows={3} className={`textarea${internal ? ' is-internal' : ''}`} value={text} onChange={(e) => setText(e.target.value)} placeholder={internal ? 'למשל: הצעת מחיר מהקבלן 2,400 ₪' : 'עדכון לנציגי הבניין...'} />
          </Field>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <label className="check-chip">
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
              <Lock size={13} /> הערה פנימית — הנציגים לא יראו
            </label>
            <button type="submit" disabled={!text.trim()} className="btn btn-primary"><Send size={15} /> {internal ? 'שמירת ההערה' : 'שליחת תגובה'}</button>
          </div>
        </form>
      ) : (
        <div className="info-panel muted" style={{ fontSize: '0.9rem' }}>
          <Archive size={15} /> הפנייה בארכיון ולקריאה בלבד{issue.closedAt ? ` (נסגרה ${formatDateIL(issue.closedAt.slice(0, 10))})` : ''}. אם הבעיה חזרה — "פנייה בהמשך", או פתיחה מחדש.
        </div>
      )}
    </div>
  );
}

function CloseModal({ issue, onCancel, onConfirm }) {
  const [summary, setSummary] = useState('');
  return (
    <Modal isOpen={!!issue} onClose={onCancel} size="sm" title={issue ? `סגירת פנייה #${issue.number}` : ''} subtitle="הפנייה תעבור לארכיון. הודעת הסיכום תופיע בשרשור ותישלח לנציגים.">
      <form onSubmit={(e) => { e.preventDefault(); onConfirm(summary); setSummary(''); }} className="form-stack">
        <Field label="הודעת סיכום (לא חובה)">
          <textarea rows={3} className="textarea" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="למשל: המעלית תוקנה, הטכנאי היה ב-14.10" />
        </Field>
        <div className="modal-actions">
          <button type="submit" className="btn btn-success">סגירה והעברה לארכיון</button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}

// רישום הוצאה מפנייה (אפיון 02, סעיף 7.9): מזומן → הוצאה בכספים; העברה → הערה בלבד (כדי לא לספור פעמיים)
function ExpenseModal({ issue, building, categories, onCancel, onConfirm, onOpenSettings }) {
  const [method, setMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('תחזוקה שוטפת והוצאות חריגות');
  const [date, setDate] = useState(todayISO());
  const [reason, setReason] = useState('');
  if (!issue) return null;
  const closed = method === 'cash' && building && isMonthClosed(building, date.slice(0, 7));

  const submit = (e) => {
    e.preventDefault();
    if (method === 'cash' && !amount) return;
    if (closed && !reason.trim()) return;
    onConfirm({ method, amount, category, date, reason, description: `פנייה #${issue.number}: ${issue.title}` });
  };

  return (
    <Modal isOpen onClose={onCancel} title={`רישום הוצאה · פנייה #${issue.number}`} subtitle={issue.title}>
      <form onSubmit={submit} className="form-stack">
        <div className="field">
          <span className="field-label">איך שולם?</span>
          <Segmented value={method} onChange={setMethod} options={[{ id: 'cash', label: 'מזומן' }, { id: 'bank', label: 'העברה / הוראת קבע מהבנק' }]} />
        </div>
        {method === 'cash' ? (
          <>
            <div className="field-row">
              <Field label="סכום (₪) *"><input type="number" required min="1" step="0.01" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
              <Field label="תאריך"><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            </div>
            <Field label="קטגוריה">
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onOpenSettings}>הוספת קטגוריה בהגדרות ←</button>
            {closed && (
              <Field label="סיבה (חובה)" hint="החודש כבר נסגר. ההזנה תפתח אותו מחדש.">
                <input type="text" required className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
            )}
            <div className="info-panel" style={{ fontSize: '0.9rem' }}>ההוצאה תירשם בכספים כ"הוצאה במזומן" עם התיאור "פנייה #{issue.number}: {issue.title}", ותקושר לפנייה.</div>
          </>
        ) : (
          <>
            <Field label="סכום (לתיעוד, לא חובה)"><input type="number" min="0" step="0.01" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
            <div className="info-panel" style={{ fontSize: '0.9rem' }}>לא נוצרת הוצאה: התשלום ייקלט ממילא מדו״ח העו״ש, ורישום נוסף היה סופר אותו פעמיים. בשרשור תירשם הערה פנימית.</div>
          </>
        )}
        <div className="modal-actions">
          <button type="submit" className="btn btn-primary">רישום</button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}
