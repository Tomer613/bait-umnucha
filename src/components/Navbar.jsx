// ==========================================================================
// בית ומנוחה - סרגל עליון: שורת מותג, שורת הניווט הראשי (6 אזורים),
// ובמסך צר — פס הבניין הנבחר שפותח את תפריט הבניינים
// ==========================================================================
import React from 'react';
import { useApp } from '../context/AppContext';
import { ListChecks, Wallet, Users, MessageSquare, FileText, Mail, Settings, ChevronDown, ArrowRight } from 'lucide-react';
import { BuildingAvatar, AllBuildingsAvatar } from './ui';
import { openIssuesCount, sumBy, requestBuildingPick } from '../utils/format';
import { computeTasks, countTaskItems, DEFAULT_LOW_BALANCE, DEFAULT_CHRONIC_MONTHS } from '../utils/tasks';

const NAV_TABS = [
  { id: 'dashboard', label: 'משימות', icon: ListChecks },
  { id: 'finance', label: 'כספים', icon: Wallet },
  { id: 'tenants', label: 'דירות ודיירים', icon: Users },
  { id: 'issues', label: 'פניות', icon: MessageSquare },
  { id: 'reports', label: 'דוחות', icon: FileText },
  { id: 'notices', label: 'מודעות ומכתבים', icon: Mail }
];

export default function Navbar() {
  const {
    buildings,
    setSelectedBuildingId,
    currentBuilding,
    activeTab,
    setActiveTab,
    systemSettings,
    currentMonth
  } = useApp();

  const isSettings = activeTab === 'settings';
  const managerName = systemSettings?.managerName || 'מנהל המערכת';
  const openIssues = currentBuilding ? openIssuesCount(currentBuilding) : sumBy(buildings, openIssuesCount);
  const taskCount = countTaskItems(computeTasks(currentBuilding ? [currentBuilding] : buildings, {
    currentMonth,
    lowBalance: Number(systemSettings?.lowBalanceThreshold) || DEFAULT_LOW_BALANCE,
    chronicMonths: Number(systemSettings?.chronicDebtMonths) || DEFAULT_CHRONIC_MONTHS,
    reminderDays: Number(systemSettings?.issueReminderDays ?? 3)
  }));
  const tabCounts = { dashboard: taskCount, issues: openIssues };

  return (
    <div className="app-header no-print">
      <header className="topbar">
        {/* שורה 1: מותג, משתמש והגדרות */}
        <div className="topbar-inner">
          <button
            type="button"
            className="brand"
            onClick={() => { setSelectedBuildingId('all'); setActiveTab('dashboard'); }}
            title="חזרה לסקירת כלל הבניינים"
          >
            <img src="/logo.png" alt="" className="brand-logo" onError={(e) => { e.target.style.display = 'none'; }} />
            <span>
              <span className="brand-name">{systemSettings?.companyName || 'בית ומנוחה'}</span>
              <span className="brand-tagline">ניהול ועד בית ואחזקת מבנים</span>
            </span>
          </button>

          <div className="topbar-end">
            <div className="user-chip" title={managerName}>
              <span className="user-avatar">{managerName.trim().charAt(0)}</span>
              <span>{managerName}</span>
            </div>
            <button
              type="button"
              className={`icon-btn-dark${isSettings ? ' is-active' : ''}`}
              onClick={() => setActiveTab(isSettings ? 'dashboard' : 'settings')}
              title={isSettings ? 'חזרה למערכת' : 'הגדרות מערכת ובניינים'}
            >
              {isSettings ? <ArrowRight size={16} /> : <Settings size={16} />}
              <span>{isSettings ? 'חזרה למערכת' : 'הגדרות'}</span>
            </button>
          </div>
        </div>

        {/* שורה 2: ניווט ראשי — לא מוצג במסך ההגדרות */}
        {!isSettings && (
        <nav className="mainnav" aria-label="ניווט ראשי">
          <div className="mainnav-inner">
            {NAV_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`mainnav-tab${activeTab === tab.id ? ' is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
                {tabCounts[tab.id] > 0 && <span className="count">{tabCounts[tab.id]}</span>}
              </button>
            ))}
          </div>
        </nav>
        )}

        {/* מסך צר: פס הבניין הנבחר מתחת לניווט — פותח את תפריט הבניינים */}
        {!isSettings && (
        <button
          type="button"
          className="building-bar"
          onClick={() => requestBuildingPick('')}
          aria-label="החלפת בניין"
        >
          {currentBuilding ? <BuildingAvatar name={currentBuilding.name} color={currentBuilding.color} size="sm" /> : <AllBuildingsAvatar size="sm" />}
          <span className="building-bar-name">{currentBuilding ? currentBuilding.name : 'כלל הבניינים'}</span>
          <span className="building-bar-action">החלפת בניין <ChevronDown size={16} /></span>
        </button>
        )}
      </header>

      <div
        className="building-strip"
        style={{ background: currentBuilding && !isSettings ? currentBuilding.color?.primary : 'var(--gold-500)' }}
      />
    </div>
  );
}
