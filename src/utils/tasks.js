// ==========================================================================
// בית ומנוחה - זיהוי משימות: מה דורש טיפול עכשיו
// משמש את מסך "משימות" ואת המונה בטאב שלו.
// ==========================================================================
import { aptDebt, monthName, formatILS } from './format';
import { isMonthClosed, missingSteps } from './monthClose';
import { buildingBalance } from './ledger';
import { levyTotals } from './levies';
import { planTotals, counterpartyText } from './paymentPlans';
import { formatDateIL } from './ledger';
import { awaitingManager, waitingDays } from './issues';

export const DEFAULT_LOW_BALANCE = 7000;
export const DEFAULT_CHRONIC_MONTHS = 3;

export function computeTasks(scope, { currentMonth, lowBalance = DEFAULT_LOW_BALANCE, chronicMonths = DEFAULT_CHRONIC_MONTHS, reminderDays = 3 } = {}) {
  const tasks = [];
  const month = monthName(currentMonth);

  // 1. חודש שעוד לא נסגר
  const pending = scope.filter(b => !isMonthClosed(b, currentMonth));
  if (pending.length) {
    tasks.push({
      id: 'intake',
      tone: 'gold',
      title: pending.length === 1 ? `בניין אחד עוד לא סגר את חודש ${month}` : `${pending.length} בניינים עוד לא סגרו את חודש ${month}`,
      text: 'עו״ש בנק, חיובית, הכנסות והוצאות במזומן — רק כשכולם מסומנים, נתוני החודש סופיים.',
      progress: scope.length > 1 ? { done: scope.length - pending.length, total: scope.length } : null,
      items: pending.map(b => ({
        key: b.id,
        building: b,
        detail: `חסר: ${missingSteps(b, currentMonth).map(s => s.short).join(', ')}`,
        action: 'intake'
      }))
    });
  }

  // 2. חובות מתמשכים
  const chronic = scope.flatMap(b => (b.apartments || [])
    .filter(a => (a.debtMonths?.length || 0) >= chronicMonths)
    .map(a => ({ b, a })))
    .sort((x, y) => aptDebt(y.a) - aptDebt(x.a));
  if (chronic.length) {
    tasks.push({
      id: 'debts',
      tone: 'coral',
      title: chronic.length === 1 ? `דירה אחת בחוב של ${chronicMonths} חודשים ומעלה` : `${chronic.length} דירות בחוב של ${chronicMonths} חודשים ומעלה`,
      text: 'זה הזמן למכתב התראה לפני שהחוב ממשיך לגדול.',
      items: chronic.map(({ b, a }) => ({
        key: `${b.id}-${a.id}`,
        building: b,
        detail: `דירה ${a.aptNum} · ${a.tenantName} · ${a.debtMonths.length} חודשים · ${formatILS(aptDebt(a))}`,
        action: 'letter'
      }))
    });
  }

  // 3. פניות שמחכות למענה ההנהלה (ההודעה האחרונה של נציג/דייר). דחופה — מודגשת.
  const awaiting = scope.flatMap(b => (b.issues || [])
    .filter(awaitingManager)
    .map(i => ({ b, i, days: waitingDays(i) })))
    .sort((x, y) => (y.i.urgent ? 1 : 0) - (x.i.urgent ? 1 : 0) || y.days - x.days);
  if (awaiting.length) {
    const overdue = reminderDays ? awaiting.filter(x => x.days >= (x.i.urgent ? 1 : reminderDays)).length : 0;
    tasks.push({
      id: 'issues',
      tone: 'violet',
      title: awaiting.length === 1 ? 'פנייה אחת מחכה לתשובה שלך' : `${awaiting.length} פניות מחכות לתשובה שלך`,
      text: overdue ? `${overdue} מהן ממתינות יותר מדי זמן (דחופה: יום, רגילה: ${reminderDays} ימים).` : 'ההודעה האחרונה בהן היא של הדיירים או הנציגים.',
      items: awaiting.map(({ b, i, days }) => ({
        key: `${b.id}-${i.id}`,
        building: b,
        detail: `${i.urgent ? '🔴 דחופה · ' : ''}#${i.number} ${i.title}${days ? ` · ממתינה ${days === 1 ? 'יום' : `${days} ימים`}` : ''}`,
        action: 'issue'
      }))
    });
  }

  // 3א. חיובי חיובית שממתינים לשיוך (אפיון 05)
  const pendingCharges = scope.map(b => ({ b, count: (b.importBatches || []).reduce((s, bt) => s + (bt.pending?.length || 0), 0) })).filter(x => x.count > 0);
  if (pendingCharges.length) {
    tasks.push({
      id: 'pending-charges',
      tone: 'gold',
      title: pendingCharges.length === 1 ? `${pendingCharges[0].count} חיובים מחיובית ממתינים לשיוך` : `חיובים מחיובית ממתינים לשיוך ב-${pendingCharges.length} בניינים`,
      text: 'חיובים שלא תאמו לדמי הוועד או לגבייה קיימת. משייכים אותם במסך הגביות המיוחדות.',
      items: pendingCharges.map(({ b, count }) => ({ key: `${b.id}-pending`, building: b, detail: `${count} חיובים`, action: 'levy' }))
    });
  }

  // 3ב. פריסות חוב: תשלום שעבר מועדו (אפיון 07, סעיף 6)
  const today = new Date().toISOString().slice(0, 10);
  const late = scope.flatMap(b => (b.paymentPlans || []).filter(p => p.status === 'active')
    .flatMap(p => planTotals(p, today).late.map(i => ({ b, p, i }))));
  if (late.length) {
    tasks.push({
      id: 'plans-late',
      tone: 'coral',
      title: late.length === 1 ? 'תשלום אחד בפריסת חוב עבר את המועד' : `${late.length} תשלומים בפריסות חוב עברו את המועד`,
      text: 'צ׳ק שעוד לא נפרע, או דייר שלא שילם תשלום בהסדר.',
      items: late.map(({ b, p, i }) => ({
        key: `${b.id}-${p.id}-${i.n}`,
        building: b,
        detail: p.direction === 'payable'
          ? `${counterpartyText(p, b)}${i.checkNumber ? ` · צ׳ק ${i.checkNumber}` : ''} · ${formatILS(i.amount)} · ${formatDateIL(i.dueDate)} — עדיין לא נפרע`
          : `${counterpartyText(p, b)} · תשלום ${i.n} בהסדר · ${formatILS(i.amount)} · ${formatDateIL(i.dueDate)} — לא התקבל`,
        action: 'plans'
      }))
    });
  }

  // 4. גבייה מיוחדת שנתקעה (פחות מחצי מהיעד שכבר הגיע מועדו)
  const stuck = scope.flatMap(b => (b.specialLevies || [])
    .filter(l => l.status === 'active')
    .map(l => ({ b, l, ...levyTotals(l, b, currentMonth) }))
    .filter(x => x.target > 0 && x.collected / x.target < 0.5));
  if (stuck.length) {
    tasks.push({
      id: 'levies',
      tone: 'sky',
      title: stuck.length === 1 ? 'גבייה מיוחדת אחת תקועה מתחת לחצי מהיעד' : `${stuck.length} גביות מיוחדות תקועות מתחת לחצי מהיעד`,
      text: 'כדאי לבדוק מי עוד לא שילם את חלקו.',
      items: stuck.map(({ b, l, collected, target }) => ({
        key: `${b.id}-${l.id}`,
        building: b,
        detail: `${l.name} · נגבו ${formatILS(collected)} מתוך ${formatILS(target)}`,
        action: 'levy'
      }))
    });
  }

  // 5. יתרה נמוכה בקופה
  const low = scope.filter(b => buildingBalance(b) < lowBalance).sort((a, b) => buildingBalance(a) - buildingBalance(b));
  if (low.length) {
    tasks.push({
      id: 'balance',
      tone: 'petrol',
      title: low.length === 1 ? `בניין אחד עם יתרה מתחת ל-${formatILS(lowBalance)}` : `${low.length} בניינים עם יתרה מתחת ל-${formatILS(lowBalance)}`,
      text: 'כדאי לוודא שיש כיסוי להוצאות הקבועות של החודש הבא.',
      items: low.map(b => ({ key: b.id, building: b, detail: `יתרה: ${formatILS(buildingBalance(b))}`, action: 'finance' }))
    });
  }

  return tasks;
}

export function countTaskItems(tasks) {
  return tasks.reduce((sum, t) => sum + t.items.length, 0);
}
