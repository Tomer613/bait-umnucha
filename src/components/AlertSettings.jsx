// ==========================================================================
// בית ומנוחה - ספי התראה למסך המשימות (הגדרות)
// ==========================================================================
import React from 'react';
import { useApp } from '../context/AppContext';
import { SettingsCard, Field } from './ui';
import { BellRing } from 'lucide-react';

export default function AlertSettings() {
  const { systemSettings: s, updateSystemSettings } = useApp();
  return (
    <SettingsCard icon={BellRing} title="מתי להתריע" sub="מסך המשימות מציג משימה כשבניין או דירה עוברים את הספים האלה.">
      <div className="field-row" style={{ maxWidth: 560 }}>
        <Field label="יתרה נמוכה בקופה (₪)" hint="משימה כשיתרת הבניין יורדת מתחת לסכום הזה">
          <input type="number" min="0" step="500" className="input" value={s.lowBalanceThreshold ?? 7000} onChange={(e) => updateSystemSettings({ lowBalanceThreshold: parseFloat(e.target.value) || 0 })} />
        </Field>
        <Field label="חוב מתמשך (חודשים)" hint="משימת מכתב התראה לדירה שבחוב כמה חודשים ברצף">
          <input type="number" min="1" max="12" className="input" value={s.chronicDebtMonths ?? 3} onChange={(e) => updateSystemSettings({ chronicDebtMonths: parseInt(e.target.value, 10) || 1 })} />
        </Field>
      </div>
    </SettingsCard>
  );
}
