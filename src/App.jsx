// ==========================================================================
// בית ומנוחה - אפליקציית ניהול ועד בית ואחזקת מבנים
// ==========================================================================
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import BuildingSidebar from './components/BuildingSidebar';
import MasterDashboard from './components/MasterDashboard';
import FinancialsView from './components/FinancialsView';
import ReportsHub from './components/ReportsHub';
import NoticesHub from './components/NoticesHub';
import ApartmentRegistry from './components/ApartmentRegistry';
import IssuesTracker from './components/IssuesTracker';
import AddBuildingModal from './components/AddBuildingModal';
import SettingsView from './components/SettingsView';

function MainApp() {
  const { activeTab } = useApp();
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'finance':
        return <FinancialsView />;
      case 'tenants':
        return <ApartmentRegistry />;
      case 'issues':
        return <IssuesTracker />;
      case 'reports':
        return <ReportsHub />;
      case 'notices':
        return <NoticesHub />;
      case 'settings':
        return <SettingsView onOpenAddBuilding={() => setIsAddBuildingOpen(true)} />;
      case 'dashboard':
      default:
        return <MasterDashboard />;
    }
  };

  return (
    <div className={`app-shell${activeTab === 'settings' ? ' is-settings' : ''}`}>
      <Navbar />

      <div className="app-body">
        {activeTab !== 'settings' && <BuildingSidebar />}
        <div className="app-main">
          <main>
            {renderActiveView()}
          </main>
        </div>
      </div>

      <AddBuildingModal
        isOpen={isAddBuildingOpen}
        onClose={() => setIsAddBuildingOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
