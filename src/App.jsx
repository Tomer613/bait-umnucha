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

function MainApp() {
  const { activeTab } = useApp();
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
      default:
        return <MasterDashboard onOpenAddBuilding={() => setIsAddBuildingOpen(true)} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-cream-bg)' }}>
      <Navbar onOpenAddBuilding={() => setIsAddBuildingOpen(true)} />
      
      <main style={{ flex: 1, paddingBottom: 60 }}>
        {renderActiveView()}
      </main>

      <footer style={{
        background: '#FFFFFF',
        borderTop: '1px solid var(--color-beige-border)',
        padding: '24px 20px',
        textAlign: 'center',
        color: 'var(--color-brown-600)',
        fontSize: '0.85rem'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, color: 'var(--color-brown-900)' }}>בית ומנוחה</span>
            <span>—</span>
            <span>ניהול ועד בית ואחזקת מבנים</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>🔒 גיבוי נתונים מקומי מאובטח</span>
            <span>•</span>
            <span>📱 תואם מחשב וטאבלט אנדרואיד</span>
            <span>•</span>
            <span style={{ color: 'var(--color-gold-600)', fontWeight: 600 }}>0 ש״ח עלויות שרת</span>
          </div>
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
