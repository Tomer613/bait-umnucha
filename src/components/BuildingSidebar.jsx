// ==========================================================================
// בית ומנוחה - תפריט צד לבחירת בניין
// במסך רחב: קבוע לצד התוכן, וניתן לכווץ לפס צר של שלטים בלבד (הבחירה נשמרת).
// במסך צר: מגירה שנפתחת מפס הבניין שמתחת לניווט.
// ליד כל בניין מסומן אם יש חוב פתוח או קליטה שממתינה.
// ==========================================================================
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, X, Check, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { BuildingAvatar, AllBuildingsAvatar } from './ui';
import { buildingDebt, formatILS, sumBy } from '../utils/format';

const COLLAPSE_KEY = 'bait_umnucha_sidebar_collapsed';

export default function BuildingSidebar() {
  const { buildings, selectedBuildingId, setSelectedBuildingId, activeTab, setActiveTab } = useApp();
  const [isOpen, setIsOpen] = useState(false);       // מגירה במסך צר
  const [hint, setHint] = useState('');
  const [attention, setAttention] = useState(false); // הבהוב כשפעולה מבקשת בחירת בניין
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef(null);

  // כיווץ לפס צר במסך רחב — נשמר בדפדפן
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      // הדפדפן חוסם שמירה — הכיווץ פשוט לא יישמר
    }
  }, [collapsed]);

  // פתיחה מבחוץ: כפתור ☰ או פעולה שדורשת בניין מסוים
  useEffect(() => {
    const onRequest = (e) => {
      setHint(e.detail?.message || '');
      // המגירה רלוונטית רק במסך צר; במסך רחב התפריט כבר גלוי ורק מודגש
      if (window.matchMedia('(max-width: 1100px)').matches) setIsOpen(true);
      if (e.detail?.message) {
        setCollapsed(false); // כשפעולה מבקשת בחירת בניין — פותחים את התפריט המלא
        setAttention(true);
        setTimeout(() => setAttention(false), 1600);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    };
    window.addEventListener('bpicker:open', onRequest);
    return () => window.removeEventListener('bpicker:open', onRequest);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const choose = (id) => {
    setSelectedBuildingId(id);
    if (activeTab === 'settings') setActiveTab('dashboard');
    setIsOpen(false);
    setHint('');
    setSearchTerm('');
  };

  const q = searchTerm.trim().toLowerCase();
  const filtered = buildings.filter(b => !q || b.name.toLowerCase().includes(q) || (b.address || '').toLowerCase().includes(q));
  const totalApts = sumBy(buildings, b => b.apartments?.length || 0);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar no-print${isOpen ? ' is-open' : ''}${attention ? ' is-attention' : ''}${collapsed ? ' is-collapsed' : ''}`} aria-label="בחירת בניין">
        <div className="sidebar-head">
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <span className="sidebar-title">בניינים <span className="sidebar-count">{buildings.length}</span></span>
            <button
              type="button"
              className="sidebar-collapse"
              onClick={() => setCollapsed(c => !c)}
              aria-label={collapsed ? 'הרחבת תפריט הבניינים' : 'כיווץ תפריט הבניינים'}
              title={collapsed ? 'הרחבת התפריט' : 'כיווץ התפריט'}
            >
              {collapsed ? <PanelRightOpen size={19} /> : <PanelRightClose size={19} />}
            </button>
            <button type="button" className="modal-close sidebar-close" onClick={() => setIsOpen(false)} aria-label="סגירת תפריט הבניינים">
              <X size={20} />
            </button>
          </div>
          <div className="search-box" style={{ maxWidth: 'none', flex: '0 0 auto' }}>
            <Search size={16} />
            <input
              ref={searchRef}
              type="text"
              className="input input-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש בניין..."
              aria-label="חיפוש בניין"
            />
          </div>
        </div>

        {hint && <div className="sidebar-hint">{hint}</div>}

        <nav className="sidebar-list">
          {!q && (
            <button
              type="button"
              className={`sb-item${selectedBuildingId === 'all' ? ' is-selected' : ''}`}
              onClick={() => choose('all')}
              title="כלל הבניינים"
            >
              <AllBuildingsAvatar />
              <span className="sb-text">
                <span className="sb-name">כלל הבניינים</span>
                <span className="sb-meta">{totalApts} דירות · מבט-על</span>
              </span>
              {selectedBuildingId === 'all' && <Check size={16} className="sb-check" />}
            </button>
          )}

          {filtered.length === 0 && <div className="bpicker-empty">לא נמצא בניין התואם את החיפוש</div>}

          {filtered.map(b => {
            const isSelected = b.id === selectedBuildingId;
            const debt = buildingDebt(b);
            return (
              <button
                key={b.id}
                type="button"
                className={`sb-item${isSelected ? ' is-selected' : ''}`}
                style={{ '--sb-color': b.color?.primary }}
                onClick={() => choose(b.id)}
                title={b.name}
              >
                <BuildingAvatar name={b.name} color={b.color} />
                <span className="sb-text">
                  <span className="sb-name">{b.name}</span>
                  <span className="sb-meta">{b.apartments?.length || 0} דירות · {formatILS(b.currentBalance)}</span>
                </span>
                <span className="sb-marks">
                  {debt > 0 && <span className="sb-mark sb-mark--debt" title={`חוב פתוח: ${formatILS(debt)}`} />}
                  {!b.statusMonthUpdated && <span className="sb-mark sb-mark--pending" title="ממתין לקליטת קובצי החודש" />}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-legend">
          <span><span className="sb-mark sb-mark--debt" /> חוב פתוח</span>
          <span><span className="sb-mark sb-mark--pending" /> ממתין לקליטה</span>
        </div>
      </aside>
    </>
  );
}
