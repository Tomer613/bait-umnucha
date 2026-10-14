// ==========================================================================
// בית ומנוחה - בורר בניין בסרגל העליון ("כלל הבניינים" + רשימת בניינים עם חיפוש)
// ==========================================================================
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { BuildingDot } from './ui';
import { formatILS } from '../utils/format';

export default function BuildingSelectDropdown({ buildings = [], selectedBuildingId, onSelectBuilding }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const isAll = selectedBuildingId === 'all';
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const q = searchTerm.trim().toLowerCase();
  const filteredBuildings = buildings.filter(b =>
    !q || b.name.toLowerCase().includes(q) || (b.address || '').toLowerCase().includes(q)
  );

  const choose = (id) => {
    onSelectBuilding(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={dropdownRef} className="bpicker">
      <button
        type="button"
        className="bpicker-trigger"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(prev => !prev)}
      >
        {isAll ? <span className="dot dot-lg dot-all" /> : <BuildingDot color={selectedBuilding?.color} large />}
        <span className="bpicker-label">
          <span className="bpicker-name">{isAll ? 'כלל הבניינים' : selectedBuilding?.name}</span>
          <span className="bpicker-meta">
            {isAll
              ? `${buildings.length} בניינים מנוהלים`
              : `${selectedBuilding?.apartments?.length || 0} דירות · יתרה ${formatILS(selectedBuilding?.currentBalance)}`}
          </span>
        </span>
        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {isOpen && (
        <div className="bpicker-panel">
          <div className="bpicker-search">
            <Search size={15} color="var(--ink-400)" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם או כתובת..."
            />
          </div>

          <div className="bpicker-list">
            {!q && (
              <>
                <button type="button" className={`bpicker-item${isAll ? ' is-selected' : ''}`} onClick={() => choose('all')}>
                  <span className="dot dot-lg dot-all" />
                  <span style={{ flex: 1 }}>
                    <span className="bpicker-item-name">כלל הבניינים</span>
                    <span className="bpicker-item-meta" style={{ display: 'block' }}>מבט-על על {buildings.length} הבניינים</span>
                  </span>
                  {isAll && <Check size={16} color="var(--petrol-600)" />}
                </button>
                <div className="bpicker-divider" />
              </>
            )}

            {filteredBuildings.length === 0 ? (
              <div className="bpicker-empty">לא נמצא בניין התואם את החיפוש</div>
            ) : (
              filteredBuildings.map(b => {
                const isSelected = b.id === selectedBuildingId;
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={`bpicker-item${isSelected ? ' is-selected' : ''}`}
                    onClick={() => choose(b.id)}
                  >
                    <BuildingDot color={b.color} large />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="bpicker-item-name">{b.name}</span>
                      <span className="bpicker-item-meta" style={{ display: 'block' }}>{b.address || 'ללא כתובת'}</span>
                    </span>
                    {isSelected && <Check size={16} color="var(--petrol-600)" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
