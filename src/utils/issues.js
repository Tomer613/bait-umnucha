// ==========================================================================
// בית ומנוחה - מודול פניות (אפיון 02)
// כרטיס פנייה עם מספר רץ, שרשור הודעות, אירועי מערכת, הערות פנימיות, סטטוס "בטיפול",
// דחיפות וקטגוריה. פנייה סגורה עוברת לארכיון לקריאה בלבד.
//
// issue: { id, number, title, status: 'open' | 'closed', inProgress, urgent, category,
//   source: 'manager' | 'phone' | 'whatsapp' | 'email' | 'verbal' | null, reportedBy, followUpOf,
//   author, createdAt (ISO), closedAt, lastActivityAt, expense, messages[] }
// message: { id, kind: 'message' | 'event' | 'internal', author, isManager, text, at, editedAt }
// ==========================================================================
import { nowISO } from './ledger';

export const MANAGER_NAME = 'מנהל החברה';
const LEGACY_MANAGER = ['מנהל החברה', 'מנהל מערכת'];

export const ISSUE_SOURCES = {
  manager: 'פנייה יזומה של המנהל',
  phone: 'שיחת טלפון',
  whatsapp: 'ווצאפ',
  email: 'מייל',
  verbal: 'בעל פה'
};

export const DEFAULT_ISSUE_CATEGORIES = ['מעלית', 'חשמל', 'אינסטלציה', 'ניקיון', 'כספים', 'אחר'];
export const EDIT_WINDOW_MINUTES = 15;

const uid = (p) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// תאריך ישן בפורמט חופשי ("2026-09-25 14:30" / "25.9.2026, 14:30") → ISO, כשאפשר
function toISO(text) {
  const s = String(text || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${(m[4] || '12').padStart(2, '0')}:${m[5] || '00'}:00.000Z`;
  m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})(?:,?\s*(\d{1,2}):(\d{2}))?/);
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T${(m[4] || '12').padStart(2, '0')}:${m[5] || '00'}:00.000Z`;
  }
  return null;
}

// מעבר מהמבנה הישן (comments, createdAt חופשי, בלי מספר)
export function migrateIssue(iss) {
  if (Array.isArray(iss.messages)) return iss;
  const createdAt = toISO(iss.createdAt) || nowISO();
  const messages = (iss.comments || []).map((c, i) => ({
    id: c.id || `m-${iss.id}-${i}`,
    kind: 'message',
    author: c.author,
    isManager: LEGACY_MANAGER.includes(c.author),
    text: c.text || c.content || '',
    at: toISO(c.time || c.createdAt) || createdAt
  }));
  const { comments: _c, ...rest } = iss;
  return {
    ...rest,
    number: iss.number || null,
    inProgress: false,
    urgent: false,
    category: iss.category || '',
    source: null,
    reportedBy: '',
    followUpOf: null,
    createdAt,
    closedAt: iss.status === 'closed' ? (messages[messages.length - 1]?.at || createdAt) : null,
    lastActivityAt: messages[messages.length - 1]?.at || createdAt,
    messages
  };
}

// מספור רץ לכל המערכת: פניות בלי מספר מקבלות לפי סדר הפתיחה
export function numberIssues(buildings) {
  const all = buildings.flatMap(b => (b.issues || []).map(i => ({ b: b.id, i })));
  let max = all.reduce((m, x) => Math.max(m, x.i.number || 0), 0);
  const missing = all.filter(x => !x.i.number).sort((a, b) => a.i.createdAt.localeCompare(b.i.createdAt));
  if (!missing.length) return buildings;
  const assigned = {};
  missing.forEach(x => { assigned[`${x.b}:${x.i.id}`] = ++max; });
  return buildings.map(b => ({ ...b, issues: (b.issues || []).map(i => (i.number ? i : { ...i, number: assigned[`${b.id}:${i.id}`] })) }));
}

export function nextIssueNumber(buildings) {
  return buildings.reduce((m, b) => Math.max(m, ...(b.issues || []).map(i => i.number || 0)), 0) + 1;
}

// הודעה אחרונה שהנציגים רואים (לא אירוע, לא הערה פנימית)
export function lastPublicMessage(issue) {
  return [...(issue.messages || [])].reverse().find(m => m.kind === 'message') || null;
}

// ממתינה לתשובת המנהל: ההודעה האחרונה של נציג/דייר
export function awaitingManager(issue) {
  if (issue.status !== 'open') return false;
  const last = lastPublicMessage(issue);
  return !!last && !last.isManager;
}

export function waitingDays(issue, now = new Date()) {
  const last = lastPublicMessage(issue);
  if (!last?.at) return 0;
  return Math.floor((now.getTime() - new Date(last.at).getTime()) / 86400000);
}

// מיון: דחופות, ממתינות לתשובה (הוותיקות קודם), ואז לפי פעילות אחרונה
export function sortIssues(list) {
  return [...list].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1;
    if (a.status === 'closed') return (b.closedAt || '').localeCompare(a.closedAt || '');
    if (!!a.urgent !== !!b.urgent) return a.urgent ? -1 : 1;
    const wa = awaitingManager(a), wb = awaitingManager(b);
    if (wa !== wb) return wa ? -1 : 1;
    if (wa) return (lastPublicMessage(a)?.at || '').localeCompare(lastPublicMessage(b)?.at || '');
    return (b.lastActivityAt || '').localeCompare(a.lastActivityAt || '');
  });
}

export function canEdit(message, now = new Date()) {
  if (message.kind === 'event' || !message.isManager) return false;
  return now.getTime() - new Date(message.at).getTime() <= EDIT_WINDOW_MINUTES * 60000;
}

// ------------------------------------------------------------------------
// פעולות (טהורות: בניין → בניין)
// ------------------------------------------------------------------------
const touch = (issue, at) => ({ ...issue, lastActivityAt: at });
const event = (text, at) => ({ id: uid('ev'), kind: 'event', author: MANAGER_NAME, isManager: true, text, at });

function mapIssue(b, id, fn) {
  return { ...b, issues: (b.issues || []).map(i => (i.id === id ? fn(i) : i)) };
}

export function createIssue(b, { number, title, body, author, isManager = false, urgent = false, category = '', source = null, reportedBy = '', followUpOf = null }) {
  const at = nowISO();
  const issue = {
    id: uid('iss'),
    number,
    title: title.trim(),
    status: 'open',
    inProgress: false,
    urgent: !!urgent,
    category,
    source,
    reportedBy: reportedBy.trim(),
    followUpOf,
    author,
    createdAt: at,
    closedAt: null,
    lastActivityAt: at,
    messages: [{ id: uid('m'), kind: 'message', author, isManager, text: body.trim(), at }]
  };
  return { ...b, issues: [issue, ...(b.issues || [])] };
}

export function addMessage(b, issueId, { author = MANAGER_NAME, isManager = true, text, internal = false }) {
  const at = nowISO();
  return mapIssue(b, issueId, i => (i.status !== 'open' ? i : touch({
    ...i,
    messages: [...(i.messages || []), { id: uid('m'), kind: internal ? 'internal' : 'message', author, isManager, text: text.trim(), at }]
  }, at)));
}

export function editMessage(b, issueId, messageId, text) {
  return mapIssue(b, issueId, i => ({
    ...i,
    messages: (i.messages || []).map(m => (m.id === messageId && canEdit(m) ? { ...m, text: text.trim(), editedAt: nowISO() } : m))
  }));
}

export function closeIssue(b, issueId, summary = '') {
  const at = nowISO();
  return mapIssue(b, issueId, i => {
    const msgs = [...(i.messages || [])];
    if (summary.trim()) msgs.push({ id: uid('m'), kind: 'message', author: MANAGER_NAME, isManager: true, text: summary.trim(), at });
    msgs.push(event('המנהל סגר את הפנייה', at));
    return touch({ ...i, status: 'closed', closedAt: at, inProgress: false, messages: msgs }, at);
  });
}

export function reopenIssue(b, issueId) {
  const at = nowISO();
  return mapIssue(b, issueId, i => touch({ ...i, status: 'open', closedAt: null, messages: [...(i.messages || []), event('המנהל פתח מחדש את הפנייה', at)] }, at));
}

export function setInProgress(b, issueId, value) {
  const at = nowISO();
  return mapIssue(b, issueId, i => touch({
    ...i,
    inProgress: !!value,
    messages: [...(i.messages || []), event(value ? 'המנהל סימן את הפנייה "בטיפול"' : 'הסימון "בטיפול" הוסר', at)]
  }, at));
}

export function setIssueFields(b, issueId, fields) {
  return mapIssue(b, issueId, i => ({ ...i, ...fields }));
}

// רישום הוצאה מתוך פנייה (סעיף 7.9) — נרשם כהערה פנימית בשרשור
export function linkExpense(b, issueId, { method, amount, txId = null }) {
  const at = nowISO();
  const text = method === 'cash'
    ? `נרשמה הוצאה במזומן של ${Number(amount).toLocaleString('he-IL')} ₪ (מופיעה בכספים)`
    : `שולם בהעברה בנקאית${amount ? ` (${Number(amount).toLocaleString('he-IL')} ₪)` : ''} — יופיע בדו״ח העו״ש`;
  return mapIssue(b, issueId, i => touch({
    ...i,
    expense: { method, amount: Number(amount) || null, txId, at },
    messages: [...(i.messages || []), { id: uid('m'), kind: 'internal', author: MANAGER_NAME, isManager: true, text, at }]
  }, at));
}
