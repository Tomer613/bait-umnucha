// ==========================================================================
// בית ומנוחה - מנהל מצב מרכזי עם שמירה אוטומטית מקומית (LocalStorage)
// ==========================================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_BUILDINGS, BUILDING_COLOR_PALETTE, getBuildingColor, EXPENSE_CATEGORIES, OTHER_CATEGORY } from '../data/initialData';
import { migrateMonthClose } from '../utils/monthClose';
import { migrateBuildingLedger } from '../utils/ledger';
import * as ops from '../utils/ledgerOps';
import { unitFields } from '../utils/units';
import * as lv from '../utils/levies';
import * as pp from '../utils/paymentPlans';
import * as iss from '../utils/issues';
import { DEFAULT_CATEGORY_RULES, DEFAULT_HIYUVIT_DEPOSIT_NAMES } from '../utils/importPlan';

const INITIAL_MONTH = '2026-09';

const AppContext = createContext(null);

const STORAGE_KEY = 'bait_umnucha_state_v1';
const SETTINGS_STORAGE_KEY = 'bait_umnucha_settings_v1';
const PRESETS_STORAGE_KEY = 'bait_umnucha_report_presets_v2';
const DISPLAY_STORAGE_KEY = 'bait_umnucha_display_v1';

// הגדרות תצוגה אישיות (נשמרות בדפדפן הזה בלבד)
export const DEFAULT_DISPLAY = {
  fontSize: 17,          // גודל טקסט בסיסי בפיקסלים
  font: 'rubik',         // rubik | heebo | assistant | varela
  weight: 'normal',      // normal | bold
  contrast: 'normal',    // normal | high | max
  density: 'normal'      // compact | normal | spacious
};

const DEFAULT_PRESETS = [
  { id: 'pre-1', name: 'דוח הוצאות שנתי', reportType: 'expenses', includeLevies: false, entrance: 'all' },
  { id: 'pre-2', name: 'דוח חובות + קופות מיוחדות', reportType: 'debts', includeLevies: true, entrance: 'all' },
  { id: 'pre-3', name: 'דוח חובות כניסה א׳', reportType: 'debts', includeLevies: false, entrance: 'א' }
];

const DEFAULT_SETTINGS = {
  useHebrewDateDefault: true,
  hebrewDateFormat: 'both', // 'both' | 'hebrew_only' | 'gregorian_only'
  noticeHeaderPrefix: 'בס״ד',
  noticeSignoff: 'בברכת ועד הבית וההנהלה,\nבית ומנוחה',
  companyName: 'בית ומנוחה',
  managerName: 'ישי לוי',
  phoneList: [
    { id: 'phone-1', number: '052-7623803', label: 'לשיחות בלבד' },
    { id: 'phone-2', number: '055-6704029', label: 'וואטסאפ בלבד' }
  ],
  emailList: [
    { id: 'email-1', email: 'bm4923359@gmail.com', label: 'ראשי' },
    { id: 'email-2', email: '9926606@gmail.com', label: 'משני' }
  ],
  phoneCalls: '052-7623803',
  phoneWhatsapp: '055-6704029',
  companyPhone: 'שיחות: 052-7623803 | וואטסאפ: 055-6704029',
  companyEmail: 'bm4923359@gmail.com',
  companyEmailSecondary: '9926606@gmail.com',
  defaultMonthlyDues: 300,
  enableIssuesModule: true,
  expenseCategories: EXPENSE_CATEGORIES,
  lowBalanceThreshold: 7000, // משימות: יתרה נמוכה
  chronicDebtMonths: 3,      // משימות: חוב מתמשך (חודשים)
  categoryRules: DEFAULT_CATEGORY_RULES,             // כללי סיווג אוטומטי בקליטת עו"ש
  hiyuvitDepositNames: DEFAULT_HIYUVIT_DEPOSIT_NAMES, // שמות הפקדת חיובית בעו"ש
  levyDetectThreshold: 0.3,   // סף לזיהוי גבייה מיוחדת בחיובית (חלק מהלקוחות)
  levyConfirm: 'first_time',  // אישור שיוך לגבייה קיימת: first_time | always
  issueCategories: iss.DEFAULT_ISSUE_CATEGORIES, // קטגוריות פניות
  issueReminderDays: 3,       // תזכורת על פנייה שלא נענתה (0 = כבוי)
  managerBankNames: ['כהן ישי'] // איך העברה למנהל מופיעה בעו"ש (חשבון מנהל, אפיון 04 סעיף 7.5)
};

// טעינת בניין שמור: מעבר לסגירת חודש ולספר התנועות (פעם אחת), וצבע
function loadBuilding(b, idx) {
  const migrated = migrateBuildingLedger(migrateMonthClose({ ...b, color: getBuildingColor(b, idx) }, INITIAL_MONTH));
  return {
    ...migrated,
    specialLevies: (migrated.specialLevies || []).map(l => lv.migrateLevy(l, migrated)),
    issues: (migrated.issues || []).map(iss.migrateIssue)
  };
}

// טעינת כל הבניינים: מעבר מבנה + מספור רץ לפניות ישנות
function loadAll(list) {
  return iss.numberIssues(list.map(loadBuilding));
}

export function AppProvider({ children }) {
  // טעינה ראשונית מ-LocalStorage או מנתוני הבסיס
  const [buildings, setBuildings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return loadAll(parsed);
      }
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
    }
    return loadAll(INITIAL_BUILDINGS);
  });

  // הגדרות מערכת ואתר מרוכזות
  const [systemSettings, setSystemSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.managerName) {
          parsed.managerName = 'ישי לוי';
        }
        if (!parsed.phoneCalls) {
          parsed.phoneCalls = '052-7623803';
        }
        if (!parsed.phoneWhatsapp) {
          parsed.phoneWhatsapp = '055-6704029';
        }
        if (!parsed.companyEmail || parsed.companyEmail === 'office@bait-umnucha.co.il') {
          parsed.companyEmail = 'bm4923359@gmail.com';
        }
        if (!parsed.companyEmailSecondary) {
          parsed.companyEmailSecondary = '9926606@gmail.com';
        }
        if (!parsed.companyPhone || parsed.companyPhone === '02-555-1234') {
          parsed.companyPhone = 'שיחות: 052-7623803 | וואטסאפ: 055-6704029';
        }
        if (!parsed.phoneList || !Array.isArray(parsed.phoneList) || parsed.phoneList.length === 0) {
          parsed.phoneList = [
            { id: 'phone-1', number: parsed.phoneCalls || '052-7623803', label: 'לשיחות בלבד' },
            { id: 'phone-2', number: parsed.phoneWhatsapp || '055-6704029', label: 'וואטסאפ בלבד' }
          ];
        }
        if (!parsed.emailList || !Array.isArray(parsed.emailList) || parsed.emailList.length === 0) {
          parsed.emailList = [
            { id: 'email-1', email: parsed.companyEmail || 'bm4923359@gmail.com', label: 'ראשי' },
            { id: 'email-2', email: parsed.companyEmailSecondary || '9926606@gmail.com', label: 'משני' }
          ];
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage:", e);
    }
    return DEFAULT_SETTINGS;
  });

  const [selectedBuildingId, setSelectedBuildingId] = useState('all');
  // ניווט: טאב ראשי + תת-לשונית (כספים → תנועות/גביות, דוחות → דוחות/מכתבים)
  const [activeTab, setActiveTabState] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState(null);
  // תבנית מכתב לפתיחה מוכנה (למשל ממשימת "חוב מתמשך")
  const [letterPreset, setLetterPreset] = useState(null);
  const setActiveTab = (tab, subTab = null) => {
    setActiveTabState(tab);
    setActiveSubTab(subTab);
  };
  const [userRole, setUserRole] = useState('admin'); // 'admin' | 'rep'
  const [currentMonth, setCurrentMonth] = useState(INITIAL_MONTH);

  const [reportPresets, setReportPresets] = useState(() => {
    try {
      const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load report presets:", e);
    }
    return DEFAULT_PRESETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(reportPresets));
    } catch (e) {
      console.error("Failed to save report presets:", e);
    }
  }, [reportPresets]);

  // הגדרות תצוגה: טעינה, שמירה והחלה על <html>
  const [displaySettings, setDisplaySettings] = useState(() => {
    try {
      const saved = localStorage.getItem(DISPLAY_STORAGE_KEY);
      if (saved) return { ...DEFAULT_DISPLAY, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Failed to load display settings:", e);
    }
    return DEFAULT_DISPLAY;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${displaySettings.fontSize}px`;
    root.dataset.font = displaySettings.font;
    root.dataset.weight = displaySettings.weight;
    root.dataset.contrast = displaySettings.contrast;
    root.dataset.density = displaySettings.density;
    try {
      localStorage.setItem(DISPLAY_STORAGE_KEY, JSON.stringify(displaySettings));
    } catch (e) {
      console.error("Failed to save display settings:", e);
    }
  }, [displaySettings]);

  const updateDisplaySettings = (changes) => setDisplaySettings(prev => ({ ...prev, ...changes }));
  const resetDisplaySettings = () => setDisplaySettings(DEFAULT_DISPLAY);

  // שמירה אוטומטית של הגדרות
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(systemSettings));
    } catch (e) {
      console.error("Failed to save settings to localStorage:", e);
    }
  }, [systemSettings]);

  // שמירה אוטומטית ל-LocalStorage בכל שינוי
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buildings));
    } catch (e) {
      console.error("Failed to save state to localStorage:", e);
    }
  }, [buildings]);

  // הבניין הנבחר כעת (אם נבחר בניין ספציפי)
  const currentBuilding = buildings.find(b => b.id === selectedBuildingId) || null;

  // הוספת בניין חדש (16+)
  const addBuilding = (buildingData) => {
    const newId = `bld-${Date.now()}`;
    const nextColorIndex = buildings.length % BUILDING_COLOR_PALETTE.length;
    const assignedColor = buildingData.color || BUILDING_COLOR_PALETTE[nextColorIndex];
    const newBuilding = {
      id: newId,
      name: buildingData.name,
      address: buildingData.address || '',
      bankAccount: buildingData.bankAccount || '',
      hiyuvitCode: buildingData.hiyuvitCode || '',
      openingBalance: {
        bank: { amount: parseFloat(buildingData.initialBalance) || 0, date: null },
        cash: { amount: 0, date: null }
      },
      color: assignedColor,
      settings: {
        issuesEnabled: true,
        reportsViewEnabled: false,
        recurringExpenses: []
      },
      apartments: [],
      transactions: [],
      importBatches: [],
      auditLog: [],
      reportLog: [],
      specialLevies: [],
      issues: []
    };
    setBuildings(prev => [newBuilding, ...prev]);
    setSelectedBuildingId(newId);
    return newId;
  };

  // עדכון הגדרות בניין (כולל מתגי הרשאה לנציגים)
  const updateBuildingSettings = (buildingId, newSettings) => {
    setBuildings(prev => prev.map(b => {
      if (b.id === buildingId) {
        return {
          ...b,
          settings: { ...b.settings, ...newSettings }
        };
      }
      return b;
    }));
  };

  // עריכת פרטי בניין כלליים וצבע (היתרה מחושבת מהתנועות ואינה ניתנת לעריכה כאן)
  const updateBuilding = (buildingId, updatedData) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      const { currentBalance: _c, transactions: _t, openingBalance: _o, ...safeData } = updatedData;
      return {
        ...b,
        ...safeData,
        color: safeData.color || b.color
      };
    }));
  };

  // מחיקת בניין
  const deleteBuilding = (buildingId) => {
    setBuildings(prev => prev.filter(b => b.id !== buildingId));
    if (selectedBuildingId === buildingId) {
      setSelectedBuildingId('all');
    }
  };

  // הוספת דירה יחידה לבניין
  const addApartment = (buildingId, aptData) => {
    const newApt = {
      id: `apt-${Date.now()}`,
      aptNum: aptData.aptNum || '1',
      floor: aptData.floor || '',
      entrance: aptData.entrance || '',
      tenantName: aptData.tenantName || (aptData.unitType === 'commercial' ? '' : 'דייר חדש'),
      occupantType: aptData.occupantType || 'שוכר',
      phone: aptData.phone || '',
      email: aptData.email || '',
      monthlyDues: aptData.monthlyDues !== undefined ? parseFloat(aptData.monthlyDues) : (systemSettings.defaultMonthlyDues || 300),
      paymentMethod: aptData.paymentMethod || 'חיובית',
      parking: aptData.parking || '',
      notes: aptData.notes || '',
      debtMonths: [],
      ...unitFields(aptData)
    };
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      return {
        ...b,
        apartments: [...(b.apartments || []), newApt]
      };
    }));
    return newApt.id;
  };

  // עריכת דירה ודייר
  const updateApartment = (buildingId, aptId, updatedData) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      const updatedApts = (b.apartments || []).map(apt => {
        if (apt.id !== aptId) return apt;
        const merged = { ...apt, ...updatedData };
        return {
          ...merged,
          ...unitFields(merged),
          monthlyDues: updatedData.monthlyDues !== undefined ? parseFloat(updatedData.monthlyDues) || 0 : apt.monthlyDues
        };
      });
      return { ...b, apartments: updatedApts };
    }));
  };

  // מחיקת דירה
  const deleteApartment = (buildingId, aptId) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      return {
        ...b,
        apartments: (b.apartments || []).filter(apt => apt.id !== aptId)
      };
    }));
  };

  // קטגוריות הוצאה — הרשימה שבהגדרות, ותמיד "אחר" בסוף
  const customCategories = (systemSettings.expenseCategories || EXPENSE_CATEGORIES).filter(c => c && c !== OTHER_CATEGORY);
  const expenseCategories = [...customCategories, OTHER_CATEGORY];

  const addExpenseCategory = (name) => {
    const clean = (name || '').trim();
    if (!clean || clean === OTHER_CATEGORY || customCategories.includes(clean)) return false;
    setSystemSettings(prev => ({ ...prev, expenseCategories: [...customCategories, clean] }));
    return true;
  };

  const removeExpenseCategory = (name) => {
    setSystemSettings(prev => ({ ...prev, expenseCategories: customCategories.filter(c => c !== name) }));
  };

  // עדכון הגדרות מערכת
  const updateSystemSettings = (newSettings) => {
    setSystemSettings(prev => ({ ...prev, ...newSettings }));
  };

  // ------------------------------------------------------------------------
  // ספר תנועות (אפיון 04) — הלוגיקה עצמה ב-utils/ledgerOps
  // ------------------------------------------------------------------------
  const updateB = (buildingId, fn) => setBuildings(prev => prev.map(b => (b.id === buildingId ? fn(b) : b)));

  const recordManualReceipt = (buildingId, aptId, amount, paidMonths = [], notes = '', paymentType = 'מזומן', { date = '', reason = '' } = {}) =>
    updateB(buildingId, b => ops.recordReceipt(b, { aptId, amount, paidMonths, notes, paymentType, date, reason }));

  const recordCashExpense = (buildingId, category, amount, description, date = '', { reason = '', paidBy = 'cash' } = {}) =>
    updateB(buildingId, b => ops.recordExpense(b, { category, amount, description, date, reason, paidBy }));

  const updateTransaction = (buildingId, txId, changes, reason = '') => updateB(buildingId, b => ops.editTx(b, txId, changes, reason));
  const deleteTransaction = (buildingId, txId, reason) => updateB(buildingId, b => ops.deleteTx(b, txId, reason));
  const restoreTransaction = (buildingId, txId, reason = '') => updateB(buildingId, b => ops.restoreTx(b, txId, reason));
  const setOpeningBalance = (buildingId, account, amount, date) => updateB(buildingId, b => ops.setOpening(b, account, amount, date));
  const setCloseStep = (buildingId, month, stepId, value) => updateB(buildingId, b => ops.closeStep(b, month, stepId, value));
  const reopenMonth = (buildingId, month, reason = '') => updateB(buildingId, b => ops.reopenMonth(b, month, reason));
  const commitBankImport = (buildingId, plan, { reason = '' } = {}) => updateB(buildingId, b => ops.applyBankImport(b, plan, { reason }));
  const commitHiyuvitImport = (buildingId, plan, options = {}) => updateB(buildingId, b => ops.applyHiyuvitImport(b, plan, options));
  const resolvePendingCharges = (buildingId, batchId, groupKey, decision) => updateB(buildingId, b => ops.resolvePending(b, batchId, groupKey, decision));
  const undoImport = (buildingId, batchId, reason = '') => updateB(buildingId, b => ops.undoBatch(b, batchId, reason));
  const logReport = (buildingId, entry) => updateB(buildingId, b => ops.addReportLog(b, entry));

  // ייבוא דיירים לבניין בודד
  const importApartmentsForBuilding = (buildingId, aptList) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      const formatted = aptList.map((apt, idx) => ({
        id: `apt-${Date.now()}-${idx}`,
        aptNum: apt.aptNum,
        floor: apt.floor || '',
        entrance: apt.entrance || '',
        tenantName: apt.tenantName,
        occupantType: apt.occupantType || 'שוכר',
        phone: apt.phone || '',
        email: apt.email || '',
        monthlyDues: apt.monthlyDues || systemSettings.defaultMonthlyDues || 300,
        paymentMethod: apt.paymentMethod || 'חיובית',
        debtMonths: apt.debtMonths || [],
        ...unitFields(apt)
      }));
      return { ...b, apartments: formatted };
    }));
  };

  // ייבוא קובץ מאסטר מרובה לשוניות לכל הבניינים
  const importMasterSheets = (sheetsData) => {
    setBuildings(prev => prev.map(b => {
      const match = Object.keys(sheetsData).find(sheetName =>
        sheetName.includes(b.name) || b.name.includes(sheetName)
      );
      if (match && sheetsData[match]) {
        const formatted = sheetsData[match].map((apt, idx) => ({
          id: `apt-master-${Date.now()}-${idx}`,
          aptNum: apt.aptNum,
          tenantName: apt.tenantName,
          phone: apt.phone || '',
          email: apt.email || '',
          monthlyDues: apt.monthlyDues || 300,
          paymentMethod: apt.paymentMethod || 'חיובית',
          debtMonths: [],
          ...unitFields(apt)
        }));
        return { ...b, apartments: formatted };
      }
      return b;
    }));
  };

  // נוהל דיירים מתחלפים (סגירת חשבון ושמירת חוב על הדייר היוצא)
  const handleTenantTurnover = (buildingId, aptId, newTenantData, moveOutDate) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      const updatedApartments = (b.apartments || []).map(apt => {
        if (apt.id !== aptId) return apt;

        // תיעוד החוב של הדייר הקודם בהיסטוריה
        const prevDebtCount = apt.debtMonths ? apt.debtMonths.length : 0;
        const prevDebtTotal = prevDebtCount * apt.monthlyDues;

        return {
          ...apt,
          tenantName: newTenantData.tenantName,
          phone: newTenantData.phone || '',
          email: newTenantData.email || '',
          monthlyDues: newTenantData.monthlyDues || apt.monthlyDues,
          paymentMethod: newTenantData.paymentMethod || 'חיובית',
          debtMonths: [], // דף נקי לדייר הנכנס
          turnoverHistory: [
            ...(apt.turnoverHistory || []),
            {
              prevTenantName: apt.tenantName,
              moveOutDate: moveOutDate || new Date().toISOString().slice(0, 10),
              unpaidMonths: apt.debtMonths || [],
              debtBalance: prevDebtTotal
            }
          ]
        };
      });

      return { ...b, apartments: updatedApartments };
    }));
  };

  // גביות מיוחדות (אפיון 05) — הלוגיקה ב-utils/levies
  const addLevy = (buildingId, data) => updateB(buildingId, b => lv.addLevy(b, data));
  const updateLevy = (buildingId, levyId, data) => updateB(buildingId, b => lv.updateLevy(b, levyId, data));
  const setLevyStatus = (buildingId, levyId, status) => updateB(buildingId, b => lv.setLevyStatus(b, levyId, status));
  const setLevyPayment = (buildingId, levyId, unitId, month, status) => updateB(buildingId, b => lv.setLevyPayment(b, levyId, unitId, month, status));

  // פריסות חוב (אפיון 07) — הלוגיקה ב-utils/paymentPlans
  const [planDraft, setPlanDraft] = useState(null); // פריסה חדשה שנפתחת ממסך אחר (למשל מחוב של דירה)
  const addPaymentPlan = (buildingId, data) => updateB(buildingId, b => pp.addPlan(b, data));
  const setPlanInstallment = (buildingId, planId, n, changes) => updateB(buildingId, b => pp.setInstallment(b, planId, n, changes));
  const cancelPaymentPlan = (buildingId, planId) => updateB(buildingId, b => pp.cancelPlan(b, planId));

  // פניות (אפיון 02) — הלוגיקה ב-utils/issues
  const createIssue = (buildingId, data) => setBuildings(prev => {
    const number = iss.nextIssueNumber(prev);
    return prev.map(b => (b.id === buildingId ? iss.createIssue(b, { ...data, number }) : b));
  });
  const addIssueMessage = (buildingId, issueId, data) => updateB(buildingId, b => iss.addMessage(b, issueId, data));
  const editIssueMessage = (buildingId, issueId, messageId, text) => updateB(buildingId, b => iss.editMessage(b, issueId, messageId, text));
  const closeIssue = (buildingId, issueId, summary) => updateB(buildingId, b => iss.closeIssue(b, issueId, summary));
  const reopenIssue = (buildingId, issueId) => updateB(buildingId, b => iss.reopenIssue(b, issueId));
  const setIssueInProgress = (buildingId, issueId, value) => updateB(buildingId, b => iss.setInProgress(b, issueId, value));
  const setIssueFields = (buildingId, issueId, fields) => updateB(buildingId, b => iss.setIssueFields(b, issueId, fields));
  // רישום הוצאה מפנייה: מזומן — הוצאה בספר התנועות + קישור; העברה — רק הערה (סעיף 7.9)
  const linkIssueExpense = (buildingId, issueId, { method, amount, category, description, date, reason = '' }) => updateB(buildingId, b => {
    if (method !== 'cash') return iss.linkExpense(b, issueId, { method, amount });
    const withTx = ops.recordExpense(b, { category, amount, description, date, reason });
    const txId = withTx.transactions[0].id;
    const linked = { ...withTx, transactions: withTx.transactions.map(t => (t.id === txId ? { ...t, issueId } : t)) };
    return iss.linkExpense(linked, issueId, { method, amount, txId });
  });

  // שמירת מצב דוח חדש (Preset)
  const savePreset = (presetData) => {
    const newPreset = {
      id: `pre-${Date.now()}`,
      name: presetData.name,
      reportType: presetData.reportType || 'expenses',
      includeLevies: !!presetData.includeLevies,
      entrance: presetData.entrance || 'all'
    };
    setReportPresets(prev => [...prev, newPreset]);
  };

  const deletePreset = (presetId) => {
    setReportPresets(prev => prev.filter(p => p.id !== presetId));
  };

  // הורדת גיבוי נתונים מלא (מענה ישיר לחשש הלקוח)
  const exportFullBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(buildings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `גיבוי_מלא_בית_ומנוחה_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // שחזור גיבוי
  const importFullBackup = (jsonData) => {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (Array.isArray(parsed)) {
        setBuildings(loadAll(parsed));
        alert("הנתונים שוחזרו בהצלחה!");
      }
    } catch {
      alert("שגיאה בפענוח קובץ הגיבוי");
    }
  };

  const value = {
    buildings,
    selectedBuildingId,
    setSelectedBuildingId,
    currentBuilding,
    activeTab,
    setActiveTab,
    activeSubTab,
    setActiveSubTab,
    letterPreset,
    setLetterPreset,
    userRole,
    setUserRole,
    currentMonth,
    setCurrentMonth,
    reportPresets,
    addBuilding,
    updateBuildingSettings,
    recordManualReceipt,
    recordCashExpense,
    updateTransaction,
    deleteTransaction,
    restoreTransaction,
    setOpeningBalance,
    commitBankImport,
    commitHiyuvitImport,
    resolvePendingCharges,
    undoImport,
    logReport,
    importApartmentsForBuilding,
    importMasterSheets,
    handleTenantTurnover,
    planDraft,
    setPlanDraft,
    addPaymentPlan,
    setPlanInstallment,
    cancelPaymentPlan,
    addLevy,
    updateLevy,
    setLevyStatus,
    setLevyPayment,
    createIssue,
    addIssueMessage,
    editIssueMessage,
    closeIssue,
    reopenIssue,
    setIssueInProgress,
    setIssueFields,
    linkIssueExpense,
    savePreset,
    deletePreset,
    exportFullBackup,
    importFullBackup,
    systemSettings,
    updateSystemSettings,
    setCloseStep,
    reopenMonth,
    expenseCategories,
    addExpenseCategory,
    removeExpenseCategory,
    displaySettings,
    updateDisplaySettings,
    resetDisplaySettings,
    updateBuilding,
    deleteBuilding,
    addApartment,
    updateApartment,
    deleteApartment
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
