// ==========================================================================
// בית ומנוחה - כלי עזר להמרת תאריכים לתאריך עברי מלא ומשולב
// ==========================================================================

// ספרות עבריות
function numberToHebrew(num) {
  if (num <= 0) return '';
  const letters = [
    { val: 400, char: 'ת' },
    { val: 300, char: 'ש' },
    { val: 200, char: 'ר' },
    { val: 100, char: 'ק' },
    { val: 90, char: 'צ' },
    { val: 80, char: 'פ' },
    { val: 70, char: 'ע' },
    { val: 60, char: 'ס' },
    { val: 50, char: 'נ' },
    { val: 40, char: 'מ' },
    { val: 30, char: 'ל' },
    { val: 20, char: 'כ' },
    { val: 19, char: 'י״ט' },
    { val: 18, char: 'י״ח' },
    { val: 17, char: 'י״ז' },
    { val: 16, char: 'ט״ז' },
    { val: 15, char: 'ט״ו' },
    { val: 10, char: 'י' },
    { val: 9, char: 'ט' },
    { val: 8, char: 'ח' },
    { val: 7, char: 'ז' },
    { val: 6, char: 'ו' },
    { val: 5, char: 'ה' },
    { val: 4, char: 'ד' },
    { val: 3, char: 'ג' },
    { val: 2, char: 'ב' },
    { val: 1, char: 'א' }
  ];

  let result = '';
  let n = num;

  for (const item of letters) {
    if (item.val === 15 || item.val === 16 || item.val === 17 || item.val === 18 || item.val === 19) {
      if (n === item.val) {
        result += item.char;
        n -= item.val;
        break;
      }
    } else {
      while (n >= item.val) {
        result += item.char;
        n -= item.val;
      }
    }
  }

  // הוספת גרשיים או גרש
  if (result.length === 1) {
    return result + '׳';
  } else if (result.length > 1 && !result.includes('״') && !result.includes('׳')) {
    return result.slice(0, -1) + '״' + result.slice(-1);
  }
  return result;
}

/**
 * מחזיר מחרוזת תאריך עברי אותנטי באמצעות Intl.DateTimeFormat (קיים מובנה בכל דפדפן מודרני)
 */
export function getHebrewDateString(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    
    let day = '';
    let month = '';
    let year = '';

    parts.forEach(p => {
      if (p.type === 'day') day = p.value;
      if (p.type === 'month') month = p.value;
      if (p.type === 'year') year = p.value;
    });

    const numericDay = parseInt(day, 10);
    const hebrewDay = !isNaN(numericDay) ? numberToHebrew(numericDay) : day;

    let formattedYear = year;
    const numericYear = parseInt(year, 10);
    if (!isNaN(numericYear) && numericYear > 5000) {
      const shortYear = numericYear - 5000;
      formattedYear = numberToHebrew(shortYear);
    }

    return `${hebrewDay} ב${month} ${formattedYear}`.trim();
  } catch (e) {
    return 'י״ד בתשרי תשפ״ז';
  }
}

/**
 * מעצב תאריך בהתאם להעדפות המערכת
 * @param {Date} date 
 * @param {'both' | 'hebrew_only' | 'gregorian_only'} format 
 */
export function formatFormattedDate(date = new Date(), format = 'both') {
  const gregorianStr = date.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  if (format === 'gregorian_only') {
    return gregorianStr;
  }

  const hebrewStr = getHebrewDateString(date);

  if (format === 'hebrew_only') {
    return hebrewStr;
  }

  // ברירת מחדל: משולב עברי + לועזי
  return `${hebrewStr}  |  ${gregorianStr}`;
}
