// ==========================================================================
// בית ומנוחה - פרטי החברה: שם, מנהל, טלפונים ומיילים (הגדרות)
// נשמר מיד בכל שינוי. הטלפונים והמיילים מופיעים בתחתית מודעות ומכתבים.
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ConfirmModal from './ConfirmModal';
import { SettingsCard, Field } from './ui';
import { Building, Phone, Mail, Plus, X } from 'lucide-react';

const PHONE_LABELS = ['לשיחות בלבד', 'וואטסאפ בלבד', 'ראשי', 'משני', 'חירום'];
const EMAIL_LABELS = ['ראשי', 'משני', 'הנהלת חשבונות'];

// שדות ישנים שנגזרים מהרשימות — נשמרים לתאימות עם גיבויים ונתונים קודמים
const derivedContactFields = (phoneList, emailList) => {
  const phoneParts = phoneList
    .filter(p => p.number?.trim())
    .map(p => (p.label?.trim() ? `${p.label.trim()}: ${p.number.trim()}` : p.number.trim()));
  return {
    phoneCalls: phoneList[0]?.number || '',
    phoneWhatsapp: phoneList.find(p => p.label?.includes('וואטסאפ') || p.label?.includes('ווצאפ'))?.number || phoneList[1]?.number || '',
    companyEmail: emailList[0]?.email || '',
    companyEmailSecondary: emailList[1]?.email || '',
    companyPhone: phoneParts.join(' | ')
  };
};

export default function CompanySettings() {
  const { systemSettings: s, updateSystemSettings } = useApp();
  const phoneList = s.phoneList || [];
  const emailList = s.emailList || [];
  const [toRemove, setToRemove] = useState(null); // { kind: 'phone' | 'email', item }

  const saveLists = (nextPhones, nextEmails) => updateSystemSettings({
    phoneList: nextPhones,
    emailList: nextEmails,
    ...derivedContactFields(nextPhones, nextEmails)
  });
  const setPhones = (next) => saveLists(next, emailList);
  const setEmails = (next) => saveLists(phoneList, next);

  const removeItem = (kind, item) => {
    const value = kind === 'phone' ? item.number : item.email;
    if (!value?.trim()) {
      if (kind === 'phone') setPhones(phoneList.filter(p => p.id !== item.id));
      else setEmails(emailList.filter(e => e.id !== item.id));
      return;
    }
    setToRemove({ kind, item });
  };

  return (
    <>
      <SettingsCard icon={Building} title="החברה" sub="מופיעים בכותרות דוחות, מודעות ומכתבים.">
        <div className="field-row">
          <Field label="שם החברה / הוועד">
            <input type="text" className="input" value={s.companyName || ''} onChange={(e) => updateSystemSettings({ companyName: e.target.value })} />
          </Field>
          <Field label="שם המנהל">
            <input type="text" className="input" value={s.managerName || ''} onChange={(e) => updateSystemSettings({ managerName: e.target.value })} placeholder="ישי כהן" />
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Phone}
        title="טלפונים"
        sub="מופיעים בתחתית מודעות ומכתבים, לפי הסדר כאן."
        actions={<button type="button" className="btn btn-secondary btn-sm" onClick={() => setPhones([...phoneList, { id: `phone-${Date.now()}`, number: '', label: '' }])}><Plus size={15} /> הוספה</button>}
      >
        {phoneList.length === 0 && <span className="muted">לא הוגדרו טלפונים.</span>}
        {phoneList.map((item, i) => (
          <ContactRow
            key={item.id}
            valueLabel={`טלפון ${i + 1}`}
            value={item.number}
            placeholder="למשל: 052-7623803"
            label={item.label}
            labelOptions={PHONE_LABELS}
            onChange={(patch) => setPhones(phoneList.map(p => p.id === item.id ? { ...p, ...('value' in patch ? { number: patch.value } : patch) } : p))}
            onRemove={() => removeItem('phone', item)}
          />
        ))}
      </SettingsCard>

      <SettingsCard
        icon={Mail}
        title="מיילים"
        sub="מופיעים בתחתית מודעות ומכתבים, לפי הסדר כאן."
        actions={<button type="button" className="btn btn-secondary btn-sm" onClick={() => setEmails([...emailList, { id: `email-${Date.now()}`, email: '', label: '' }])}><Plus size={15} /> הוספה</button>}
      >
        {emailList.length === 0 && <span className="muted">לא הוגדרו מיילים.</span>}
        {emailList.map((item, i) => (
          <ContactRow
            key={item.id}
            valueLabel={`מייל ${i + 1}`}
            value={item.email}
            placeholder="name@example.com"
            label={item.label}
            labelOptions={EMAIL_LABELS}
            onChange={(patch) => setEmails(emailList.map(x => x.id === item.id ? { ...x, ...('value' in patch ? { email: patch.value } : patch) } : x))}
            onRemove={() => removeItem('email', item)}
          />
        ))}
      </SettingsCard>

      <ConfirmModal
        isOpen={!!toRemove}
        onClose={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove.kind === 'phone') setPhones(phoneList.filter(p => p.id !== toRemove.item.id));
          else setEmails(emailList.filter(e => e.id !== toRemove.item.id));
        }}
        title={toRemove?.kind === 'phone' ? 'הסרת טלפון' : 'הסרת מייל'}
        question={`להסיר את ${toRemove?.kind === 'phone' ? toRemove?.item.number : toRemove?.item.email || ''}?`}
        description={toRemove?.item.label ? `ייעוד: ${toRemove.item.label}` : ''}
        subDescription="הוא לא יופיע יותר במודעות ובמכתבים חדשים."
        confirmText="הסרה"
      />
    </>
  );
}

function ContactRow({ valueLabel, value, placeholder, label, labelOptions, onChange, onRemove }) {
  return (
    <div className="contact-row">
      <Field label={valueLabel}>
        <input type="text" className="input" dir="ltr" style={{ textAlign: 'right' }} value={value || ''} placeholder={placeholder} onChange={(e) => onChange({ value: e.target.value })} />
      </Field>
      <div className="field">
        <span className="field-label">ייעוד</span>
        <input type="text" className="input" value={label || ''} placeholder="למשל: לשיחות בלבד" onChange={(e) => onChange({ label: e.target.value })} aria-label={`ייעוד ${valueLabel}`} />
        <div className="chip-row">
          {labelOptions.map(opt => (
            <button key={opt} type="button" className={`chip-btn${label === opt ? ' is-active' : ''}`} onClick={() => onChange({ label: opt })}>{opt}</button>
          ))}
        </div>
      </div>
      <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={onRemove} title="הסרה" aria-label={`הסרת ${valueLabel}`}>
        <X size={14} />
      </button>
    </div>
  );
}
