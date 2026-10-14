// ==========================================================================
// בית ומנוחה - מנהל מצב מרכזי עם שמירה אוטומטית מקומית (LocalStorage)
// ==========================================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_BUILDINGS, EXPENSE_CATEGORIES, LETTER_TEMPLATES, BUILDING_COLOR_PALETTE, getBuildingColor } from '../data/initialData';

const AppContext = createContext(null);

const STORAGE_KEY = 'bait_umnucha_state_v1';
const SETTINGS_STORAGE_KEY = 'bait_umnucha_settings_v1';

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
  enableIssuesModule: true
};

export function AppProvider({ children }) {
  // טעינה ראשונית מ-LocalStorage או מנתוני הבסיס
  const [buildings, setBuildings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((b, idx) => ({
          ...b,
          color: getBuildingColor(b, idx)
        }));
      }
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
    }
    return INITIAL_BUILDINGS;
  });

  // הגדרות מערכת ואתר מרוכזות
  const [systemSettings, setSystemSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.managerName || parsed.managerName === 'תומר לוי') {
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('admin'); // 'admin' | 'rep'
  const [currentMonth, setCurrentMonth] = useState('2026-09');

  const [reportPresets, setReportPresets] = useState([
    { id: 'pre-1', name: 'דוח אמצע חודש', funds: ['current'], scope: 'all', viewType: 'unified' },
    { id: 'pre-2', name: 'דוח קופות גבייה מיוחד', funds: ['current', 'special'], scope: 'all', viewType: 'separate' },
    { id: 'pre-3', name: 'דוח חצי בניין (כניסה א)', funds: ['current'], scope: 'half', viewType: 'unified' }
  ]);

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
      currentBalance: parseFloat(buildingData.initialBalance) || 0,
      statusMonthUpdated: false,
      color: assignedColor,
      settings: {
        issuesEnabled: true,
        reportsViewEnabled: false,
        recurringExpenses: []
      },
      apartments: [],
      expenses: [],
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

  // עריכת פרטי בניין כלליים וצבע (יתרת קופה מוגנת ואינה ניתנת לעריכה ידנית)
  const updateBuilding = (buildingId, updatedData) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      const { currentBalance: _, ...safeData } = updatedData;
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
      tenantName: aptData.tenantName || 'דייר חדש',
      occupantType: aptData.occupantType || 'שוכר',
      phone: aptData.phone || '',
      email: aptData.email || '',
      monthlyDues: aptData.monthlyDues !== undefined ? parseFloat(aptData.monthlyDues) : (systemSettings.defaultMonthlyDues || 300),
      paymentMethod: aptData.paymentMethod || 'חיובית',
      parking: aptData.parking || '',
      notes: aptData.notes || '',
      debtMonths: []
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
        return {
          ...apt,
          ...updatedData,
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

  // עדכון הגדרות מערכת
  const updateSystemSettings = (newSettings) => {
    setSystemSettings(prev => ({ ...prev, ...newSettings }));
  };

  // הזנת תקבול ידני חכם (מזומן או העברה ישירה) עם סגירת חודשי חוב
  const recordManualReceipt = (buildingId, aptId, amount, paidMonths = [], notes = '', paymentType = 'מזומן') => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;

      const numAmount = parseFloat(amount) || 0;
      const updatedApartments = (b.apartments || []).map(apt => {
        if (apt.id !== aptId) return apt;
        // הסרת החודשים ששולמו מרשימת החוב
        const updatedDebtMonths = (apt.debtMonths || []).filter(m => !paidMonths.includes(m));
        return {
          ...apt,
          debtMonths: updatedDebtMonths
        };
      });

      // הוספת תנועה ליתרת הבניין
      const newBalance = (b.currentBalance || 0) + numAmount;

      return {
        ...b,
        currentBalance: newBalance,
        apartments: updatedApartments,
        expenses: [
          {
            id: `rec-in-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            month: currentMonth,
            category: "תקבול ישיר",
            amount: -numAmount, // סכום שלילי להוצאה = הכנסה
            description: `תקבול ${paymentType} מדירה (סגירת חודשים: ${paidMonths.join(', ') || 'שוטף'})${notes ? ' - ' + notes : ''}`,
            source: paymentType
          },
          ...(b.expenses || [])
        ]
      };
    }));
  };

  // הזנת הוצאת מזומן ידנית
  const recordCashExpense = (buildingId, category, amount, description, date = '') => {
    const numAmount = parseFloat(amount) || 0;
    const expDate = date || new Date().toISOString().slice(0, 10);
    const expMonth = expDate.slice(0, 7);

    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      return {
        ...b,
        currentBalance: (b.currentBalance || 0) - numAmount,
        expenses: [
          {
            id: `cash-out-${Date.now()}`,
            date: expDate,
            month: expMonth,
            category: category || "תחזוקה שוטפת והוצאות חריגות",
            amount: numAmount,
            description: description || "הוצאה ידנית במזומן",
            source: "מזומן"
          },
          ...(b.expenses || [])
        ]
      };
    }));
  };

  // קליטת תנועות מקובץ עו"ש בנק
  const ingestBankReport = (buildingId, parsedTransactions) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      let balanceDiff = 0;
      const newExpenses = parsedTransactions.map(tx => {
        if (tx.type === 'expense') {
          balanceDiff -= tx.amount;
        } else {
          balanceDiff += tx.amount;
        }
        return {
          id: tx.id,
          date: tx.date || new Date().toISOString().slice(0, 10),
          month: currentMonth,
          category: tx.category,
          amount: tx.type === 'expense' ? tx.amount : -tx.amount,
          description: tx.description,
          source: "בנק"
        };
      });

      return {
        ...b,
        statusMonthUpdated: true,
        currentBalance: (b.currentBalance || 0) + balanceDiff,
        expenses: [...newExpenses, ...(b.expenses || [])]
      };
    }));
  };

  // קליטת תנועות מקובץ חיובית
  const ingestHiyuvitReport = (buildingId, parsedTransactions) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      let totalCollected = 0;
      let totalFees = 0;

      parsedTransactions.forEach(tx => {
        if (tx.isSuccess) {
          totalCollected += tx.net;
          totalFees += tx.fee;
        }
      });

      const feeExpense = totalFees > 0 ? [{
        id: `hiyuvit-fee-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        month: currentMonth,
        category: "עמלות סליקה",
        amount: totalFees,
        description: `עמלות סליקה חברת חיובית (${parsedTransactions.length} תנועות)`,
        source: "חיובית"
      }] : [];

      return {
        ...b,
        statusMonthUpdated: true,
        currentBalance: (b.currentBalance || 0) + totalCollected,
        expenses: [...feeExpense, ...(b.expenses || [])]
      };
    }));
  };

  // ייבוא דיירים לבניין בודד
  const importApartmentsForBuilding = (buildingId, aptList) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      const formatted = aptList.map((apt, idx) => ({
        id: `apt-${Date.now()}-${idx}`,
        aptNum: apt.aptNum,
        tenantName: apt.tenantName,
        phone: apt.phone || '',
        email: apt.email || '',
        monthlyDues: apt.monthlyDues || 300,
        paymentMethod: apt.paymentMethod || 'חיובית',
        debtMonths: apt.debtMonths || []
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
          debtMonths: []
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

  // הוספת גבייה מיוחדת (תיקון צנרת / חשמל)
  const addSpecialLevy = (buildingId, levyData) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      const newLevy = {
        id: `levy-${Date.now()}`,
        title: levyData.title,
        totalAmount: parseFloat(levyData.totalAmount) || 0,
        amountPerApt: parseFloat(levyData.amountPerApt) || 0,
        createdAt: new Date().toISOString().slice(0, 10),
        status: "פעיל",
        paidApartmentIds: []
      };
      return {
        ...b,
        specialLevies: [newLevy, ...(b.specialLevies || [])]
      };
    }));
  };

  // סימון תשלום עבור גבייה מיוחדת
  const toggleLevyPayment = (buildingId, levyId, aptId) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      const updatedLevies = (b.specialLevies || []).map(l => {
        if (l.id !== levyId) return l;
        const isPaid = (l.paidApartmentIds || []).includes(aptId);
        const newPaidIds = isPaid
          ? l.paidApartmentIds.filter(id => id !== aptId)
          : [...(l.paidApartmentIds || []), aptId];
        return { ...l, paidApartmentIds: newPaidIds };
      });
      return { ...b, specialLevies: updatedLevies };
    }));
  };

  // פניות (Issues)
  const addIssue = (buildingId, title, author, initialComment) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      const newIssue = {
        id: `iss-${Date.now()}`,
        title,
        author,
        createdAt: new Date().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }),
        status: 'open',
        comments: [
          {
            id: `comm-${Date.now()}`,
            author,
            text: initialComment,
            time: new Date().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })
          }
        ]
      };
      return {
        ...b,
        issues: [newIssue, ...(b.issues || [])]
      };
    }));
  };

  const addIssueComment = (buildingId, issueId, author, text) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      const updatedIssues = (b.issues || []).map(iss => {
        if (iss.id !== issueId) return iss;
        return {
          ...iss,
          comments: [
            ...iss.comments,
            {
              id: `comm-${Date.now()}`,
              author,
              text,
              time: new Date().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })
            }
          ]
        };
      });
      return { ...b, issues: updatedIssues };
    }));
  };

  const toggleIssueStatus = (buildingId, issueId) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      const updatedIssues = (b.issues || []).map(iss => {
        if (iss.id !== issueId) return iss;
        return {
          ...iss,
          status: iss.status === 'open' ? 'closed' : 'open'
        };
      });
      return { ...b, issues: updatedIssues };
    }));
  };

  // שמירת מצב דוח חדש (Preset)
  const savePreset = (presetData) => {
    const newPreset = {
      id: `pre-${Date.now()}`,
      name: presetData.name,
      funds: presetData.funds || ['current'],
      scope: presetData.scope || 'all',
      viewType: presetData.viewType || 'unified'
    };
    setReportPresets(prev => [...prev, newPreset]);
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
        setBuildings(parsed);
        alert("הנתונים שוחזרו בהצלחה!");
      }
    } catch (e) {
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
    userRole,
    setUserRole,
    currentMonth,
    setCurrentMonth,
    reportPresets,
    addBuilding,
    updateBuildingSettings,
    recordManualReceipt,
    recordCashExpense,
    ingestBankReport,
    ingestHiyuvitReport,
    importApartmentsForBuilding,
    importMasterSheets,
    handleTenantTurnover,
    addSpecialLevy,
    toggleLevyPayment,
    addIssue,
    addIssueComment,
    toggleIssueStatus,
    savePreset,
    exportFullBackup,
    importFullBackup,
    systemSettings,
    updateSystemSettings,
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
