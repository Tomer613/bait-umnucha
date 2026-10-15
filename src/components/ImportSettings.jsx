// ==========================================================================
// בית ומנוחה - קליטת דו"ח עו"ש וקובץ חיובית: זיהוי שמות וגביות מיוחדות (הגדרות)
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ConfirmModal from './ConfirmModal';
import { SettingsCard, Field } from './ui';
import { Plus, X, Wand2, Landmark, UserRound } from 'lucide-react';

export default function ImportSettings() {
  const { systemSettings, updateSystemSettings } = useApp();
  const [confirm, setConfirm] = useState(null); // { title, question, description, subDescription, onConfirm }

  return (
    <>
      <NamesCard
        icon={Landmark}
        title="הפקדת חיובית בדו״ח העו״ש"
        text="הכנסה שהתיאור שלה מכיל אחד מהשמות תסווג כ״גבייה מחיובית״. בבניינים שונים ההפקדה מופיעה בשמות שונים."
        placeholder="למשל: אוקס פינטק"
        names={systemSettings.hiyuvitDepositNames || []}
        askConfirm={setConfirm}
        onChange={(hiyuvitDepositNames) => updateSystemSettings({ hiyuvitDepositNames })}
      />

      <NamesCard
        icon={UserRound}
        title="העברות למנהל בדו״ח העו״ש"
        text="העברה שהתיאור שלה מכיל אחד מהשמות מזוהה כהחזר על הוצאות שהמנהל שילם מכיסו: היא סוגרת את החוב אליו ולא נספרת שוב כהוצאה."
        placeholder="למשל: כהן ישי"
        names={systemSettings.managerBankNames || []}
        askConfirm={setConfirm}
        onChange={(managerBankNames) => updateSystemSettings({ managerBankNames })}
      />

      <SettingsCard icon={Wand2} title="זיהוי גביות מיוחדות בקובץ חיובית" sub="חיוב שאינו דמי ועד ומופיע אצל הרבה דיירים מוצג כחשד לגבייה מיוחדת חדשה.">
        <div className="field-row">
          <Field label="סף זיהוי" hint='סכומים שמתחת לסף מגיעים לרשימת "דורשים שיוך".'>
            <select className="select" value={String(systemSettings.levyDetectThreshold ?? 0.3)} onChange={(e) => updateSystemSettings({ levyDetectThreshold: parseFloat(e.target.value) })}>
              {[0.2, 0.3, 0.4, 0.5].map(v => <option key={v} value={String(v)}>אותו סכום אצל {Math.round(v * 100)}% מהדיירים לפחות{v === 0.3 ? ' (מומלץ)' : ''}</option>)}
            </select>
          </Field>
          <Field label="אישור שיוך לגבייה קיימת">
            <select className="select" value={systemSettings.levyConfirm || 'first_time'} onChange={(e) => updateSystemSettings({ levyConfirm: e.target.value })}>
              <option value="first_time">רק בפעם הראשונה לכל גבייה (מומלץ)</option>
              <option value="always">בכל קליטה</option>
            </select>
          </Field>
        </div>
      </SettingsCard>

      <ConfirmModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm.onConfirm()}
        title={confirm?.title}
        question={confirm?.question}
        description={confirm?.description}
        subDescription={confirm?.subDescription}
      />
    </>
  );
}

// רשימת שמות לזיהוי בעו"ש: הפקדת חיובית (סעיף 7.4), העברות למנהל (סעיף 7.5)
function NamesCard({ icon: Icon, title, text, placeholder, names, askConfirm, onChange }) {
  const [name, setName] = useState('');
  const add = (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean || names.includes(clean)) return;
    onChange([...names, clean]);
    setName('');
  };

  return (
    <SettingsCard icon={Icon} title={title} sub={text}>
      <form onSubmit={add} className="row" style={{ flexWrap: 'nowrap' }}>
        <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} aria-label={title} />
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}><Plus size={16} /> הוספה</button>
      </form>
      <div className="row" style={{ gap: 8 }}>
        {names.map(n => (
          <span key={n} className="preset-chip">
            <span style={{ padding: '0 6px' }}>{n}</span>
            <button type="button" className="preset-remove" title="הסרה" aria-label={`הסרת ${n}`} onClick={() => askConfirm({
              title: 'הסרת שם',
              question: `להסיר את "${n}" מהרשימה?`,
              description: `הרשימה: ${title}. תנועות שכבר נקלטו לא ישתנו.`,
              subDescription: 'בקליטות הבאות, תנועות עם השם הזה לא יזוהו אוטומטית.',
              onConfirm: () => onChange(names.filter(x => x !== n))
            })}><X size={12} /></button>
          </span>
        ))}
      </div>
    </SettingsCard>
  );
}
