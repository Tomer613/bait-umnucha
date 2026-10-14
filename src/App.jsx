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
      default:
        return <MasterDashboard onOpenAddBuilding={() => setIsAddBuildingOpen(true)} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-cream-bg)' }}>
      <Navbar onOpenAddBuilding={() => setIsAddBuildingOpen(true)} />
      
      {/* סרגל הקשר ברור לבניין הנבחר - מוצג בכל הלשוניות כשנבחר בניין ספציפי */}
      {currentBuilding && selectedBuildingId !== 'all' && (
        <div style={{
          background: 'linear-gradient(90deg, #FBF8F1 0%, #FFFFFF 100%)',
          borderBottom: '1px solid var(--color-gold-300)',
          boxShadow: '0 2px 8px rgba(184, 142, 62, 0.08)',
          position: 'sticky',
          top: 105,
          zIndex: 90
        }}>
          <div style={{
            maxWidth: 1300,
            margin: '0 auto',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 6,
                background: 'var(--color-gold-100)', 
                color: 'var(--color-gold-700)', 
                padding: '4px 10px', 
                borderRadius: 'var(--radius-full)', 
                fontWeight: 700, 
                fontSize: '0.82rem' 
              }}>
                <Building2 size={14} />
                בניין פעיל כעת
              </span>

              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                {currentBuilding.name}
              </span>
              <span style={{ color: 'var(--color-brown-500)', fontSize: '0.88rem' }}>
                ({currentBuilding.address})
              </span>

              <span style={{
                background: '#FFFFFF',
                border: '1px solid var(--color-beige-border)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--color-brown-800)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <Wallet size={13} color="var(--color-gold-500)" />
                יתרת קופה: {(currentBuilding.currentBalance || 0).toLocaleString('he-IL')} ₪
              </span>

              <span style={{
                background: '#FFFFFF',
                border: '1px solid var(--color-beige-border)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--color-brown-700)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <Users size={13} color="var(--color-brown-500)" />
                {currentBuilding.apartments?.length || 0} דירות
              </span>
            </div>

            <button
              onClick={() => {
                setSelectedBuildingId('all');
                setActiveTab('dashboard');
              }}
              className="btn btn-secondary btn-sm"
              style={{
                border: '1px solid var(--color-gold-300)',
                background: '#FFFFFF',
                color: 'var(--color-brown-800)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <X size={15} color="var(--color-danger)" />
              <span>חזרה למבט כל 15 הבניינים</span>
            </button>
          </div>
        </div>
      )}

      <main style={{ flex: 1, paddingBottom: 60 }}>
        {renderActiveView()}
      </main>

      <footer style={{
        background: '#FFFFFF',
        borderTop: '1px solid var(--color-beige-border)',
        padding: '16px 20px',
        textAlign: 'center',
        color: 'var(--color-brown-500)',
        fontSize: '0.82rem'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, color: 'var(--color-brown-800)' }}>בית ומנוחה</span>
          <span>—</span>
          <span>ניהול ועד בית ואחזקת מבנים</span>
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
