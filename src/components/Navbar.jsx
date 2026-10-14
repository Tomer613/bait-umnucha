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
  X
} from 'lucide-react';

export default function Navbar({ onOpenAddBuilding }) {
  const { 
    buildings, 
    selectedBuildingId, 
    setSelectedBuildingId, 
    currentBuilding,
    activeTab, 
    setActiveTab,
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

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid var(--color-beige-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
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
              letterSpacing: '-0.02em'
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

        {/* Global Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onOpenAddBuilding}
            className="btn btn-primary btn-sm"
            title="הקמת בניין חדש במערכת"
          >
            <PlusCircle size={16} />
            <span>בניין חדש</span>
          </button>

          <button
            onClick={exportFullBackup}
            className="btn btn-secondary btn-sm"
            title="גיבוי נתונים מלא למחשב"
            style={{ color: 'var(--color-brown-700)' }}
          >
            <Download size={15} />
            <span>גיבוי מלא</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--color-cream-subtle)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-beige-border)',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--color-brown-900)'
          }}>
            <UserCheck size={14} color="var(--color-gold-600)" />
            <span>מנהל מערכת</span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          שורה 2: שורת מצב ומעבר - סוויץ' בין "כלל הבניינים" לבין "בניין מסוים"
          *** הדרופליסט מופיע אך ורק כאשר הסוויץ' על "בניין מסוים"! ***
          -------------------------------------------------------------------- */}
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
              padding: 3,
              borderRadius: 'var(--radius-full)',
              border: `1.5px solid ${currentBuilding ? activeColor.border : 'var(--color-gold-300)'}`,
              boxShadow: 'var(--shadow-sm)'
            }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedBuildingId('all');
                }}
                style={{
                  border: 'none',
                  background: selectedBuildingId === 'all' ? 'var(--color-brown-900)' : 'transparent',
                  color: selectedBuildingId === 'all' ? '#FFFFFF' : 'var(--color-brown-700)',
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s'
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
                  color: selectedBuildingId !== 'all' ? '#FFFFFF' : 'var(--color-brown-700)',
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s'
                }}
              >
                <Building2 size={14} />
                <span>בניין מסוים</span>
              </button>
            </div>

            {/* כאשר הסוויץ' על "בניין מסוים" - מופיע הדרופליסט הנקי (רק בניינים, בלי "כל הבניינים") */}
            {selectedBuildingId !== 'all' && currentBuilding ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', minWidth: 260, maxWidth: 380 }}>
                  <select
                    value={selectedBuildingId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedBuildingId(newId);
                      setLastSpecificId(newId);
                    }}
                    className="select"
                    style={{
                      fontWeight: 700,
                      fontSize: '0.94rem',
                      borderColor: activeColor.primary,
                      background: '#FFFFFF',
                      boxShadow: `0 0 0 2px ${activeColor.border}`,
                      paddingLeft: 30,
                      paddingRight: 12,
                      cursor: 'pointer'
                    }}
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} — {b.address}
                      </option>
                    ))}
                  </select>
                </div>

                {/* חותמת צבע של הבניין הנבחר */}
                <span 
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: activeColor.primary,
                    border: '2px solid #FFFFFF',
                    boxShadow: `0 0 0 1px ${activeColor.border}, 0 2px 4px rgba(0,0,0,0.15)`,
                    display: 'inline-block'
                  }} 
                  title={`חותמת צבע: ${activeColor.name || ''}`}
                />

                {/* יתרת קופה */}
                <span style={{
                  background: activeColor.tagBg,
                  color: activeColor.text,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.83rem',
                  fontWeight: 800,
                  border: `1px solid ${activeColor.border}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Wallet size={13} />
                  יתרת קופה: {(currentBuilding.currentBalance || 0).toLocaleString('he-IL')} ₪
                </span>

                {/* דירות */}
                <span style={{
                  background: '#FFFFFF',
                  border: `1px solid ${activeColor.border}`,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--color-brown-700)'
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
        background: currentBuilding ? activeColor.tint : 'var(--color-gold-50)',
        borderTop: '1px solid rgba(0,0,0,0.04)',
        overflowX: 'auto',
        transition: 'background 0.3s ease'
      }}>
        <div style={{
          maxWidth: 1300,
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          gap: 6
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

    </header>
  );
}

function navTabStyle(isActive, activeColor) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: isActive ? `3px solid ${activeColor.primary}` : '3px solid transparent',
    color: isActive ? activeColor.primary : 'var(--color-brown-700)',
    fontWeight: isActive ? 800 : 500,
    fontSize: '0.92rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  };
}
