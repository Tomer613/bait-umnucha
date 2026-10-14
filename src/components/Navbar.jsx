// ==========================================================================
// בית ומנוחה - סרגל ניווט עליון יוקרתי עם שורת בניין פעיל וחותמת צבע
// ==========================================================================
import React from 'react';
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
          שורה 2: שורת "בניין פעיל כעת" + הדרופליסט הראשי המרכזי
          *** נמצאת ישירות מעל שורת הלשוניות "דשבורד בניינים"! ***
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
          gap: 12
        }}>
          {/* צד ימין: תווית בניין פעיל, הדרופליסט, חותמת צבע ופרטים */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: '1 1 auto' }}>
            
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: currentBuilding ? activeColor.tagBg : 'var(--color-gold-100)',
              color: currentBuilding ? activeColor.text : 'var(--color-gold-700)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 800,
              fontSize: '0.86rem',
              border: `1px solid ${activeColor.border}`,
              whiteSpace: 'nowrap'
            }}>
              <Building2 size={16} color={activeColor.primary} />
              <span>בניין פעיל כעת:</span>
            </div>

            {/* הדרופליסט המרכזי היחיד של הבניינים */}
            <div style={{ position: 'relative', minWidth: 260, maxWidth: 380 }}>
              <select
                value={selectedBuildingId}
                onChange={(e) => {
                  setSelectedBuildingId(e.target.value);
                }}
                className="select"
                style={{
                  fontWeight: 700,
                  fontSize: '0.94rem',
                  borderColor: activeColor.primary,
                  background: '#FFFFFF',
                  boxShadow: currentBuilding ? `0 0 0 2px ${activeColor.border}` : 'var(--shadow-sm)',
                  paddingLeft: 32,
                  paddingRight: 14,
                  cursor: 'pointer'
                }}
              >
                <option value="all">🏢 כלל 15 הבניינים (דשבורד ראשי)</option>
                <optgroup label="בניינים מנוהלים:">
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.address}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* תגיות הבניין הפעיל + חותמת צבע */}
            {currentBuilding ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {/* עיגול חותמת צבע */}
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
                  title={`חותמת צבע הבניין: ${activeColor.name || ''}`}
                />

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
              <span style={{ fontSize: '0.83rem', color: 'var(--color-brown-600)', fontWeight: 600 }}>
                מרכז שליטה מרוכז לכלל {buildings.length} הבניינים
              </span>
            )}
          </div>

          {/* צד שמאל: כפתור חזרה לכלל הבניינים */}
          {currentBuilding && (
            <button
              onClick={() => {
                setSelectedBuildingId('all');
                setActiveTab('dashboard');
              }}
              className="btn btn-secondary btn-sm"
              style={{
                background: '#FFFFFF',
                border: `1px solid ${activeColor.border}`,
                color: 'var(--color-brown-800)',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600
              }}
            >
              <X size={15} color="var(--color-danger)" />
              <span>חזרה לכל 15 הבניינים</span>
            </button>
          )}
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
