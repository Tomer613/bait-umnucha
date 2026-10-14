// ==========================================================================
// בית ומנוחה - מודול אקסל מתקדם (SheetJS / xlsx)
// ==========================================================================
import * as XLSX from 'xlsx';

/**
 * הורדת קובץ אקסל לדפדפן
 */
function downloadWorkbook(workbook, filename) {
  XLSX.writeFile(workbook, filename);
}

/**
 * מפיק תבנית אקסל להזנת דיירים לבניין בודד
 */
export function downloadSingleBuildingTemplate(buildingName = "בניין לדוגמה") {
  const data = [
    ["מספר דירה", "שם דייר", "טלפון", "אימייל", "דמי ועד חודשיים", "אופן תשלום"],
    [1, "ישראל ישראלי", "050-1234567", "israel@example.com", 300, "חיובית"],
    [2, "אברהם לוי", "052-7654321", "levi@example.com", 300, "העברה בנקאית"],
    [3, "יעקב כהן", "054-9876543", "cohen@example.com", 250, "מזומן"],
    [4, "שרה שפירא", "053-5554433", "shapiro@example.com", 350, "חיובית"]
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 15 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, buildingName.slice(0, 31));

  downloadWorkbook(wb, `תבנית_דיירים_${buildingName}.xlsx`);
}

/**
 * מפיק תבנית אקסל מרכזית מרובת לשוניות עבור כל הבניינים
 */
export function downloadMasterBuildingsTemplate(buildings) {
  const wb = XLSX.utils.book_new();

  buildings.forEach((b) => {
    const data = [
      ["מספר דירה", "שם דייר", "טלפון", "אימייל", "דמי ועד חודשיים", "אופן תשלום"]
    ];

    if (b.apartments && b.apartments.length > 0) {
      b.apartments.forEach(apt => {
        data.push([apt.aptNum, apt.tenantName, apt.phone || '', apt.email || '', apt.monthlyDues, apt.paymentMethod || 'חיובית']);
      });
    } else {
      data.push([1, "דייר לדוגמה", "050-0000000", "tenant@example.com", 300, "חיובית"]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, b.name.slice(0, 31));
  });

  downloadWorkbook(wb, `תבנית_מאסטר_דיירים_כל_הבניינים.xlsx`);
}

/**
 * קריאת קובץ אקסל של דיירים (תומך בבניין בודד או מרובה לשוניות)
 */
export async function readTenantExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const result = {};

        workbook.SheetNames.forEach(sheetName => {
          const ws = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
          if (rawRows.length <= 1) return;

          const apartments = [];
          for (let i = 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row || row.length === 0 || !row[0]) continue;
            apartments.push({
              aptNum: parseInt(row[0]) || i,
              tenantName: String(row[1] || `דירה ${row[0]}`).trim(),
              phone: String(row[2] || '').trim(),
              email: String(row[3] || '').trim(),
              monthlyDues: parseFloat(row[4]) || 300,
              paymentMethod: String(row[5] || 'חיובית').trim(),
              debtMonths: []
            });
          }
          result[sheetName] = apartments;
        });

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * ייצוא דו"ח הוצאות שנתי בטבלה חודשית (מטריצה לפי קטגוריות וחודשים)
 */
export function exportExpensesMatrixExcel(building, year = 2026, categories = []) {
  const months = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

  const headerRow = ["קטגוריה / סעיף הוצאה", ...months, "סך הכל שנתי"];
  const rows = [headerRow];

  const monthTotals = Array(12).fill(0);
  let grandTotal = 0;

  categories.forEach(cat => {
    const catRow = [cat];
    let catTotal = 0;

    for (let m = 1; m <= 12; m++) {
      const monthKey = `${year}-${String(m).padStart(2, '0')}`;
      const sum = (building.expenses || [])
        .filter(exp => exp.month === monthKey && exp.category === cat)
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

      catRow.push(sum || 0);
      catTotal += sum;
      monthTotals[m - 1] += sum;
      grandTotal += sum;
    }

    catRow.push(catTotal);
    rows.push(catRow);
  });

  // שורת סיכום
  rows.push(["סך הכל הוצאות חודשיות", ...monthTotals, grandTotal]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 25 }, ...months.map(() => ({ wch: 12 })), { wch: 15 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, building.name.slice(0, 31));

  downloadWorkbook(wb, `דוח_הוצאות_${building.name}_${year}.xlsx`);
}

/**
 * ייצוא דו"ח תקבולים וחובות דיירים
 */
export function exportDebtsLedgerExcel(building) {
  const data = [
    ["מספר דירה", "שם דייר", "טלפון", "אופן תשלום", "דמי ועד לחודש", "מספר חודשי חוב", "חודשים בחוב", "סך חוב מצטבר (₪)"]
  ];

  let totalDebtAll = 0;

  (building.apartments || []).forEach(apt => {
    const debtCount = apt.debtMonths ? apt.debtMonths.length : 0;
    const debtSum = debtCount * (apt.monthlyDues || 0);
    totalDebtAll += debtSum;

    data.push([
      apt.aptNum,
      apt.tenantName,
      apt.phone || '',
      apt.paymentMethod || 'חיובית',
      apt.monthlyDues,
      debtCount,
      (apt.debtMonths || []).join(', '),
      debtSum
    ]);
  });

  data.push(["", "", "", "", "", "", "סך הכל חובות בבניין:", totalDebtAll]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 16 }, { wch: 16 }, { wch: 25 }, { wch: 18 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "דוח תקבולים וחובות");

  downloadWorkbook(wb, `דוח_חובות_דיירים_${building.name}.xlsx`);
}

/**
 * ייצוא דו"ח מאסטר מרוכז לכלל הבניינים (לשונית סיכום הנהלה + לשוניות לפי בניין)
 */
export function exportMasterSummaryExcel(buildings = []) {
  const wb = XLSX.utils.book_new();

  // לשונית 1: סיכום כללי
  const summaryData = [
    ["שם בניין", "כתובת", "קוד חיובית", "חשבון בנק", "יתרת קופה (₪)", "מספר דירות", "צפי גבייה חודשי (₪)", "סך חובות פתוחים (₪)", "תקלות פתוחות"]
  ];

  let totalBalanceAll = 0;
  let totalDuesAll = 0;
  let totalDebtsAll = 0;
  let totalAptsAll = 0;

  buildings.forEach(b => {
    const aptCount = b.apartments?.length || 0;
    const monthlyDues = (b.apartments || []).reduce((acc, a) => acc + (a.monthlyDues || 0), 0);
    const debts = (b.apartments || []).reduce((acc, a) => acc + ((a.debtMonths?.length || 0) * (a.monthlyDues || 0)), 0);
    const openIssues = (b.issues || []).filter(i => i.status === 'open').length;

    totalBalanceAll += (b.currentBalance || 0);
    totalDuesAll += monthlyDues;
    totalDebtsAll += debts;
    totalAptsAll += aptCount;

    summaryData.push([
      b.name,
      b.address || '',
      b.hiyuvitCode || '',
      b.bankAccount || '',
      b.currentBalance || 0,
      aptCount,
      monthlyDues,
      debts,
      openIssues
    ]);
  });

  summaryData.push([
    "סה״כ כלל הבניינים",
    "",
    "",
    "",
    totalBalanceAll,
    totalAptsAll,
    totalDuesAll,
    totalDebtsAll,
    ""
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, "סיכום הנהלה כלל הבניינים");

  // לשוניות עבור כל בניין בנפרד
  buildings.forEach(b => {
    const bData = [
      ["מספר דירה", "שם דייר", "טלפון", "אימייל", "דמי ועד (₪)", "אופן תשלום", "מספר חודשי חוב", "סך חוב (₪)"]
    ];

    (b.apartments || []).forEach(apt => {
      const debtCount = apt.debtMonths?.length || 0;
      const debtSum = debtCount * (apt.monthlyDues || 0);
      bData.push([
        apt.aptNum,
        apt.tenantName,
        apt.phone || '',
        apt.email || '',
        apt.monthlyDues || 0,
        apt.paymentMethod || 'חיובית',
        debtCount,
        debtSum
      ]);
    });

    const wsBuilding = XLSX.utils.aoa_to_sheet(bData);
    wsBuilding['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 16 }, { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }
    ];
    // שם לשונית עד 31 תווים ללא תווים אסורים
    const safeSheetName = b.name.replace(/[:\\/?*\[\]]/g, '').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, wsBuilding, safeSheetName);
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadWorkbook(wb, `דוח_מאסטר_כלל_הבניינים_${dateStr}.xlsx`);
}

