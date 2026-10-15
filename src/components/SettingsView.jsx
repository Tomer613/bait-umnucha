// ==========================================================================
// בית ומנוחה - מרכז ההגדרות
// תפריט צד מקובץ לפי תחום (אפיון 08). כל שינוי נשמר מיד, ו"נשמר" מוצג ליד כותרת העמוד.
// ==========================================================================
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from './ui';
import BuildingsSettings from './BuildingsSettings';
import CompanySettings from './CompanySettings';
import ExpenseCategoriesSettings from './ExpenseCategoriesSettings';
import ImportSettings from './ImportSettings';
import AlertSettings from './AlertSettings';
import NoticeFormatSettings from './NoticeFormatSettings';
import NoticeLibrarySettings from './NoticeLibrarySettings';
import IssueSettings from './IssueSettings';
import ReportPresetsSettings from './ReportPresetsSettings';
import DisplaySettings from './DisplaySettings';
import BackupSettings from './BackupSettings';
import {
  Building2, Building, Tags, FileUp, BellRing, FileText, MessageSquare, Bookmark, Eye, ShieldCheck, CheckCircle2
} from 'lucide-react';

const GROUPS = [
  {
    label: 'ארגון',
    pages: [
      { id: 'buildings', label: 'בניינים', icon: Building2, sub: 'הבניינים המנוהלים וברירות מחדל לבניין חדש' },
      { id: 'company', label: 'פרטי החברה', icon: Building, sub: 'שם, מנהל, טלפונים ומיילים שמופיעים במודעות ובדוחות' }
    ]
  },
  {
    label: 'כספים',
    pages: [
      { id: 'categories', label: 'קטגוריות הוצאה', icon: Tags, sub: 'הקטגוריות וכללי הסיווג האוטומטי שמפנים אליהן' },
      { id: 'import', label: 'קליטת עו״ש וחיובית', icon: FileUp, sub: 'איך המערכת מזהה תנועות בקבצים שנקלטים' },
      { id: 'alerts', label: 'התראות', icon: BellRing, sub: 'מתי מסך המשימות מתריע על יתרה וחובות' }
    ]
  },
  {
    label: 'תקשורת',
    pages: [
      { id: 'notices', label: 'מודעות ומכתבים', icon: FileText, sub: 'תאריך, פתיח, חתימה ותבניות' },
      { id: 'issues', label: 'פניות', icon: MessageSquare, sub: 'קטגוריות פניות ותזכורות' },
      { id: 'reports', label: 'דוחות', icon: Bookmark, sub: 'מצבי דוח שמורים' }
    ]
  },
  {
    label: 'מערכת',
    pages: [
      { id: 'display', label: 'תצוגה ונוחות קריאה', icon: Eye, sub: 'גודל טקסט, גופן וניגודיות. חל רק על המחשב הזה', wide: true },
      { id: 'backup', label: 'גיבוי ושחזור', icon: ShieldCheck, sub: 'הורדת כל הנתונים לקובץ ושחזור מקובץ' }
    ]
  }
];
const PAGES = GROUPS.flatMap(g => g.pages);
// קישורים ישנים ממסכים אחרים
const LEGACY_IDS = { preferences: 'company' };

export default function SettingsView({ onOpenAddBuilding }) {
  const { activeSubTab, systemSettings, displaySettings } = useApp();
  const resolve = (id) => {
    const clean = LEGACY_IDS[id] || id;
    return PAGES.some(p => p.id === clean) ? clean : 'buildings';
  };
  const [pageId, setPageId] = useState(() => resolve(activeSubTab));
  const page = PAGES.find(p => p.id === pageId);

  // חיווי "נשמר" אחרי כל שינוי בהגדרות
  const [saved, setSaved] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1800);
    return () => clearTimeout(t);
  }, [systemSettings, displaySettings]);

  const go = (id) => { setPageId(id); setSaved(false); window.scrollTo({ top: 0 }); };

  return (
    <div className="page">
      <PageHeader title="הגדרות" subtitle="כל שינוי נשמר מיד ומשפיע על כל המערכת" />

      <div className="settings-layout">
        <nav className="settings-nav no-print" aria-label="עמודי הגדרות">
          {GROUPS.map(g => (
            <div key={g.label} className="settings-nav-group">
              <span className="settings-nav-label">{g.label}</span>
              {g.pages.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`settings-nav-item${pageId === p.id ? ' is-active' : ''}`}
                  aria-current={pageId === p.id ? 'page' : undefined}
                  onClick={() => go(p.id)}
                >
                  <p.icon size={17} />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <select className="select settings-nav-select no-print" value={pageId} onChange={(e) => go(e.target.value)} aria-label="עמוד הגדרות">
          {GROUPS.map(g => (
            <optgroup key={g.label} label={g.label}>
              {g.pages.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </optgroup>
          ))}
        </select>

        <div className="settings-page" style={page.wide ? { maxWidth: 'none' } : undefined}>
          <div className="settings-page-head">
            <div>
              <h2 className="settings-page-title">{page.label}</h2>
              <p className="settings-page-sub">{page.sub}</p>
            </div>
            <span className={`saved-pill${saved ? '' : ' is-hidden'}`} role="status" aria-live="polite">
              <CheckCircle2 size={14} /> {saved ? 'נשמר' : ''}
            </span>
          </div>

          {pageId === 'buildings' && <BuildingsSettings onOpenAddBuilding={onOpenAddBuilding} />}
          {pageId === 'company' && <CompanySettings />}
          {pageId === 'categories' && <ExpenseCategoriesSettings />}
          {pageId === 'import' && <ImportSettings />}
          {pageId === 'alerts' && <AlertSettings />}
          {pageId === 'notices' && <><NoticeFormatSettings /><NoticeLibrarySettings /></>}
          {pageId === 'issues' && <IssueSettings />}
          {pageId === 'reports' && <ReportPresetsSettings />}
          {pageId === 'display' && <DisplaySettings />}
          {pageId === 'backup' && <BackupSettings />}
        </div>
      </div>
    </div>
  );
}
