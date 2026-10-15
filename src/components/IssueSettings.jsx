// ==========================================================================
// בית ומנוחה - הגדרות פניות (אפיון 02): קטגוריות ותזכורת על פנייה שלא נענתה
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, X, MessageSquare, BellRing } from 'lucide-react';

export default function IssueSettings() {
  const { systemSettings, updateSystemSettings } = useApp();
  const categories = systemSettings.issueCategories || [];
  const [name, setName] = useState('');

  const add = (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean || categories.includes(clean)) return;
    updateSystemSettings({ issueCategories: [...categories, clean] });
    setName('');
  };

  return (
    <div className="stack" style={{ gap: 18, maxWidth: 820 }}>
      <div className="card stack" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
          <span className="kpi-icon"><MessageSquare size={18} /></span>
          <div>
            <h3 className="section-title">קטגוריות פניות</h3>
            <p className="section-sub">נבחרות בפתיחת פנייה ומשמשות לסינון ברשימה ובארכיון. מחיקת קטגוריה לא משנה פניות שכבר סווגו בה.</p>
          </div>
        </div>
        <form onSubmit={add} className="row" style={{ flexWrap: 'nowrap' }}>
          <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: הדברה" aria-label="קטגוריה חדשה" />
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}><Plus size={16} /> הוספה</button>
        </form>
        <div className="row" style={{ gap: 8 }}>
          {categories.map(c => (
            <span key={c} className="preset-chip">
              <span style={{ padding: '0 6px' }}>{c}</span>
              <button type="button" className="preset-remove" title="הסרה" onClick={() => updateSystemSettings({ issueCategories: categories.filter(x => x !== c) })}><X size={12} /></button>
            </span>
          ))}
        </div>
      </div>

      <div className="card stack" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
          <span className="kpi-icon"><BellRing size={18} /></span>
          <div>
            <h3 className="section-title">תזכורת על פנייה שלא נענתה</h3>
            <p className="section-sub">פנייה שההודעה האחרונה בה של נציג או דייר מודגשת במסך המשימות אחרי מספר הימים שנבחר. פנייה דחופה — אחרי יום.</p>
          </div>
        </div>
        <label className="field" style={{ maxWidth: 320 }}>
          <span className="field-label">תזכורת אחרי</span>
          <select className="select" value={String(systemSettings.issueReminderDays ?? 3)} onChange={(e) => updateSystemSettings({ issueReminderDays: parseInt(e.target.value, 10) })}>
            {[1, 2, 3, 5, 7].map(d => <option key={d} value={d}>{d === 1 ? 'יום אחד' : `${d} ימים`}{d === 3 ? ' (מומלץ)' : ''}</option>)}
            <option value="0">כבוי</option>
          </select>
        </label>
      </div>
    </div>
  );
}
