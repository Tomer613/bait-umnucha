// ==========================================================================
// בית ומנוחה - נתוני בסיס ונתוני אמת ל-15 הבניינים המנוהלים
// ==========================================================================

export const BUILDING_COLOR_PALETTE = [
  { id: 'sapphire', name: 'כחול ספיר', primary: '#1A569A', tint: '#EDF4FC', border: '#B9D5F5', tagBg: '#DCEBFA', text: '#103968' },
  { id: 'amber', name: 'זהב ענבר', primary: '#B88E3E', tint: '#FAF5EA', border: '#EBD8B0', tagBg: '#F5E8C9', text: '#6D4E16' },
  { id: 'emerald', name: 'ירוק אמרלד', primary: '#1C7444', tint: '#ECF7F1', border: '#B6E2CA', tagBg: '#D5F0E1', text: '#0F4829' },
  { id: 'terracotta', name: 'חום טרקוטה', primary: '#A6532B', tint: '#FBF3EE', border: '#ECCDC0', tagBg: '#F5DDD3', text: '#632E14' },
  { id: 'plum', name: 'סגול שזיף', primary: '#6E3C96', tint: '#F6EEFB', border: '#DDC0F0', tagBg: '#ECD4F9', text: '#43205E' },
  { id: 'teal', name: 'טורקיז פלדה', primary: '#1B7C84', tint: '#EEF8F8', border: '#BAE3E5', tagBg: '#D4F0F2', text: '#104D52' },
  { id: 'burgundy', name: 'אדום בורדו', primary: '#8E2838', tint: '#FBF0F2', border: '#E9BBC3', tagBg: '#F5D3D9', text: '#58131E' },
  { id: 'navy', name: 'נייבי עמוק', primary: '#223F6A', tint: '#EFF4FA', border: '#BED2E9', tagBg: '#D7E5F5', text: '#142742' },
  { id: 'olive', name: 'זית מרווה', primary: '#5E7032', tint: '#F4F7ED', border: '#D2DEB0', tagBg: '#E4ECCB', text: '#39451C' },
  { id: 'lavender', name: 'לבנדר עמוק', primary: '#574883', tint: '#F4F2FA', border: '#CFC5E8', tagBg: '#E3DDF4', text: '#342953' },
  { id: 'espresso', name: 'אספרסו חם', primary: '#593B28', tint: '#F8F3EF', border: '#DECFC3', tagBg: '#EFE3D8', text: '#372215' },
  { id: 'ocean', name: 'אינדיגו אוקיינוס', primary: '#275B7A', tint: '#F0F6F9', border: '#BFD6E5', tagBg: '#D7E7F2', text: '#16374A' },
  { id: 'bronze', name: 'ברונזה עתיקה', primary: '#8A6A27', tint: '#F9F6ED', border: '#E3D7B5', tagBg: '#F2E8CB', text: '#543F14' },
  { id: 'crimson', name: 'רובי ארגמן', primary: '#9E243F', tint: '#FCEEF1', border: '#ECB8C3', tagBg: '#F7D0D9', text: '#611224' },
  { id: 'forest', name: 'פטרול עמוק', primary: '#1E6E66', tint: '#EFF7F6', border: '#BEE1DD', tagBg: '#D5EFEB', text: '#10443F' },
  { id: 'copper', name: 'נחושת כתומה', primary: '#A64324', tint: '#FBF1EE', border: '#EBC3B8', tagBg: '#F5D6CE', text: '#692510' }
];

export function getBuildingColor(building, index = 0) {
  if (building && building.color && building.color.primary) return building.color;
  return BUILDING_COLOR_PALETTE[index % BUILDING_COLOR_PALETTE.length];
}

export const INITIAL_BUILDINGS = [
  {
    id: "bavli-43",
    name: "בבלי 43",
    address: "רחוב בבלי 43, ירושלים",
    bankAccount: "בנק הפועלים 12-740-438910",
    hiyuvitCode: "643",
    currentBalance: 16974.59,
    statusMonthUpdated: true,
    color: BUILDING_COLOR_PALETTE[0],
    settings: {
      issuesEnabled: true,
      reportsViewEnabled: false,
      recurringExpenses: [
        { id: "rec-1", name: "דמי ניהול ועד בית", category: "דמי ניהול", amount: 1100 },
        { id: "rec-2", name: "שירות מפיץ ריח", category: "מפיץ ריח", amount: 80 }
      ]
    },
    apartments: [
      { id: "apt-1", aptNum: 1, tenantName: "משפחת כהן", phone: "050-1234567", email: "cohen.bavli43@gmail.com", monthlyDues: 250, paymentMethod: "חיובית", debtMonths: [] },
      { id: "apt-2", aptNum: 2, tenantName: "אליעזר קרפמן", phone: "052-7654321", email: "karpman43@gmail.com", monthlyDues: 270, paymentMethod: "חיובית", debtMonths: [] },
      { id: "apt-3", aptNum: 3, tenantName: "משה יעקובי", phone: "054-8889900", email: "m.yaacobi@gmail.com", monthlyDues: 350, paymentMethod: "העברה בנקאית", debtMonths: ["2026-08", "2026-09"] },
      { id: "apt-4", aptNum: 4, tenantName: "מרים הלטובסקי", phone: "053-3334455", email: "haltovsky.m@gmail.com", monthlyDues: 200, paymentMethod: "העברה בנקאית", debtMonths: [] },
      { id: "apt-5", aptNum: 5, tenantName: "שלום וובר", phone: "058-4445566", email: "weber.s@gmail.com", monthlyDues: 370, paymentMethod: "חיובית", debtMonths: [] },
      { id: "apt-6", aptNum: 6, tenantName: "נחמן קניג", phone: "050-9998877", email: "kenig.n@gmail.com", monthlyDues: 370, paymentMethod: "מזומן", debtMonths: ["2026-07", "2026-08", "2026-09"] },
      { id: "apt-7", aptNum: 7, tenantName: "הלל אייזנבאך", phone: "052-1112233", email: "eisenbach.h@gmail.com", monthlyDues: 370, paymentMethod: "חיובית", debtMonths: [] },
      { id: "apt-8", aptNum: 8, tenantName: "מינץ אולפן", phone: "054-5556677", email: "mintz.studio@gmail.com", monthlyDues: 450, paymentMethod: "חיובית", debtMonths: [] }
    ],
    expenses: [
      { id: "exp-1", date: "2026-09-01", month: "2026-09", category: "דמי ניהול", amount: 1100, description: "דמי ניהול ועד בית חודש 9", source: "קבוע" },
      { id: "exp-2", date: "2026-09-02", month: "2026-09", category: "מפיץ ריח", amount: 80, description: "החלפת מפיץ ריח בלובי", source: "קבוע" },
      { id: "exp-3", date: "2026-09-10", month: "2026-09", category: "חשבון חשמל", amount: 1007, description: "חברת החשמל חיוב ישיר", source: "בנק" },
      { id: "exp-4", date: "2026-09-12", month: "2026-09", category: "ביטוח מעליות", amount: 1133, description: "שינדלר מעליות אחזקה שוטפת", source: "בנק" },
      { id: "exp-5", date: "2026-09-15", month: "2026-09", category: "ניקיון", amount: 1400, description: "ניקיון חדרי מדרגות חודש ספטמבר", source: "מזומן" },
      { id: "exp-6", date: "2026-09-18", month: "2026-09", category: "עמלות סליקה", amount: 146, description: "אוקס פינטק / חיובית עמלות", source: "חיובית" },
      { id: "exp-7", date: "2026-09-22", month: "2026-09", category: "תחזוקה שוטפת והוצאות חריגות", amount: 250, description: "ניקיון מיוחד קומה 5,6", source: "מזומן" }
    ],
    specialLevies: [
      {
        id: "levy-1",
        title: "תיקון פיצוץ צנרת ראשי בחניון",
        totalAmount: 2400,
        amountPerApt: 300,
        createdAt: "2026-09-05",
        status: "פעיל",
        paidApartmentIds: ["apt-1", "apt-2", "apt-4", "apt-5", "apt-8"]
      }
    ],
    issues: [
      {
        id: "iss-1",
        title: "רעש מהמעלית בקומה 3",
        author: "אליעזר קרפמן (דירה 2)",
        createdAt: "2026-09-25 14:30",
        status: "open",
        comments: [
          { id: "c-1", author: "אליעזר קרפמן", text: "המעלית משמיעה חריקות חזקות בעצירה בקומה 3, בבקשה לבדוק.", time: "25/09/2026 14:30" },
          { id: "c-2", author: "מנהל החברה", text: "הוזמן טכנאי מחברת שינדלר ליום חמישי בבוקר.", time: "25/09/2026 16:15" }
        ]
      }
    ]
  },
  {
    id: "ravina-1",
    name: "רבינא 1",
    address: "רחוב רבינא 1, ירושלים",
    bankAccount: "בנק דיסקונט 11-123-556677",
    hiyuvitCode: "646",
    currentBalance: 24150.00,
    statusMonthUpdated: true,
    color: BUILDING_COLOR_PALETTE[1],
    settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [{ id: "rec-r1", name: "דמי ניהול", category: "דמי ניהול", amount: 1200 }] },
    apartments: [
      { id: "r-1", aptNum: 1, tenantName: "ישראל ישראלי", phone: "050-1111111", email: "israel@gmail.com", monthlyDues: 300, paymentMethod: "חיובית", debtMonths: [] },
      { id: "r-2", aptNum: 2, tenantName: "אברהם לוי", phone: "052-2222222", email: "levi@gmail.com", monthlyDues: 300, paymentMethod: "חיובית", debtMonths: [] }
    ],
    expenses: [
      { id: "exp-r1", date: "2026-09-01", month: "2026-09", category: "דמי ניהול", amount: 1200, description: "דמי ניהול ועד", source: "קבוע" },
      { id: "exp-r2", date: "2026-09-10", month: "2026-09", category: "ניקיון", amount: 1500, description: "שירות ניקיון", source: "בנק" }
    ],
    specialLevies: [],
    issues: []
  },
  { id: "yerushalmi-18", name: "ירושלמי 18", address: "רחוב ירושלמי 18", bankAccount: "בנק לאומי 10-850-998877", hiyuvitCode: "648", currentBalance: 12400.00, statusMonthUpdated: true, color: BUILDING_COLOR_PALETTE[2], settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [] }, apartments: [], expenses: [], specialLevies: [], issues: [] },
  { id: "abaye-27", name: "אביי 27", address: "רחוב אביי 27", bankAccount: "בנק הפועלים 12-650-334455", hiyuvitCode: "650", currentBalance: 9800.50, statusMonthUpdated: false, color: BUILDING_COLOR_PALETTE[3], settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [] }, apartments: [], expenses: [], specialLevies: [], issues: [] },
  { id: "resh-lakish-14", name: "ריש לקיש 14", address: "רחוב ריש לקיש 14", bankAccount: "בנק מזרחי 20-410-112233", hiyuvitCode: "652", currentBalance: 15320.00, statusMonthUpdated: true, color: BUILDING_COLOR_PALETTE[4], settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [] }, apartments: [], expenses: [], specialLevies: [], issues: [] },
  { id: "amora-76", name: "אמוראים 76", address: "רחוב אמוראים 76", bankAccount: "בנק הפועלים 12-700-445566", hiyuvitCode: "654", currentBalance: 8750.00, statusMonthUpdated: false, color: BUILDING_COLOR_PALETTE[5], settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [] }, apartments: [], expenses: [], specialLevies: [], issues: [] },
  { id: "amora-35", name: "אמוראים 35", address: "רחוב אמוראים 35", bankAccount: "בנק הפועלים 12-700-445577", hiyuvitCode: "656", currentBalance: 14200.00, statusMonthUpdated: true, color: BUILDING_COLOR_PALETTE[6], settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [] }, apartments: [], expenses: [], specialLevies: [], issues: [] },
  { id: "berachia-8", name: "ברכיה 8", address: "רחוב ברכיה 8", bankAccount: "בנק דיסקונט 11-300-889900", hiyuvitCode: "658", currentBalance: 21000.00, statusMonthUpdated: true, color: BUILDING_COLOR_PALETTE[7], settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [] }, apartments: [], expenses: [], specialLevies: [], issues: [] },
  { id: "hilkiya-8", name: "חלקיה בר טובי 8", address: "רחוב חלקיה בר טובי 8", bankAccount: "בנק לאומי 10-820-114477", hiyuvitCode: "660", currentBalance: 17650.00, statusMonthUpdated: true, color: BUILDING_COLOR_PALETTE[8], settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [] }, apartments: [], expenses: [], specialLevies: [], issues: [] },
  { id: "hilkiya-27", name: "חלקיה בר טובי 27", address: "רחוב חלקיה בר טובי 27", bankAccount: "בנק לאומי 10-820-114488", hiyuvitCode: "662", currentBalance: 11300.00, statusMonthUpdated: false, color: BUILDING_COLOR_PALETTE[9], settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [] }, apartments: [], expenses: [], specialLevies: [], issues: [] },
  { id: "hanina-21", name: "חנינא 21", address: "רחוב חנינא 21", bankAccount: "בנק מזרחי 20-430-778899", hiyuvitCode: "664", currentBalance: 19400.00, statusMonthUpdated: true, color: BUILDING_COLOR_PALETTE[10], settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [] }, apartments: [], expenses: [], specialLevies: [], issues: [] },
  { id: "hanina-23", name: "חנינא 23", address: "רחוב חנינא 23", bankAccount: "בנק מזרחי 20-430-778800", hiyuvitCode: "666", currentBalance: 13900.00, statusMonthUpdated: true, color: BUILDING_COLOR_PALETTE[11], settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [] }, apartments: [], expenses: [], specialLevies: [], issues: [] },
  { id: "bavli-47", name: "בבלי 47", address: "רחוב בבלי 47", bankAccount: "בנק הפועלים 12-740-438920", hiyuvitCode: "668", currentBalance: 27800.00, statusMonthUpdated: true, color: BUILDING_COLOR_PALETTE[12], settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [] }, apartments: [], expenses: [], specialLevies: [], issues: [] },
  { id: "rav-amram-10", name: "רב עמרם 10", address: "רחוב רב עמרם 10", bankAccount: "בנק דיסקונט 11-150-332211", hiyuvitCode: "670", currentBalance: 6500.00, statusMonthUpdated: false, color: BUILDING_COLOR_PALETTE[13], settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [] }, apartments: [], expenses: [], specialLevies: [], issues: [] },
  { id: "rav-hanan-8", name: "רב חנן 8", address: "רחוב רב חנן 8", bankAccount: "בנק לאומי 10-890-554433", hiyuvitCode: "672", currentBalance: 18200.00, statusMonthUpdated: true, color: BUILDING_COLOR_PALETTE[14], settings: { issuesEnabled: true, reportsViewEnabled: false, recurringExpenses: [] }, apartments: [], expenses: [], specialLevies: [], issues: [] }
];

export const EXPENSE_CATEGORIES = [
  "ניקיון",
  "חומרי ניקוי",
  "חשבון חשמל",
  "ביטוח מעליות",
  "מהנדס מעליות",
  "עמלות סליקה",
  "דמי ניהול",
  "מפיץ ריח",
  "קו בזק / תקשורת מעלית",
  "הוצאות גינון",
  "תחזוקה שוטפת והוצאות חריגות"
];

export const LETTER_TEMPLATES = [
  {
    id: "debt-1",
    category: "גבייה וחובות",
    subcategory: "תזכורת חוב ראשונה",
    title: "תזכורת ידידותית לתשלום דמי ועד בית",
    content: `לכבוד דיירי הבניין היקרים ב{{שם_בניין}}, שלום וברכה,

ברצוננו להזכירכם כי תשלום דמי הוועד לחודשים האחרונים חיוני לשמירה על תקינות הבניין, הניקיון השוטף, ביטוח המעלית ופעילות המאור.

דיירים שטרם הסדירו את חובם מתבקשים לפנות בהקדם להסדרת התשלום (בכרטיס אשראי, העברה בנקאית או מזומן).

בתודה על שיתוף הפעולה,
הנהלת בית ומנוחה - ניהול ועד בית`
  },
  {
    id: "debt-2",
    category: "גבייה וחובות",
    subcategory: "התראה לפני נקיטת צעדים",
    title: "התראה דחופה להסדרת חוב ועד בית",
    content: `לכבוד דיירי {{שם_בניין}},
הרינו להודיעכם כי על פי רישומי המערכת קיימים חובות מצטברים שלא הוסדרו למרות פניות חוזרות ונשנות.

אי תשלום דמי ועד פוגע ישירות בכלל דיירי הבניין ומסכן את המשך מתן שירותי הניקיון ואחזקת המעליות.
הנכם נדרשים להסדיר את התשלום בתוך 7 ימים ממועד מכתב זה.

בברכה,
הנהלת בית ומנוחה`
  },
  {
    id: "maint-1",
    category: "תקלות ותחזוקה",
    subcategory: "השבתת מעלית לתיקון",
    title: "הודעה על השבתת מעלית לצורך עבודות תחזוקה",
    content: `לכבוד דיירי {{שם_בניין}},

לידיעתכם, ביום {{תאריך}} בין השעות 09:00 ל-13:00 תושבת מעלית הבניין לצורך ביצוע טיפול תקופתי ובדיקת מהנדס בטיחות מוסמך.

אנו מתנצלים על אי הנוחות הזמנית ומודים לכם על ההבנה והסבלנות.

בברכה,
בית ומנוחה`
  },
  {
    id: "maint-2",
    category: "תקלות ותחזוקה",
    subcategory: "הכנות לחורף ואיטום גג",
    title: "הודעה על ביצוע עבודות איטום גג וזיפות לקראת החורף",
    content: `דיירים יקרים,
לקראת עונת הגשמים הקרבה, בימים הקרובים יבוצעו עבודות זיפות, ניקוי מרזבים ובדיקת איטום בגג הבניין.
דיירי הקומות העליונות מוזמנים לשים לב לתנועת אנשי המקצוע בגג.

בברכת חורף חם ובטוח,
צוות בית ומנוחה`
  },
  {
    id: "holiday-1",
    category: "חגים ומועדים",
    subcategory: "ברכת חג הפסח",
    title: "ברכת חג פסח כשר ושמח ופינוי חפצים ממעברים",
    content: `לכל דיירי {{שם_בניין}} ומשפחותיהם,

הנהלת "בית ומנוחה" מאחלת לכם ולבני ביתכם חג פסח כשר, שמח, שקט ומלא ברכה!

לרגל הניקיונות לחג, אנא הימנעו מהשארת אשפה, ארגזים או רהיטים בחדר המדרגות ובלובי הבניין.
תודה על שמירת הניקיון והסדר לרווחת כולם!`
  },
  {
    id: "holiday-2",
    category: "חגים ומועדים",
    subcategory: "ברכת שנה טובה",
    title: "ברכת שנה טובה ומבורכת",
    content: `דיירים יקרים ב{{שם_בניין}},

עם פתיחת השנה החדשה, אנו רוצים להודות לכם על שיתוף הפעולה הפורה לאורך כל השנה.
יהי רצון שתהא זו שנת שלום, בריאות, שגשוג ואיכות חיים משותפת בבניין.

שנה טובה ומתוקה!
צוות בית ומנוחה - ניהול ועד בית`
  }
];

// רשימות קבועות לטפסים — מקור אחד לכל המערכת
export const PAYMENT_METHODS = ["חיובית", "הוראת קבע", "העברה בנקאית", "מזומן"];

export const RECEIPT_TYPES = ["מזומן", "העברה בנקאית ישירה", "צ'ק"];

export const OCCUPANT_TYPES = ["שוכר", "בעל דירה"];
