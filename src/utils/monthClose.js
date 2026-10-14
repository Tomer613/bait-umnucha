// ==========================================================================
// בית ומנוחה - סגירת חודש
// צ'קליסט של 4 שלבים לכל בניין בכל חודש. כשכל השלבים מסומנים — החודש סגור.
// מבנה הנתונים: building.monthClose[month] = { bank: {done, auto, note, at}, hiyuvit: {...}, receipts: {...}, expenses: {...} }
// ==========================================================================

export const CLOSE_STEPS = [
  { id: 'bank', label: 'דו״ח עו״ש בנק', short: 'עו״ש בנק', manualLabel: 'אין תנועות בבנק החודש' },
  { id: 'hiyuvit', label: 'דו״ח חיובית', short: 'חיובית', manualLabel: 'אין גבייה בחיובית החודש' },
  { id: 'receipts', label: 'הכנסות במזומן', short: 'הכנסות מזומן', manualLabel: 'הזנתי את כל ההכנסות' },
  { id: 'expenses', label: 'הוצאות במזומן', short: 'הוצאות מזומן', manualLabel: 'הזנתי את כל ההוצאות' }
];

export function getMonthClose(building, month) {
  return building?.monthClose?.[month] || {};
}

// המרה חד-פעמית: בניין שסומן "מעודכן" במערכת הקודמת — החודש הנוכחי שלו נחשב סגור
export function migrateMonthClose(building, month) {
  if (building.monthClose || !building.statusMonthUpdated) return building;
  const done = { done: true, auto: false, note: 'סומן לפני המעבר לסגירת חודש' };
  const { statusMonthUpdated: _legacy, ...rest } = building;
  return { ...rest, monthClose: { [month]: { bank: done, hiyuvit: done, receipts: done, expenses: done } } };
}

export function doneSteps(building, month) {
  const rec = getMonthClose(building, month);
  return CLOSE_STEPS.filter(s => rec[s.id]?.done);
}

export function missingSteps(building, month) {
  const rec = getMonthClose(building, month);
  return CLOSE_STEPS.filter(s => !rec[s.id]?.done);
}

export function isMonthClosed(building, month) {
  return missingSteps(building, month).length === 0;
}

// "פתוח" / "בתהליך" / "סגור"
export function closeStatus(building, month) {
  const done = doneSteps(building, month).length;
  if (done === CLOSE_STEPS.length) return { id: 'closed', label: 'חודש סגור', done };
  if (done === 0) return { id: 'open', label: 'ממתין לסגירת חודש', done };
  return { id: 'progress', label: `בתהליך סגירה (${done}/${CLOSE_STEPS.length})`, done };
}
