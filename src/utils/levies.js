// ==========================================================================
// בית ומנוחה - גביות מיוחדות (אפיון 05)
// גבייה חד-פעמית או בפריסה לתשלומים חודשיים, עם צ'קליסט יחידות משתתפות
// ומעקב תשלום לכל יחידה × חודש.
//
// levy: { id, name, purpose, mode: 'one_time' | 'monthly', amountPerApt (בפריסה: לחודש),
//   installments (null = ללא הגבלה), startMonth, participantIds[], includesCommercial,
//   amountPerCommercialUnit, status: 'active' | 'completed' | 'cancelled', origin: 'manual' | 'auto_detected',
//   createdAt, payments: { [unitId]: { [month]: { status: 'paid' | 'failed', source, at } } } }
// ==========================================================================
import { round2, nowISO } from './ledger';
import { isCommercial, residentialUnits } from './units';

export const LEVY_STATUS = { active: 'פעילה', completed: 'הושלמה', cancelled: 'בוטלה' };

export function addMonths(month, k) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + k, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// מעבר מהמבנה הישן (title, totalAmount, amountPerApt, paidApartmentIds)
export function migrateLevy(l, building) {
  if (l.mode) return l;
  const startMonth = (l.createdAt || '').slice(0, 7);
  const payments = {};
  (l.paidApartmentIds || []).forEach(id => { payments[id] = { [startMonth]: { status: 'paid', source: 'manual' } }; });
  return {
    id: l.id,
    name: l.title || 'גבייה מיוחדת',
    purpose: l.purpose || '',
    mode: 'one_time',
    amountPerApt: l.amountPerApt || 0,
    installments: 1,
    startMonth,
    participantIds: residentialUnits(building).map(u => u.id),
    includesCommercial: false,
    amountPerCommercialUnit: null,
    status: 'active',
    origin: 'manual',
    createdAt: l.createdAt || '',
    payments
  };
}

// החודשים שבהם הגבייה נגבית (בפריסה פתוחה — עד החודש הנוכחי)
export function levyMonths(levy, currentMonth) {
  if (!levy.startMonth) return [];
  if (levy.mode !== 'monthly') return [levy.startMonth];
  const n = levy.installments || 0;
  if (n > 0) return Array.from({ length: n }, (_, i) => addMonths(levy.startMonth, i));
  const out = [];
  for (let m = levy.startMonth; m <= currentMonth && out.length < 120; m = addMonths(m, 1)) out.push(m);
  return out;
}

export function amountFor(levy, unit) {
  if (isCommercial(unit) && levy.amountPerCommercialUnit) return levy.amountPerCommercialUnit;
  return levy.amountPerApt || 0;
}

export function participants(levy, building) {
  const ids = new Set(levy.participantIds || []);
  return (building?.apartments || []).filter(u => ids.has(u.id));
}

export function paymentOf(levy, unitId, month) {
  return levy.payments?.[unitId]?.[month] || null;
}

// יעד, נגבה ואחוז
export function levyTotals(levy, building, currentMonth) {
  const months = levyMonths(levy, currentMonth);
  const units = participants(levy, building);
  let target = 0;
  let collected = 0;
  units.forEach(u => {
    const amt = amountFor(levy, u);
    target += amt * months.length;
    months.forEach(m => { if (paymentOf(levy, u.id, m)?.status === 'paid') collected += amt; });
  });
  return { target: round2(target), collected: round2(collected), percent: target ? Math.round((collected / target) * 100) : 0, months, units };
}

// כמה כל יחידה שילמה וכמה היא חייבת (רק חודשים שכבר הגיעו)
export function unitBalance(levy, unit, currentMonth) {
  const due = levyMonths(levy, currentMonth).filter(m => m <= currentMonth);
  const amt = amountFor(levy, unit);
  const paid = due.filter(m => paymentOf(levy, unit.id, m)?.status === 'paid').length * amt;
  return { paid: round2(paid), owed: round2(due.length * amt - paid) };
}

// גבייה פעילה בחודש מסוים, שהסכום החודשי שלה תואם (לסיווג חיובים)
export function activeLeviesForMonth(building, month) {
  return (building?.specialLevies || []).filter(l => l.status === 'active' && levyMonths(l, month).includes(month));
}

// ------------------------------------------------------------------------
// פעולות (טהורות: בניין → בניין)
// ------------------------------------------------------------------------
export function buildLevy(data) {
  return {
    id: data.id || `levy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: (data.name || '').trim(),
    purpose: (data.purpose || '').trim(),
    mode: data.mode === 'monthly' ? 'monthly' : 'one_time',
    amountPerApt: round2(parseFloat(data.amountPerApt) || 0),
    installments: data.mode === 'monthly' ? (parseInt(data.installments, 10) || null) : 1,
    startMonth: data.startMonth,
    participantIds: data.participantIds || [],
    includesCommercial: !!data.includesCommercial,
    amountPerCommercialUnit: data.amountPerCommercialUnit ? round2(parseFloat(data.amountPerCommercialUnit)) : null,
    status: data.status || 'active',
    origin: data.origin || 'manual',
    createdAt: data.createdAt || nowISO().slice(0, 10),
    payments: data.payments || {}
  };
}

export function addLevy(b, data) {
  return { ...b, specialLevies: [buildLevy(data), ...(b.specialLevies || [])] };
}

export function updateLevy(b, levyId, data) {
  return {
    ...b,
    specialLevies: (b.specialLevies || []).map(l => (l.id === levyId ? buildLevy({ ...l, ...data, id: l.id, payments: l.payments }) : l))
  };
}

export function setLevyStatus(b, levyId, status) {
  return { ...b, specialLevies: (b.specialLevies || []).map(l => (l.id === levyId ? { ...l, status } : l)) };
}

// status: 'paid' | 'failed' | null (ניקוי)
export function setLevyPayment(b, levyId, unitId, month, status, source = 'manual') {
  return {
    ...b,
    specialLevies: (b.specialLevies || []).map(l => {
      if (l.id !== levyId) return l;
      const unitPayments = { ...(l.payments?.[unitId] || {}) };
      if (status) unitPayments[month] = { status, source, at: nowISO() };
      else delete unitPayments[month];
      return { ...l, payments: { ...(l.payments || {}), [unitId]: unitPayments } };
    })
  };
}

// כל הקבוצות הממתינות בבניין: { batch, groupKey, amount, items }
export function pendingGroups(building) {
  const out = [];
  (building?.importBatches || []).forEach(bt => {
    const groups = {};
    (bt.pending || []).forEach(p => { (groups[p.groupKey] = groups[p.groupKey] || []).push(p); });
    Object.entries(groups).forEach(([groupKey, items]) => out.push({ batch: bt, groupKey, amount: items[0].amount, items }));
  });
  return out;
}

