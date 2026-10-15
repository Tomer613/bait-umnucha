// ==========================================================================
// בית ומנוחה - סיווג חיובים בקובץ חיובית (אפיון 05, סעיף 4)
// 1. סכום = דמי הוועד של היחידה → דמי ועד
// 2. סכום = הסכום של גבייה מיוחדת פעילה שהיחידה משתתפת בה → הגבייה
// 3. סכום שחוזר אצל הרבה יחידות (מעל הסף), בלי גבייה מתאימה → חשד לגבייה מיוחדת חדשה
// 4. כל השאר → דורש שיוך (מקובץ לפי סכום)
// היחידה מזוהה לפי "מספר לקוח בחיובית"; לקוח בלי שיוך — המנהל משייך בתצוגה המקדימה.
// ==========================================================================
import { monthOfDate, round2 } from './ledger';
import { activeLeviesForMonth, amountFor } from './levies';
import { unitLabel } from './units';

const words = (s) => String(s || '').replace(/["'״׳.,\-()]/g, ' ').split(/\s+/).filter(w => w.length >= 2);

// הצעת יחידה ללקוח לפי דמיון שמות (מילה משותפת)
export function suggestUnit(building, clientName) {
  const cw = new Set(words(clientName));
  let best = null;
  let bestScore = 0;
  (building?.apartments || []).forEach(u => {
    const score = words(`${u.tenantName || ''} ${u.businessName || ''}`).filter(w => cw.has(w)).length;
    if (score > bestScore) { best = u; bestScore = score; }
  });
  return best?.id || '';
}

// לקוחות בקובץ ושיוך ליחידות: קיים (לפי מספר לקוח) + עקיפות מהתצוגה המקדימה
export function clientsOf(building, rows, overrides = {}) {
  const byNumber = {};
  (building?.apartments || []).forEach(u => { if (u.hiyuvitClientNumber) byNumber[u.hiyuvitClientNumber] = u.id; });
  const clients = {};
  rows.filter(r => !r.isReturnFee).forEach(r => {
    const k = r.clientNumber || r.name;
    if (!clients[k]) {
      clients[k] = {
        clientNumber: r.clientNumber,
        name: r.name,
        savedUnitId: byNumber[r.clientNumber] || '',
        suggestedUnitId: byNumber[r.clientNumber] ? '' : suggestUnit(building, r.name)
      };
    }
  });
  Object.values(clients).forEach(c => {
    const key = c.clientNumber || c.name;
    c.unitId = overrides[key] !== undefined ? overrides[key] : (c.savedUnitId || c.suggestedUnitId);
  });
  return clients;
}

export function classifyHiyuvit(building, rows, { overrides = {}, threshold = 0.3 } = {}) {
  const clients = clientsOf(building, rows, overrides);
  const units = Object.fromEntries((building?.apartments || []).map(u => [u.id, u]));
  const charged = rows.filter(r => r.isSuccess || r.isFailed);
  const totalClients = new Set(charged.map(r => r.clientNumber || r.name)).size || 1;

  const items = charged.map(r => {
    const client = clients[r.clientNumber || r.name];
    const unit = units[client?.unitId] || null;
    const amount = r.isSuccess ? r.amount : r.failedAmount;
    const month = monthOfDate(r.date);
    const base = { row: r, unitId: unit?.id || '', amount: round2(amount), month, status: r.isSuccess ? 'paid' : 'failed', clientKey: r.clientNumber || r.name };
    if (!unit) return { ...base, kind: 'unmapped' };
    if (round2(unit.monthlyDues) === round2(amount)) return { ...base, kind: 'dues' };
    const levy = activeLeviesForMonth(building, month).find(l => (l.participantIds || []).includes(unit.id) && round2(amountFor(l, unit)) === round2(amount));
    if (levy) return { ...base, kind: 'levy', levyId: levy.id };
    return { ...base, kind: 'other' };
  });

  // קיבוץ הסכומים שלא סווגו: מעל הסף — חשד לגבייה חדשה; מתחת — דורשים שיוך
  const groups = {};
  items.filter(i => i.kind === 'other' || i.kind === 'unmapped').forEach(i => {
    const key = `${i.amount}`;
    if (!groups[key]) groups[key] = { key, amount: i.amount, items: [] };
    groups[key].items.push(i);
  });
  const groupList = Object.values(groups).map(g => {
    const clientCount = new Set(g.items.map(i => i.clientKey)).size;
    const months = Array.from(new Set(g.items.map(i => i.month))).sort();
    const suspected = g.items.every(i => i.kind === 'other') && clientCount / totalClients >= threshold;
    return { ...g, clientCount, months, suspected, share: clientCount / totalClients };
  }).sort((a, b) => b.clientCount - a.clientCount);

  return {
    clients: Object.values(clients),
    items,
    totalClients,
    dues: items.filter(i => i.kind === 'dues'),
    levyItems: items.filter(i => i.kind === 'levy'),
    suspectedGroups: groupList.filter(g => g.suspected),
    otherGroups: groupList.filter(g => !g.suspected)
  };
}

// תיאור קצר של יחידות בקבוצה ("דירה 4, דירה 9 ועוד 3")
export function groupUnitsText(building, group) {
  const units = Object.fromEntries((building?.apartments || []).map(u => [u.id, u]));
  const labels = Array.from(new Set(group.items.map(i => (units[i.unitId] ? unitLabel(units[i.unitId]) : i.row.name))));
  return labels.length > 3 ? `${labels.slice(0, 3).join(', ')} ועוד ${labels.length - 3}` : labels.join(', ');
}
