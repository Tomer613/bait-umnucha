// ==========================================================================
// בית ומנוחה - נוסח קבוע למודעות ומכתבים: פורמט תאריך, פתיח וחתימה (הגדרות)
// ==========================================================================
import React from 'react';
import { useApp } from '../context/AppContext';
import { formatFormattedDate } from '../utils/hebrewDate';
import { SettingsCard, Field } from './ui';
import { Calendar, PenLine } from 'lucide-react';

const DATE_FORMATS = [
  { id: 'both', label: 'עברי + לועזי (מומלץ)', desc: 'י״ד בתשרי תשפ״ז | 14.10.2026' },
  { id: 'hebrew_only', label: 'עברי בלבד', desc: 'י״ד בתשרי תשפ״ז' },
  { id: 'gregorian_only', label: 'לועזי בלבד', desc: '14.10.2026' }
];

export default function NoticeFormatSettings() {
  const { systemSettings: s, updateSystemSettings } = useApp();
  const format = s.hebrewDateFormat || 'both';

  return (
    <>
      <SettingsCard icon={Calendar} title="תאריך במודעות ובמכתבים" sub="איך התאריך יופיע בכל מודעה ומכתב שמופקים מהמערכת.">
        <div className="choice-grid" role="radiogroup" aria-label="פורמט תאריך">
          {DATE_FORMATS.map(f => (
            <label key={f.id} className={`choice-card${format === f.id ? ' is-selected' : ''}`}>
              <span className="choice-card-title">
                <input type="radio" name="hebrewDateFormat" checked={format === f.id} onChange={() => updateSystemSettings({ hebrewDateFormat: f.id })} />
                {f.label}
              </span>
              <span className="choice-card-desc">{f.desc}</span>
            </label>
          ))}
        </div>
        <div className="info-panel row" style={{ justifyContent: 'space-between' }}>
          <span className="muted">כך זה ייראה היום:</span>
          <strong>{formatFormattedDate(new Date(), format)}</strong>
        </div>
      </SettingsCard>

      <SettingsCard icon={PenLine} title="פתיח וחתימה" sub="מתווספים אוטומטית לכל מודעה ומכתב.">
        <Field label="פתיח בראש העמוד">
          <input type="text" className="input" style={{ maxWidth: 300 }} value={s.noticeHeaderPrefix ?? ''} onChange={(e) => updateSystemSettings({ noticeHeaderPrefix: e.target.value })} placeholder="למשל: בס״ד" />
        </Field>
        <Field label="חתימה בתחתית העמוד" hint="אפשר לרדת שורה עם Enter.">
          <textarea rows={3} className="textarea" style={{ lineHeight: 1.6, resize: 'vertical' }} value={s.noticeSignoff ?? ''} onChange={(e) => updateSystemSettings({ noticeSignoff: e.target.value })} placeholder={'למשל:\nבברכת ועד הבית,\nהנהלת בית ומנוחה'} />
        </Field>
      </SettingsCard>
    </>
  );
}
