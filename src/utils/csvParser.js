// ==========================================================================
// בית ומנוחה - מפענח קובצי CSV (בנק וחיובית)
// ==========================================================================

/**
 * מפענח שורות CSV תוך טיפול במירכאות ופסיקים
 */
export function parseCSVText(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const parseLine = (text) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length >= headers.length) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      rows.push(obj);
    }
  }

  return { headers, rows };
}

/**
 * מפענח דו"ח תנועות עובר ושב מהבנק
 */
export function parseBankReport(csvText) {
  const { rows } = parseCSVText(csvText);
  return rows.map((r, idx) => {
    // זיהוי עמודות נפוצות
    const date = r['תאריך'] || r['תאריך הפעולה'] || '';
    const desc = r['תיאור התנועה'] || r['תיאור'] || r['פרטים'] || '';
    const rawAmount = r['זכות/חובה ₪'] || r['סכום'] || '0';
    const cleanAmount = parseFloat(String(rawAmount).replace(/[^\d.-]/g, '')) || 0;
    const balance = parseFloat(String(r['יתרה ₪'] || r['יתרה'] || '0').replace(/[^\d.-]/g, '')) || 0;
    const reference = r['אסמכתה'] || r['אסמכתא'] || '';

    let type = cleanAmount < 0 ? 'expense' : 'income';
    let category = 'תחזוקה שוטפת והוצאות חריגות';

    // זיהוי קטגוריה אוטומטי חכם
    if (desc.includes('חשמל')) category = 'חשבון חשמל';
    else if (desc.includes('מעלי') || desc.includes('שינדלר') || desc.includes('ישראליפט') || desc.includes('אוטיס')) category = 'ביטוח מעליות';
    else if (desc.includes('מהנדס')) category = 'מהנדס מעליות';
    else if (desc.includes('נקיון') || desc.includes('ניקיון')) category = 'ניקיון';
    else if (desc.includes('ריח')) category = 'מפיץ ריח';
    else if (desc.includes('פינטק') || desc.includes('חיובית') || desc.includes('סליקה')) category = 'עמלות סליקה';
    else if (desc.includes('גינון')) category = 'הוצאות גינון';
    else if (desc.includes('ניהול')) category = 'דמי ניהול';

    return {
      id: `bank-tx-${Date.now()}-${idx}`,
      date,
      description: desc,
      amount: Math.abs(cleanAmount),
      rawAmount: cleanAmount,
      balance,
      reference,
      type,
      category: type === 'expense' ? category : 'הכנסה / העברה ישירה',
      source: 'בנק'
    };
  });
}

/**
 * מפענח דו"ח חברת גבייה 'חיובית'
 */
export function parseHiyuvitReport(csvText) {
  const { rows } = parseCSVText(csvText);
  return rows.map((r, idx) => {
    const tenantName = r['Details'] || r['שם דייר'] || r['פרטים'] || '';
    const rawAmount = parseFloat(String(r['Amount'] || r['סכום'] || '0').replace(/[^\d.-]/g, '')) || 0;
    const fee = parseFloat(String(r['Amla'] || r['עמלה'] || '0').replace(/[^\d.-]/g, '')) || 0;
    const net = parseFloat(String(r['ToPay'] || r['לתשלום'] || '0').replace(/[^\d.-]/g, '')) || (rawAmount - fee);
    const date = r['DueDate'] || r['תאריך'] || '';
    const tranType = r['TranType'] || r['סוג תנועה'] || '';
    const clientNumber = r['ClientNumber'] || '';

    const isSuccess = !tranType.includes('נכשל');

    return {
      id: `hiyuvit-tx-${Date.now()}-${idx}`,
      tenantName,
      clientNumber,
      amount: rawAmount,
      fee,
      net,
      date,
      tranType,
      isSuccess,
      source: 'חיובית'
    };
  });
}
