// ==========================================================================
// בית ומנוחה - אפליקציית ניהול ועד בית ואחזקת מבנים
// ==========================================================================
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import MasterDashboard from './components/MasterDashboard';
import FinancialsView from './components/FinancialsView';
import ReportsHub from './components/ReportsHub';
import ApartmentRegistry from './components/ApartmentRegistry';
import IssuesTracker from './components/IssuesTracker';
import AddBuildingModal from './components/AddBuildingModal';
import SettingsView from './components/SettingsView';

function MainApp() {
  const { activeTab, systemSettings } = useApp();
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
      case 'settings':
        return <SettingsView onOpenAddBuilding={() => setIsAddBuildingOpen(true)} />;
      case 'dashboard':
      default:
        return <MasterDashboard />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {renderActiveView()}
      </main>

      <footer className="app-footer no-print">
        <strong>{systemSettings?.companyName || 'בית ומנוחה'}</strong> · ניהול ועד בית ואחזקת מבנים
      </footer>

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
