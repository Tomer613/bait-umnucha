// ==========================================================================
// בית ומנוחה - זיהוי משימות: מה דורש טיפול עכשיו
// משמש את מסך "משימות" ואת המונה בטאב שלו.
// ==========================================================================
import { aptDebt, monthName, formatILS } from './format';
import { isMonthClosed, missingSteps } from './monthClose';

export const DEFAULT_LOW_BALANCE = 7000;
export const DEFAULT_CHRONIC_MONTHS = 3;
const MANAGER_AUTHORS = ['מנהל החברה', 'מנהל מערכת'];

export function computeTasks(scope, { currentMonth, lowBalance = DEFAULT_LOW_BALANCE, chronicMonths = DEFAULT_CHRONIC_MONTHS } = {}) {
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

  // 3. פניות שמחכות למענה ההנהלה (התגובה האחרונה אינה של ההנהלה)
  const awaiting = scope.flatMap(b => (b.issues || [])
    .filter(i => i.status === 'open')
    .filter(i => {
      const last = (i.comments || [])[i.comments.length - 1];
      return !last || !MANAGER_AUTHORS.includes(last.author);
    })
    .map(i => ({ b, i })));
  if (awaiting.length) {
    tasks.push({
      id: 'issues',
      tone: 'violet',
      title: awaiting.length === 1 ? 'פנייה אחת מחכה לתשובה שלך' : `${awaiting.length} פניות מחכות לתשובה שלך`,
      text: 'התגובה האחרונה בהן היא של הדיירים או הנציגים.',
      items: awaiting.map(({ b, i }) => ({
        key: `${b.id}-${i.id}`,
        building: b,
        detail: `${i.title} · ${i.author}`,
        action: 'issue'
      }))
    });
  }

  // 4. גבייה מיוחדת שנתקעה (פחות מחצי מהיעד)
  const stuck = scope.flatMap(b => (b.specialLevies || [])
    .map(l => ({ b, l, collected: (l.paidApartmentIds?.length || 0) * (l.amountPerApt || 0) }))
    .filter(x => x.l.totalAmount > 0 && x.collected / x.l.totalAmount < 0.5));
  if (stuck.length) {
    tasks.push({
      id: 'levies',
      tone: 'sky',
      title: stuck.length === 1 ? 'גבייה מיוחדת אחת תקועה מתחת לחצי מהיעד' : `${stuck.length} גביות מיוחדות תקועות מתחת לחצי מהיעד`,
      text: 'כדאי לבדוק מי עוד לא שילם את חלקו.',
      items: stuck.map(({ b, l, collected }) => ({
        key: `${b.id}-${l.id}`,
        building: b,
        detail: `${l.title} · נגבו ${formatILS(collected)} מתוך ${formatILS(l.totalAmount)}`,
        action: 'levy'
      }))
    });
  }

  // 5. יתרה נמוכה בקופה
  const low = scope.filter(b => (b.currentBalance || 0) < lowBalance).sort((a, b) => (a.currentBalance || 0) - (b.currentBalance || 0));
  if (low.length) {
    tasks.push({
      id: 'balance',
      tone: 'petrol',
      title: low.length === 1 ? `בניין אחד עם יתרה מתחת ל-${formatILS(lowBalance)}` : `${low.length} בניינים עם יתרה מתחת ל-${formatILS(lowBalance)}`,
      text: 'כדאי לוודא שיש כיסוי להוצאות הקבועות של החודש הבא.',
      items: low.map(b => ({ key: b.id, building: b, detail: `יתרה: ${formatILS(b.currentBalance)}`, action: 'finance' }))
    });
  }

  return tasks;
}

export function countTaskItems(tasks) {
  return tasks.reduce((sum, t) => sum + t.items.length, 0);
}
