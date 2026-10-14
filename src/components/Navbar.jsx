// ==========================================================================
// בית ומנוחה - סרגל ניווט עליון יוקרתי עם שורת בניין פעיל וחותמת צבע
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Download, 
  PlusCircle, 
  UserCheck, 
  Layers, 
  FileSpreadsheet, 
  Send, 
  Users, 
  Wrench, 
  MessageSquare,
  Wallet,
  Settings,
  X
} from 'lucide-react';
import BuildingSelectDropdown from './BuildingSelectDropdown';

export default function Navbar({ onOpenAddBuilding }) {
  const { 
    buildings, 
    selectedBuildingId, 
    setSelectedBuildingId, 
    currentBuilding,
    activeTab, 
    setActiveTab,
    systemSettings,
    exportFullBackup
  } = useApp();

  const [lastSpecificId, setLastSpecificId] = useState(buildings[0]?.id || '');

  const activeColor = currentBuilding?.color || {
    primary: 'var(--color-gold-500)',
    tint: 'var(--color-gold-50)',
    border: 'var(--color-beige-border)',
    tagBg: 'var(--color-gold-100)',
    text: 'var(--color-gold-700)'
  };

  const isSettings = activeTab === 'settings';

  return (
    <header style={{
      background: isSettings ? '#FAF7F2' : '#FFFFFF',
      borderBottom: isSettings ? '2px solid var(--color-gold-500)' : '1px solid var(--color-beige-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: isSettings ? '0 2px 12px rgba(197, 155, 39, 0.12)' : 'var(--shadow-sm)',
      transition: 'all 0.3s ease'
    }}>
      
      {/* --------------------------------------------------------------------
          שורה 1: סרגל מותג ופעולות על (לוגו, גיבוי, בניין חדש, תגית מנהל)
          -------------------------------------------------------------------- */}
      <div style={{
        maxWidth: 1300,
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand & Logo */}
        <div 
          onClick={() => { setSelectedBuildingId('all'); setActiveTab('dashboard'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
        >
          <img 
            src="/logo.png" 
            alt="בית ומנוחה" 
            style={{ 
              height: 48, 
              width: 'auto', 
              objectFit: 'contain',
              borderRadius: 'var(--radius-sm)'
            }} 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <h1 style={{ 
              fontSize: '1.45rem', 
              fontWeight: 800, 
              color: 'var(--color-brown-900)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              transition: 'color 0.3s ease'
            }}>
              בית ומנוחה
            </h1>
            <p style={{ 
              fontSize: '0.82rem', 
              color: 'var(--color-gold-600)', 
              fontWeight: 600 
            }}>
              ניהול ועד בית ואחזקת מבנים
            </p>
          </div>
        </div>

        {/* Global Action Controls - מרכז הגדרות ועריכה מרוכז */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setActiveTab('settings')}
            className="btn btn-secondary btn-sm"
            title="מרכז הגדרות ועריכת מערכת"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 16px',
              borderRadius: 'var(--radius-md)',
              border: isSettings ? '1.5px solid var(--color-gold-600)' : '1.5px solid var(--color-border-card)',
              background: isSettings ? 'var(--color-gold-500)' : '#FFFFFF',
              color: isSettings ? '#FFFFFF' : 'var(--color-slate-800)',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: isSettings ? '0 2px 10px rgba(197, 155, 39, 0.35)' : 'var(--shadow-xs)',
              transition: 'all 0.2s ease'
            }}
          >
            <Settings size={16} />
            <span>הגדרות ועריכה</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: isSettings ? '#FFFFFF' : 'var(--color-cream-subtle)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            border: isSettings ? '1px solid #DDD6C8' : '1px solid var(--color-beige-border)',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--color-brown-900)',
            transition: 'all 0.3s ease'
          }}>
            <UserCheck size={14} color="var(--color-gold-500)" />
            <span>{systemSettings?.managerName || 'ישי לוי'} — מנהל מערכת</span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          שורות 2 ו-3: שורת בחירת בניין ושורת לשוניות ניווט שוטפות
          *** מוצגות רק בעבודה השוטפת, ומוסתרות לחלוטין במסך הגדרות ועריכה! ***
          -------------------------------------------------------------------- */}
      {activeTab !== 'settings' && (
        <>
          {/* שורה 2: שורת מצב ומעבר - סוויץ' בין "כלל הבניינים" לבין "בניין מסוים" */}
          <div style={{
            background: currentBuilding ? `linear-gradient(90deg, ${activeColor.tint} 0%, #FFFFFF 100%)` : 'linear-gradient(90deg, #FBF8F3 0%, #FFFFFF 100%)',
            borderTop: '1px solid var(--color-beige-border)',
            borderBottom: `2px solid ${activeColor.border}`,
            transition: 'all 0.3s ease'
          }}>
        <div style={{
          maxWidth: 1300,
          margin: '0 auto',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14
        }}>
          {/* צד ימין: סוויץ' ראשי + דרופליסט (כשפעיל) + פרטים */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', flex: '1 1 auto' }}>
            
            {/* הסוויץ' האלגנטי למעבר בין "כלל הבניינים" ל"בניין מסוים" */}
            <div style={{
              display: 'inline-flex',
              background: '#FFFFFF',
              padding: 4,
              borderRadius: 'var(--radius-full)',
              border: '1.5px solid var(--color-border-bold)',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedBuildingId('all');
                }}
                style={{
                  border: 'none',
                  background: selectedBuildingId === 'all' ? 'var(--color-slate-900)' : 'transparent',
                  color: selectedBuildingId === 'all' ? '#FFFFFF' : 'var(--color-slate-700)',
                  padding: '7px 18px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: selectedBuildingId === 'all' ? '0 2px 6px rgba(15, 23, 42, 0.3)' : 'none'
                }}
              >
                <Building2 size={14} />
                <span>כלל הבניינים</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedBuildingId === 'all') {
                    const targetId = lastSpecificId || buildings[0]?.id || '';
                    setSelectedBuildingId(targetId);
                  }
                }}
                style={{
                  border: 'none',
                  background: selectedBuildingId !== 'all' ? (activeColor.primary) : 'transparent',
                  color: selectedBuildingId !== 'all' ? '#FFFFFF' : 'var(--color-slate-700)',
                  padding: '7px 18px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: selectedBuildingId !== 'all' ? '0 2px 6px rgba(0, 0, 0, 0.2)' : 'none'
                }}
              >
                <Building2 size={14} />
                <span>בניין מסוים</span>
              </button>
            </div>

            {/* כאשר הסוויץ' על "בניין מסוים" - מופיע הדרופליסט המעוצב עם חותמות צבע ו-Hover מותאם אישית */}
            {selectedBuildingId !== 'all' && currentBuilding ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <BuildingSelectDropdown
                  buildings={buildings}
                  selectedBuildingId={selectedBuildingId}
                  onSelectBuilding={(newId) => {
                    setSelectedBuildingId(newId);
                    setLastSpecificId(newId);
                  }}
                  activeColor={activeColor}
                />

                {/* יתרת קופה */}
                <span style={{
                  background: activeColor.tagBg,
                  color: activeColor.text,
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  border: `1.5px solid ${activeColor.border}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: 'var(--shadow-xs)'
                }}>
                  <Wallet size={14} />
                  <span>יתרת קופה: {(currentBuilding.currentBalance || 0).toLocaleString('he-IL')} ₪</span>
                </span>

                {/* דירות */}
                <span style={{
                  background: '#FFFFFF',
                  border: `1.5px solid ${activeColor.border}`,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--color-slate-700)',
                  boxShadow: 'var(--shadow-xs)'
                }}>
                  {currentBuilding.apartments?.length || 0} דירות
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.86rem', color: 'var(--color-brown-600)', fontWeight: 600 }}>
                מרכז שליטה מרוכז לכלל {buildings.length} הבניינים המנוהלים
              </span>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          שורה 3: שורת לשוניות הניווט (מתחת לשורת הבניין הפעיל!)
          -------------------------------------------------------------------- */}
      <div style={{
        background: '#FFFFFF',
        borderTop: '1px solid var(--color-border-card)',
        borderBottom: '1px solid var(--color-border-card)',
        overflowX: 'auto',
        transition: 'background 0.3s ease'
      }}>
        <div style={{
          maxWidth: 1300,
          margin: '0 auto',
          padding: '4px 20px',
          display: 'flex',
          gap: 8
        }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={navTabStyle(activeTab === 'dashboard', activeColor)}
          >
            <Building2 size={16} />
            <span>דשבורד בניינים</span>
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            style={navTabStyle(activeTab === 'financials', activeColor)}
          >
            <Layers size={16} />
            <span>קליטת כספים ותנועות</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            style={navTabStyle(activeTab === 'reports', activeColor)}
          >
            <FileSpreadsheet size={16} />
            <span>מחולל דוחות ואקסל</span>
          </button>

          <button
            onClick={() => setActiveTab('letters')}
            style={navTabStyle(activeTab === 'letters', activeColor)}
          >
            <Send size={16} />
            <span>אשף מכתבים וג'ימייל</span>
          </button>

          <button
            onClick={() => setActiveTab('apartments')}
            style={navTabStyle(activeTab === 'apartments', activeColor)}
          >
            <Users size={16} />
            <span>דירות ודיירים מתחלפים</span>
          </button>

          <button
            onClick={() => setActiveTab('levies')}
            style={navTabStyle(activeTab === 'levies', activeColor)}
          >
            <Wrench size={16} />
            <span>גבייה מיוחדת (צנרת/חשמל)</span>
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            style={navTabStyle(activeTab === 'issues', activeColor)}
          >
            <MessageSquare size={16} />
            <span>פניות ותקלות ועד</span>
          </button>
        </div>
      </div>
    </>
  )}

    </header>
  );
}

function navTabStyle(isActive, activeColor) {
  return {
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    margin: '6px 0',
    background: isActive ? (activeColor?.tint || 'var(--color-gold-100)') : '#FFFFFF',
    border: `1.5px solid ${isActive ? (activeColor?.primary || 'var(--color-gold-500)') : 'var(--color-border-card)'}`,
    borderRadius: 'var(--radius-md)',
    color: isActive ? (activeColor?.primary || 'var(--color-gold-800)') : 'var(--color-slate-700)',
    fontWeight: 600, // גופן אחיד לחלוטין וללא שינוי משקל בין כפתור פעיל ללא פעיל!
    fontSize: '0.91rem',
    cursor: 'pointer',
    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
    whiteSpace: 'nowrap',
    boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'var(--shadow-xs)'
  };
}
