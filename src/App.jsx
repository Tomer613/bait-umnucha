// ==========================================================================
// בית ומנוחה - אפליקציית ניהול ועד בית ואחזקת מבנים
// ==========================================================================
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import MasterDashboard from './components/MasterDashboard';
import FinancialsView from './components/FinancialsView';
import ReportGenerator from './components/ReportGenerator';
import LetterWizard from './components/LetterWizard';
import ApartmentRegistry from './components/ApartmentRegistry';
import SpecialLevies from './components/SpecialLevies';
import IssuesTracker from './components/IssuesTracker';
import AddBuildingModal from './components/AddBuildingModal';
import SettingsView from './components/SettingsView';
import { Building2, X, Wallet, Users, ChevronLeft, ArrowRight } from 'lucide-react';

function MainApp() {
  const { activeTab, setActiveTab, selectedBuildingId, setSelectedBuildingId, currentBuilding } = useApp();
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <MasterDashboard onOpenAddBuilding={() => setIsAddBuildingOpen(true)} />;
      case 'financials':
        return <FinancialsView />;
      case 'reports':
        return <ReportGenerator />;
      case 'letters':
        return <LetterWizard />;
      case 'apartments':
        return <ApartmentRegistry />;
      case 'levies':
        return <SpecialLevies />;
      case 'issues':
        return <IssuesTracker />;
      case 'settings':
        return <SettingsView onOpenAddBuilding={() => setIsAddBuildingOpen(true)} />;
      default:
        return <MasterDashboard onOpenAddBuilding={() => setIsAddBuildingOpen(true)} />;
    }
  };

  const activeColor = currentBuilding?.color;
  const isSettings = activeTab === 'settings';

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: isSettings ? '#ECE7DE' : 'var(--color-cream-bg)',
      backgroundImage: isSettings 
        ? 'repeating-linear-gradient(-45deg, rgba(175, 158, 138, 0.22) 0px, rgba(175, 158, 138, 0.22) 1.5px, transparent 1.5px, transparent 14px)'
        : 'none',
      transition: 'background-color 0.3s ease'
    }}>
      <Navbar onOpenAddBuilding={() => setIsAddBuildingOpen(true)} />

      <main style={{ 
        flex: 1, 
        paddingBottom: 60,
        background: isSettings 
          ? 'transparent' 
          : (activeColor 
              ? `linear-gradient(180deg, ${activeColor.tint} 0%, var(--color-cream-bg) 280px)` 
              : 'var(--color-cream-bg)'),
        transition: 'background 0.35s ease'
      }}>
        {renderActiveView()}
      </main>

      <footer style={{
        background: isSettings ? '#FAF7F2' : '#FFFFFF',
        borderTop: isSettings ? '1.5px solid #DDD6C8' : '1px solid var(--color-beige-border)',
        padding: '16px 20px',
        textAlign: 'center',
        color: isSettings ? 'var(--color-brown-600)' : 'var(--color-brown-500)',
        fontSize: '0.82rem',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, color: isSettings ? 'var(--color-gold-700)' : 'var(--color-brown-800)' }}>בית ומנוחה</span>
          <span>—</span>
          <span>ניהול ועד בית ואחזקת מבנים</span>
          {isSettings && (
            <>
              <span>•</span>
              <span style={{ color: 'var(--color-gold-700)', fontWeight: 700 }}>אזור הגדרות ועריכת מערכת</span>
            </>
          )}
        </div>
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
