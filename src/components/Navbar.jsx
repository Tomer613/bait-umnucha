// ==========================================================================
// בית ומנוחה - סרגל עליון: מותג, בורר בניין, הגדרות וניווט ראשי (5 אזורים)
// ==========================================================================
import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Wallet, Users, MessageSquare, FileText, Settings, ArrowRight } from 'lucide-react';
import BuildingSelectDropdown from './BuildingSelectDropdown';
import { openIssuesCount, sumBy } from '../utils/format';

const NAV_TABS = [
  { id: 'dashboard', label: 'סקירה', icon: LayoutDashboard },
  { id: 'finance', label: 'כספים', icon: Wallet },
  { id: 'tenants', label: 'דירות ודיירים', icon: Users },
  { id: 'issues', label: 'פניות', icon: MessageSquare },
  { id: 'reports', label: 'דוחות ומכתבים', icon: FileText }
];

export default function Navbar() {
  const {
    buildings,
    selectedBuildingId,
    setSelectedBuildingId,
    currentBuilding,
    activeTab,
    setActiveTab,
    systemSettings
  } = useApp();

  const isSettings = activeTab === 'settings';
  const managerName = systemSettings?.managerName || 'מנהל המערכת';
  const openIssues = currentBuilding ? openIssuesCount(currentBuilding) : sumBy(buildings, openIssuesCount);

  return (
    <header className="topbar no-print">
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

        {!isSettings && (
          <BuildingSelectDropdown
            buildings={buildings}
            selectedBuildingId={selectedBuildingId}
            onSelectBuilding={setSelectedBuildingId}
          />
        )}

        <div className="topbar-spacer" />

        <div className="user-chip">
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

      <nav className="mainnav" aria-label="ניווט ראשי">
        <div className="mainnav-inner">
          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`mainnav-tab${activeTab === tab.id ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={17} />
              <span>{tab.label}</span>
              {tab.id === 'issues' && openIssues > 0 && <span className="count">{openIssues}</span>}
            </button>
          ))}
        </div>
      </nav>

      <div
        className="building-strip"
        style={{ background: currentBuilding && !isSettings ? currentBuilding.color?.primary : 'var(--gold-500)' }}
      />
    </header>
  );
}
