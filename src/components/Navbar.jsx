// ==========================================================================
// בית ומנוחה - סרגל ניווט עליון יוקרתי
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Download, 
  PlusCircle, 
  UserCheck, 
  ShieldAlert, 
  Calendar,
  Layers,
  FileSpreadsheet,
  Send,
  Users,
  Wrench,
  MessageSquare
} from 'lucide-react';

export default function Navbar({ onOpenAddBuilding }) {
  const { 
    buildings, 
    selectedBuildingId, 
    setSelectedBuildingId, 
    currentBuilding,
    activeTab, 
    setActiveTab,
    userRole, 
    setUserRole,
    currentMonth,
    setCurrentMonth,
    exportFullBackup
  } = useApp();

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid var(--color-beige-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Top Brand Bar */}
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

        {/* Building Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 300px', maxWidth: 420 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <select
              value={selectedBuildingId}
              onChange={(e) => {
                setSelectedBuildingId(e.target.value);
                if (e.target.value === 'all') {
                  setActiveTab('dashboard');
                }
              }}
              className="select"
              style={{
                paddingLeft: 36,
                fontWeight: 600,
                borderColor: selectedBuildingId !== 'all' ? 'var(--color-gold-500)' : 'var(--color-beige-border)',
                background: selectedBuildingId !== 'all' ? 'var(--color-gold-50)' : '#FFFFFF'
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

          <button
            onClick={onOpenAddBuilding}
            className="btn btn-secondary btn-sm"
            title="הוספת בניין חדש"
            style={{ flexShrink: 0 }}
          >
            <PlusCircle size={17} color="var(--color-gold-600)" />
            <span>בניין חדש</span>
          </button>
        </div>

        {/* Global Controls & Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Backup Button (Direct answer to client worry) */}
          <button
            onClick={exportFullBackup}
            className="btn btn-secondary btn-sm"
            title="גיבוי נתונים מלא למחשב"
            style={{ color: 'var(--color-brown-700)' }}
          >
            <Download size={15} />
            <span>גיבוי מלא</span>
          </button>

          {/* User Mode Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: userRole === 'admin' ? 'var(--color-gold-100)' : 'var(--color-cream-subtle)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-gold-200)',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--color-brown-900)'
          }}>
            <UserCheck size={14} color="var(--color-gold-600)" />
            <span>מנהל מערכת</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div style={{
        background: 'var(--color-gold-50)',
        borderTop: '1px solid var(--color-beige-border)',
        overflowX: 'auto'
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
            style={navTabStyle(activeTab === 'dashboard')}
          >
            <Building2 size={16} />
            <span>דשבורד בניינים</span>
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            style={navTabStyle(activeTab === 'financials')}
          >
            <Layers size={16} />
            <span>קליטת כספים ותנועות</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            style={navTabStyle(activeTab === 'reports')}
          >
            <FileSpreadsheet size={16} />
            <span>מחולל דוחות ואקסל</span>
          </button>

          <button
            onClick={() => setActiveTab('letters')}
            style={navTabStyle(activeTab === 'letters')}
          >
            <Send size={16} />
            <span>אשף מכתבים וג'ימייל</span>
          </button>

          <button
            onClick={() => setActiveTab('apartments')}
            style={navTabStyle(activeTab === 'apartments')}
          >
            <Users size={16} />
            <span>דירות ודיירים מתחלפים</span>
          </button>

          <button
            onClick={() => setActiveTab('levies')}
            style={navTabStyle(activeTab === 'levies')}
          >
            <Wrench size={16} />
            <span>גבייה מיוחדת (צנרת/חשמל)</span>
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            style={navTabStyle(activeTab === 'issues')}
          >
            <MessageSquare size={16} />
            <span>פניות ותקלות ועד</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function navTabStyle(isActive) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: isActive ? '3px solid var(--color-gold-500)' : '3px solid transparent',
    color: isActive ? 'var(--color-gold-700)' : 'var(--color-brown-600)',
    fontWeight: isActive ? 700 : 500,
    fontSize: '0.92rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  };
}
