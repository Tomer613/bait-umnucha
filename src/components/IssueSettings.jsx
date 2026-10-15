// ==========================================================================
// בית ומנוחה - הגדרות פניות (אפיון 02): קטגוריות ותזכורת על פנייה שלא נענתה
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ConfirmModal from './ConfirmModal';
import { SettingsCard, Field } from './ui';
import { Plus, X, MessageSquare, BellRing } from 'lucide-react';

export default function IssueSettings() {
  const { buildings, systemSettings, updateSystemSettings } = useApp();
  const categories = systemSettings.issueCategories || [];
  const [name, setName] = useState('');
  const [toDelete, setToDelete] = useState(null);

  const add = (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean || categories.includes(clean)) return;
    updateSystemSettings({ issueCategories: [...categories, clean] });
    setName('');
  };

  const issueCount = (c) => buildings.reduce((n, b) => n + (b.issues || []).filter(i => i.category === c).length, 0);

  return (
    <>
      <SettingsCard icon={MessageSquare} title="קטגוריות פניות" sub="נבחרות בפתיחת פנייה ומשמשות לסינון ברשימה ובארכיון. מחיקת קטגוריה לא משנה פניות שכבר סווגו בה.">
        <form onSubmit={add} className="row" style={{ flexWrap: 'nowrap' }}>
          <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: הדברה" aria-label="קטגוריה חדשה" />
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}><Plus size={16} /> הוספה</button>
        </form>
        <div className="row" style={{ gap: 8 }}>
          {categories.map(c => (
            <span key={c} className="preset-chip">
              <span style={{ padding: '0 6px' }}>{c}</span>
              <button type="button" className="preset-remove" title="הסרה" aria-label={`הסרת ${c}`} onClick={() => setToDelete(c)}><X size={12} /></button>
            </span>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard icon={BellRing} title="תזכורת על פנייה שלא נענתה" sub="פנייה שההודעה האחרונה בה של נציג או דייר מודגשת במסך המשימות אחרי מספר הימים שנבחר. פנייה דחופה — אחרי יום.">
        <div style={{ maxWidth: 320 }}>
          <Field label="תזכורת אחרי">
            <select className="select" value={String(systemSettings.issueReminderDays ?? 3)} onChange={(e) => updateSystemSettings({ issueReminderDays: parseInt(e.target.value, 10) })}>
              {[1, 2, 3, 5, 7].map(d => <option key={d} value={d}>{d === 1 ? 'יום אחד' : `${d} ימים`}{d === 3 ? ' (מומלץ)' : ''}</option>)}
              <option value="0">כבוי</option>
            </select>
          </Field>
        </div>
      </SettingsCard>

      <ConfirmModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => updateSystemSettings({ issueCategories: categories.filter(x => x !== toDelete) })}
        title="מחיקת קטגוריית פניות"
        question={`למחוק את הקטגוריה "${toDelete || ''}"?`}
        description={toDelete ? (issueCount(toDelete) ? `${issueCount(toDelete)} פניות מסווגות בה. הן יישארו מסווגות כך, אבל אי אפשר יהיה לבחור בה בפניות חדשות.` : 'אין פניות שמסווגות בקטגוריה הזו.') : ''}
        subDescription="הקטגוריה תוסר מרשימת הבחירה בפתיחת פנייה."
      />
    </>
  );
}
