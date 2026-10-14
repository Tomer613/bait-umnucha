// ==========================================================================
// בית ומנוחה - חישובים ועיצוב נתונים משותפים לכל המסכים
// ==========================================================================

export const HEBREW_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

// 12,345 ₪
export function formatILS(amount) {
  return `${Math.round(amount || 0).toLocaleString('he-IL')} ₪`;
}

// '2026-09' → 'ספטמבר 2026'
export function formatMonth(monthKey) {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const name = HEBREW_MONTHS[parseInt(month, 10) - 1];
  return name ? `${name} ${year}` : monthKey;
}

// '2026-09' → 'ספטמבר'
export function monthName(monthKey) {
  if (!monthKey) return '';
  return HEBREW_MONTHS[parseInt(monthKey.split('-')[1], 10) - 1] || monthKey;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// --- חובות ---
export function aptDebt(apt) {
  return (apt?.debtMonths?.length || 0) * (apt?.monthlyDues || 0);
}

export function hasDebt(apt) {
  return (apt?.debtMonths?.length || 0) > 0;
}

export function buildingDebt(building) {
  return (building?.apartments || []).reduce((sum, apt) => sum + aptDebt(apt), 0);
}

export function buildingDebtorsCount(building) {
  return (building?.apartments || []).filter(hasDebt).length;
}

export function buildingExpectedMonthly(building) {
  return (building?.apartments || []).reduce((sum, apt) => sum + (apt.monthlyDues || 0), 0);
}

export function openIssuesCount(building) {
  return (building?.issues || []).filter(i => i.status === 'open').length;
}

// סכימה על פני רשימת בניינים
export function sumBy(buildings, fn) {
  return (buildings || []).reduce((sum, b) => sum + (fn(b) || 0), 0);
}

// תנועות: סכום חיובי = הוצאה, סכום שלילי = הכנסה
export function splitInOut(transactions) {
  let income = 0;
  let expenses = 0;
  (transactions || []).forEach(tx => {
    if (tx.amount < 0) income += Math.abs(tx.amount);
    else expenses += tx.amount;
  });
  return { income, expenses };
}

// הוספת פרטי בניין לכל פריט ברשימה (לתצוגות "כלל הבניינים")
export function withBuilding(building, items) {
  return (items || []).map(item => ({
    ...item,
    buildingId: building.id,
    buildingName: building.name,
    buildingColor: building.color
  }));
}

// פתיחת בורר הבניין העליון ("עובדים על") עם הודעה — לפעולות שדורשות בניין מסוים
export function requestBuildingPick(message = 'בחרו בניין כדי להמשיך') {
  window.dispatchEvent(new CustomEvent('bpicker:open', { detail: { message } }));
}
