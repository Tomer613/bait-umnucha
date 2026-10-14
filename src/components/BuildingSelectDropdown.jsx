// ==========================================================================
// בית ומנוחה - דרופדאון בחירת בניין יוקרתי עם חותמות צבע ו-Hover מותאם אישית
// ==========================================================================
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Building2 } from 'lucide-react';

export default function BuildingSelectDropdown({
  buildings = [],
  selectedBuildingId,
  onSelectBuilding,
  activeColor
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const dropdownRef = useRef(null);

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId) || buildings[0];

  // סגירה בלחיצה מחוץ לתפריט או במקש Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // סינון מהיר אם המשתמש מחפש
  const filteredBuildings = buildings.filter(b => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return b.name.toLowerCase().includes(q) || (b.address && b.address.toLowerCase().includes(q));
  });

  return (
    <div ref={dropdownRef} style={{ position: 'relative', minWidth: 280, maxWidth: 390, flex: '1 1 auto' }}>
      
      {/* --------------------------------------------------------------------
          כפתור הפתיחה הראשי (Trigger Button)
          -------------------------------------------------------------------- */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '8px 14px',
          background: '#FFFFFF',
          border: `1.5px solid ${selectedBuilding?.color?.primary || activeColor?.primary || 'var(--color-border-bold)'}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: isOpen 
            ? `0 0 0 3px ${selectedBuilding?.color?.border || 'rgba(197, 155, 39, 0.25)'}` 
            : 'var(--shadow-xs)',
          cursor: 'pointer',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          textAlign: 'right'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          {/* עיגול חותמת הצבע של הבניין הפעיל כעת */}
          <span 
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: selectedBuilding?.color?.primary || 'var(--color-gold-500)',
              border: '2px solid #FFFFFF',
              boxShadow: `0 0 0 1px ${selectedBuilding?.color?.border || 'rgba(0,0,0,0.1)'}, 0 2px 4px rgba(0,0,0,0.12)`,
              flexShrink: 0
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textAlign: 'right' }}>
            <span style={{ 
              fontWeight: 800, 
              fontSize: '0.94rem', 
              color: 'var(--color-slate-900)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {selectedBuilding?.name}
            </span>
            <span style={{ 
              fontSize: '0.78rem', 
              color: 'var(--color-slate-500)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {selectedBuilding?.address}
            </span>
          </div>
        </div>

        {/* חץ פתיחה מסתובב */}
        <ChevronDown 
          size={18} 
          color={selectedBuilding?.color?.primary || 'var(--color-slate-600)'} 
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0
          }}
        />
      </button>

      {/* --------------------------------------------------------------------
          הפאנל הנפתח עם חותמות צבע, ריחוף בצבע הבניין ותגית צבע
          -------------------------------------------------------------------- */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          left: 0,
          minWidth: 320,
          background: '#FFFFFF',
          border: '1.5px solid var(--color-border-bold)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(15, 23, 42, 0.04)',
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          
          {/* שורת חיפוש מהירה בתוך הרשימה */}
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--color-border-card)',
            background: 'var(--color-slate-50)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Search size={15} color="var(--color-slate-400)" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="סינון מהיר לפי שם או כתובת..."
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                color: 'var(--color-slate-800)'
              }}
            />
          </div>

          {/* רשימת הבניינים */}
          <div style={{ maxHeight: 330, overflowY: 'auto', padding: '4px 0' }}>
            {filteredBuildings.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-slate-500)', fontSize: '0.85rem' }}>
                לא נמצא בניין התואם את החיפוש
              </div>
            ) : (
              filteredBuildings.map(b => {
                const isSelected = b.id === selectedBuildingId;
                const isHovered = hoveredId === b.id;
                const bColor = b.color || { primary: 'var(--color-gold-500)', tint: 'var(--color-gold-50)', name: 'פעיל' };

                return (
                  <div
                    key={b.id}
                    onMouseEnter={() => setHoveredId(b.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => {
                      onSelectBuilding(b.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      // כאן מתרחש הקסם: הרקע נצבע בצבע הבניין בעת hovering או כשהוא נבחר!
                      background: isHovered 
                        ? (bColor.tint || 'var(--color-gold-50)') 
                        : (isSelected ? (bColor.tint || 'var(--color-gold-50)') : '#FFFFFF'),
                      borderRight: `4px solid ${isHovered || isSelected ? bColor.primary : 'transparent'}`,
                      borderBottom: '1px solid var(--color-border-subtle)',
                      transition: 'all 0.14s ease'
                    }}
                  >
                    {/* צד ימין: עיגול צבע + שם וכתובת */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span 
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: bColor.primary,
                          border: '2px solid #FFFFFF',
                          boxShadow: `0 0 0 1px ${bColor.border || 'rgba(0,0,0,0.1)'}, 0 1px 3px rgba(0,0,0,0.15)`,
                          flexShrink: 0,
                          transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                          transition: 'transform 0.15s ease'
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: isSelected ? 800 : 700, 
                          fontSize: '0.92rem', 
                          color: isHovered || isSelected ? 'var(--color-slate-900)' : 'var(--color-slate-800)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {b.name}
                        </div>
                        <div style={{ 
                          fontSize: '0.78rem', 
                          color: isHovered ? bColor.primary : 'var(--color-slate-500)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {b.address}
                        </div>
                      </div>
                    </div>

                    {/* צד שמאל: תגית צבע + סימון V אם נבחר */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {/* תגית שם הצבע */}
                      <span 
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: bColor.tagBg || 'var(--color-slate-100)',
                          color: bColor.text || bColor.primary,
                          border: `1px solid ${bColor.border || 'var(--color-border-card)'}`
                        }}
                      >
                        {bColor.name}
                      </span>

                      {/* אייקון V לבניין הנבחר */}
                      {isSelected && (
                        <Check size={16} color={bColor.primary} strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

    </div>
  );
}
