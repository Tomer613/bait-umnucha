// ==========================================================================
// בית ומנוחה - תצוגה ונוחות קריאה: גודל טקסט, גופן, עובי, ניגודיות ומרווחים
// כל שינוי חל מיד על כל האתר ונשמר בדפדפן הזה
// ==========================================================================
import React from 'react';
import { useApp, DEFAULT_DISPLAY } from '../context/AppContext';
import { Type, Contrast, Bold, Rows3, RotateCcw, Wallet, AlertCircle, Minus, Plus } from 'lucide-react';
import { Kpi, Segmented } from './ui';

const MIN_SIZE = 14;
const MAX_SIZE = 22;

const FONTS = [
  { id: 'rubik', label: 'Rubik', note: 'מעוגל וידידותי', family: "'Rubik', sans-serif" },
  { id: 'heebo', label: 'Heebo', note: 'נקי וקלאסי', family: "'Heebo', sans-serif" },
  { id: 'assistant', label: 'Assistant', note: 'חד ומקצועי', family: "'Assistant', sans-serif" },
  { id: 'varela', label: 'Varela Round', note: 'רך ונעים לעין', family: "'Varela Round', sans-serif" }
];

function Section({ icon: Icon, title, hint, children }) {
  return (
    <div className="card stack" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
        <span className="kpi-icon"><Icon size={18} /></span>
        <div>
          <h3 className="section-title">{title}</h3>
          {hint && <p className="section-sub">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function DisplaySettings() {
  const { displaySettings: d, updateDisplaySettings, resetDisplaySettings } = useApp();
  const isDefault = JSON.stringify(d) === JSON.stringify(DEFAULT_DISPLAY);
  const setSize = (v) => updateDisplaySettings({ fontSize: Math.min(MAX_SIZE, Math.max(MIN_SIZE, v)) });

  return (
    <div className="display-split">
      <div className="stack" style={{ gap: 16 }}>
        <div className="alert alert-info" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <span>כל שינוי חל מיד על כל האתר ונשמר במחשב הזה. נסו עד שנוח לעין.</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={resetDisplaySettings} disabled={isDefault}>
            <RotateCcw size={15} /> חזרה לברירת המחדל
          </button>
        </div>

        <Section icon={Type} title="גודל טקסט" hint="משפיע על כל הטקסטים, המספרים והכפתורים באתר.">
          <div className="size-row">
            <button type="button" className="size-btn" onClick={() => setSize(d.fontSize - 1)} aria-label="הקטנת טקסט" disabled={d.fontSize <= MIN_SIZE}>
              <Minus size={18} />
            </button>
            <input
              id="display-font-size"
              type="range"
              min={MIN_SIZE}
              max={MAX_SIZE}
              step={1}
              value={d.fontSize}
              onChange={(e) => setSize(Number(e.target.value))}
              aria-label="גודל טקסט"
            />
            <button type="button" className="size-btn" onClick={() => setSize(d.fontSize + 1)} aria-label="הגדלת טקסט" disabled={d.fontSize >= MAX_SIZE}>
              <Plus size={18} />
            </button>
            <span className="size-value">{Math.round((d.fontSize / DEFAULT_DISPLAY.fontSize) * 100)}%</span>
          </div>
        </Section>

        <Section icon={Type} title="גופן" hint="הגופן של כל הטקסט באתר.">
          <div className="choice-grid">
            {FONTS.map(f => (
              <button
                key={f.id}
                type="button"
                className={`choice font-choice${d.font === f.id ? ' is-active' : ''}`}
                style={{ fontFamily: f.family }}
                onClick={() => updateDisplaySettings({ font: f.id })}
              >
                בית ומנוחה 1,250 ₪
                <small style={{ fontFamily: 'var(--font-sans)' }}>{f.label} · {f.note}</small>
              </button>
            ))}
          </div>
        </Section>

        <Section icon={Bold} title="עובי הטקסט" hint="טקסט מודגש קל יותר לקריאה ממרחק או על מסך בהיר.">
          <Segmented
            value={d.weight}
            onChange={(v) => updateDisplaySettings({ weight: v })}
            options={[{ id: 'normal', label: 'רגיל' }, { id: 'bold', label: 'מודגש' }]}
          />
        </Section>

        <Section icon={Contrast} title="ניגודיות" hint="מכהה את הטקסט המשני ואת הקווים המפרידים.">
          <Segmented
            value={d.contrast}
            onChange={(v) => updateDisplaySettings({ contrast: v })}
            options={[{ id: 'normal', label: 'רגילה' }, { id: 'high', label: 'גבוהה' }, { id: 'max', label: 'מקסימלית' }]}
          />
        </Section>

        <Section icon={Rows3} title="מרווחים" hint="כמה אוויר יש בין שורות בטבלאות ובתוך הכרטיסים.">
          <Segmented
            value={d.density}
            onChange={(v) => updateDisplaySettings({ density: v })}
            options={[{ id: 'compact', label: 'צפוף' }, { id: 'normal', label: 'רגיל' }, { id: 'spacious', label: 'מרווח' }]}
          />
        </Section>
      </div>

      {/* תצוגה מקדימה — משתמשת באותם רכיבים כמו האתר, ולכן משתנה איתם */}
      <div className="display-preview stack" style={{ gap: 14 }}>
        <span className="field-label">תצוגה מקדימה</span>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Kpi variant="hero" icon={Wallet} label="יתרת קופה" value="16,975 ₪" meta="בנק + קופת מזומן" />
          <Kpi variant="alert" icon={AlertCircle} label="חובות דיירים" value="1,810 ₪" meta="2 דירות בפיגור" />
        </div>
        <div className="card card-flush">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>דירה</th><th>דייר</th><th>מצב</th><th className="num">חוב</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="cell-strong">1</td>
                  <td>משפחת כהן<span className="cell-sub">חיובית</span></td>
                  <td><span className="badge badge-success">תקין</span></td>
                  <td className="num"><span className="muted">—</span></td>
                </tr>
                <tr className="row-alert">
                  <td className="cell-strong">3</td>
                  <td>משה יעקובי<span className="cell-sub">העברה בנקאית</span></td>
                  <td><span className="badge badge-danger">בחוב</span></td>
                  <td className="num amount-out">700 ₪</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="row">
          <button type="button" className="btn btn-primary">כפתור ראשי</button>
          <button type="button" className="btn btn-secondary">כפתור משני</button>
          <span className="badge badge-gold">תגית</span>
        </div>
      </div>
    </div>
  );
}
