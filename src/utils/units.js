// ==========================================================================
// בית ומנוחה - יחידות בבניין: דירות ויחידות מסחר (חנות / מחסן) — אפיון 06
// כל יחידה נשמרת ברשימת building.apartments; יחידת מסחר מסומנת ב-unitType.
// ==========================================================================

export const UNIT_TYPES = { residential: 'דירה', commercial: 'מסחר' };
export const COMMERCIAL_LABELS = { shop: 'חנות', storage: 'מחסן' };

export function isCommercial(unit) {
  return unit?.unitType === 'commercial';
}

// "דירה 12" / "חנות 2" / "מחסן 4"
export function unitLabel(unit) {
  if (!unit) return '';
  const num = String(unit.aptNum ?? '').trim();
  if (!isCommercial(unit)) return `דירה ${num}`;
  const label = COMMERCIAL_LABELS[unit.commercialLabel] || COMMERCIAL_LABELS.shop;
  return num.startsWith(label) ? num : `${label} ${num}`;
}

// שם להצגה: בעסק — שם העסק; בדירה — שם הדייר
export function unitDisplayName(unit) {
  if (!unit) return '';
  return (isCommercial(unit) && unit.businessName) || unit.tenantName || '';
}

export function residentialUnits(building) {
  return (building?.apartments || []).filter(u => !isCommercial(u));
}

export function commercialUnits(building) {
  return (building?.apartments || []).filter(isCommercial);
}

// "30 דירות, 5 מסחר (2 חנויות, 3 מחסנים)"
export function unitsSummary(units) {
  const res = units.filter(u => !isCommercial(u)).length;
  const com = units.filter(isCommercial);
  const shops = com.filter(u => u.commercialLabel !== 'storage').length;
  const storage = com.length - shops;
  let text = `${res} דירות`;
  if (com.length) {
    const parts = [shops && `${shops} ${shops === 1 ? 'חנות' : 'חנויות'}`, storage && `${storage} ${storage === 1 ? 'מחסן' : 'מחסנים'}`].filter(Boolean);
    text += `, ${com.length} מסחר (${parts.join(', ')})`;
  }
  return text;
}

// שמות מעביר בבנק: נשמרים כרשימה, נערכים כטקסט מופרד בפסיקים
export function parsePayerNames(text) {
  if (Array.isArray(text)) return text.map(s => String(s).trim()).filter(Boolean);
  return String(text || '').split(/[,،]/).map(s => s.trim()).filter(Boolean);
}

// יחידה שאחד משמות המעביר שלה מופיע בתיאור התנועה בבנק (אפיון 06, סעיף 3)
export function matchUnitByPayer(building, description) {
  const desc = String(description || '').replace(/["'״׳]/g, '');
  return (building?.apartments || []).find(u =>
    parsePayerNames(u.bankPayerNames).some(n => n.length >= 3 && desc.includes(n.replace(/["'״׳]/g, '')))
  ) || null;
}

// שדות יחידה לשמירה (מאחד הוספה ידנית וייבוא מאקסל)
export function unitFields(data, defaults = {}) {
  const commercial = data.unitType === 'commercial';
  return {
    unitType: commercial ? 'commercial' : 'residential',
    commercialLabel: commercial ? (data.commercialLabel === 'storage' ? 'storage' : 'shop') : undefined,
    businessName: commercial ? (data.businessName || '').trim() : undefined,
    bankPayerNames: parsePayerNames(data.bankPayerNames),
    hiyuvitClientNumber: String(data.hiyuvitClientNumber || '').trim(),
    ...defaults
  };
}
