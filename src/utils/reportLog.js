// ==========================================================================
// בית ומנוחה - דוחות על חודשים פתוחים ומעקב אחרי דוחות שנשלחו (אפיון 04, סעיפים 6.5–6.6)
// ==========================================================================
import { activeTransactions, buildingBalance, round2 } from './ledger';
import { buildingDebt, formatMonth } from './format';
import { isMonthClosed } from './monthClose';

export const CHANNEL_LABELS = { print: 'הדפסה', excel: 'אקסל', whatsapp: 'וואטסאפ' };
export const REPORT_LABELS = { expenses: 'דוח הוצאות שנתי', debts: 'דוח תקבולים וחובות' };

// החודשים שהדוח מכסה: בדוח שנתי — חודשי השנה עד החודש הנוכחי; בדוח חובות — החודש הנוכחי
export function reportMonths(type, { year, currentMonth }) {
  if (type === 'debts') return [currentMonth];
  const last = year === currentMonth.slice(0, 4) ? parseInt(currentMonth.slice(5, 7), 10) : 12;
  return Array.from({ length: last }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
}

// חודשים פתוחים שיש בהם פעילות (או החודש הנוכחי) — הם שהופכים דוח לטיוטה
export function openMonthsIn(building, months, currentMonth) {
  const active = new Set(activeTransactions(building).map(tx => tx.month));
  return months.filter(m => (active.has(m) || m === currentMonth) && !isMonthClosed(building, m));
}

function monthTotals(building, month) {
  const txs = activeTransactions(building).filter(tx => tx.month === month);
  return {
    income: round2(txs.filter(tx => tx.direction === 'in').reduce((s, tx) => s + tx.amount, 0)),
    expenses: round2(txs.filter(tx => tx.direction === 'out').reduce((s, tx) => s + tx.amount, 0))
  };
}

// רשומת יומן לדוח שהופק: הסכומים העיקריים, ופירוט לכל חודש **סגור** שבדוח —
// כדי לזהות בהמשך שינוי בחודש שנסגר אחרי שהדוח נשלח
export function reportLogEntry(building, type, { year, currentMonth, channel }) {
  const months = reportMonths(type, { year, currentMonth });
  const closed = {};
  months.filter(m => isMonthClosed(building, m)).forEach(m => { closed[m] = monthTotals(building, m); });
  return {
    type,
    channel,
    period: type === 'debts' ? currentMonth : year,
    draft: openMonthsIn(building, months, currentMonth).length > 0,
    totals: { balance: buildingBalance(building), debts: round2(buildingDebt(building)) },
    closedMonths: closed
  };
}

// דוחות שנשלחו, שמאז השתנה בהם חודש שהיה סגור (רק ההפקה האחרונה לכל דוח ותקופה)
export function staleReports(building) {
  const latest = {};
  (building?.reportLog || []).forEach(r => {
    const key = `${r.type}|${r.period}`;
    if (!latest[key]) latest[key] = r;
  });
  return Object.values(latest).map(r => {
    const changes = [];
    Object.entries(r.closedMonths || {}).forEach(([m, was]) => {
      const now = monthTotals(building, m);
      const dIn = round2(now.income - was.income);
      const dOut = round2(now.expenses - was.expenses);
      if (dIn || dOut) changes.push({ month: m, label: formatMonth(m), income: dIn, expenses: dOut });
    });
    return { report: r, changes };
  }).filter(x => x.changes.length > 0);
}
