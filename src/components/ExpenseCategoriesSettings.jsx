// ==========================================================================
// בית ומנוחה - ניהול קטגוריות הוצאה (הגדרות)
// הרשימה משמשת בהזנת הוצאות ובדוח ההוצאות השנתי. "אחר" קבוע בסוף ואינו ניתן למחיקה.
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OTHER_CATEGORY } from '../data/initialData';
import { activeTransactions } from '../utils/ledger';
import { Plus, X, Tags, Lock, Wand2, Landmark, UserRound } from 'lucide-react';

export default function ExpenseCategoriesSettings() {
  const { buildings, expenseCategories, addExpenseCategory, removeExpenseCategory, systemSettings, updateSystemSettings } = useApp();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  // בכמה הוצאות כל קטגוריה בשימוש (בכל הבניינים)
  const usage = {};
  buildings.forEach(b => activeTransactions(b).forEach(tx => {
    if (tx.direction === 'out') usage[tx.category] = (usage[tx.category] || 0) + 1;
  }));

  const handleAdd = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (expenseCategories.includes(name)) {
      setError(`הקטגוריה "${name}" כבר קיימת.`);
      return;
    }
    addExpenseCategory(name);
    setNewName('');
    setError('');
  };

  return (
    <div className="stack" style={{ gap: 18, maxWidth: 820 }}>
      <div className="card stack" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
          <span className="kpi-icon"><Tags size={18} /></span>
          <div>
            <h3 className="section-title">קטגוריות הוצאה</h3>
            <p className="section-sub">
              מופיעות בהזנת הוצאה ובדוח ההוצאות השנתי של כל הבניינים. מחיקת קטגוריה לא מוחקת הוצאות שכבר נרשמו בה, והן ימשיכו להופיע בדוח.
            </p>
          </div>
        </div>

        <form onSubmit={handleAdd} className="row" style={{ flexWrap: 'nowrap' }}>
          <input
            id="new-expense-category"
            type="text"
            className="input"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(''); }}
            placeholder="שם קטגוריה חדשה, למשל: הדברה"
            aria-label="שם קטגוריה חדשה"
          />
          <button type="submit" className="btn btn-primary" disabled={!newName.trim()}>
            <Plus size={16} /> הוספה
          </button>
        </form>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="category-list">
          {expenseCategories.map(cat => {
            const isOther = cat === OTHER_CATEGORY;
            const count = usage[cat] || 0;
            return (
              <div key={cat} className={`category-item${isOther ? ' is-locked' : ''}`}>
                <span className="category-name">{cat}</span>
                <span className="category-count">{count ? `${count} הוצאות` : 'לא בשימוש'}</span>
                {isOther ? (
                  <span className="category-lock" title="קטגוריה קבועה"><Lock size={14} /></span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm btn-icon"
                    onClick={() => removeExpenseCategory(cat)}
                    title={`הסרת "${cat}" מהרשימה`}
                    aria-label={`הסרת ${cat}`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <CategoryRules
        rules={systemSettings.categoryRules || []}
        categories={expenseCategories}
        onChange={(categoryRules) => updateSystemSettings({ categoryRules })}
      />

      <NamesCard
        icon={Landmark}
        title="הפקדת חיובית בדו״ח העו״ש"
        text="הכנסה שהתיאור שלה מכיל אחד מהשמות תסווג כ״גבייה מחיובית״. בבניינים שונים ההפקדה מופיעה בשמות שונים."
        placeholder="למשל: אוקס פינטק"
        names={systemSettings.hiyuvitDepositNames || []}
        onChange={(hiyuvitDepositNames) => updateSystemSettings({ hiyuvitDepositNames })}
      />

      <NamesCard
        icon={UserRound}
        title="העברות למנהל בדו״ח העו״ש"
        text="העברה שהתיאור שלה מכיל אחד מהשמות מזוהה כהחזר על הוצאות שהמנהל שילם מכיסו: היא סוגרת את החוב אליו ולא נספרת שוב כהוצאה."
        placeholder="למשל: כהן ישי"
        names={systemSettings.managerBankNames || []}
        onChange={(managerBankNames) => updateSystemSettings({ managerBankNames })}
      />

      <div className="card stack" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
          <span className="kpi-icon"><Wand2 size={18} /></span>
          <div>
            <h3 className="section-title">זיהוי גביות מיוחדות בקובץ חיובית</h3>
            <p className="section-sub">חיוב שאינו דמי ועד ומופיע אצל הרבה דיירים מוצג כחשד לגבייה מיוחדת חדשה.</p>
          </div>
        </div>
        <div className="field-row">
          <label className="field">
            <span className="field-label">סף זיהוי</span>
            <select className="select" value={String(systemSettings.levyDetectThreshold ?? 0.3)} onChange={(e) => updateSystemSettings({ levyDetectThreshold: parseFloat(e.target.value) })}>
              {[0.2, 0.3, 0.4, 0.5].map(v => <option key={v} value={String(v)}>אותו סכום אצל {Math.round(v * 100)}% מהדיירים לפחות{v === 0.3 ? ' (מומלץ)' : ''}</option>)}
            </select>
            <span className="field-hint">סכומים שמתחת לסף מגיעים לרשימת "דורשים שיוך".</span>
          </label>
          <label className="field">
            <span className="field-label">אישור שיוך לגבייה קיימת</span>
            <select className="select" value={systemSettings.levyConfirm || 'first_time'} onChange={(e) => updateSystemSettings({ levyConfirm: e.target.value })}>
              <option value="first_time">רק בפעם הראשונה לכל גבייה (מומלץ)</option>
              <option value="always">בכל קליטה</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

// כללי סיווג אוטומטי בקליטת עו"ש (אפיון 04, סעיף 5.6) — נערכים רק כאן
function CategoryRules({ rules, categories, onChange }) {
  const [contains, setContains] = useState('');
  const [category, setCategory] = useState(categories[0] || '');

  const add = (e) => {
    e.preventDefault();
    const text = contains.trim();
    if (!text || !category) return;
    onChange([{ id: `r-${Date.now()}`, contains: text, category }, ...rules.filter(r => r.contains !== text)]);
    setContains('');
  };

  return (
    <div className="card stack" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
        <span className="kpi-icon"><Wand2 size={18} /></span>
        <div>
          <h3 className="section-title">כללי סיווג אוטומטי</h3>
          <p className="section-sub">
            בקליטת דו״ח עו״ש, הוצאה שהתיאור שלה מכיל את הטקסט תסווג אוטומטית לקטגוריה. אפשר תמיד לשנות קטגוריה של תנועה בודדת בתצוגה המקדימה.
          </p>
        </div>
      </div>
      <form onSubmit={add} className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <input type="text" className="input" style={{ flex: '1 1 200px' }} value={contains} onChange={(e) => setContains(e.target.value)} placeholder="התיאור מכיל, למשל: י.ד. שירותי" aria-label="טקסט בתיאור" />
        <select className="select" style={{ flex: '1 1 200px' }} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="קטגוריה">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="btn btn-primary" disabled={!contains.trim()}><Plus size={16} /> הוספת כלל</button>
      </form>
      <div className="category-list rule-list">
        {rules.length === 0 && <span className="muted">אין כללים.</span>}
        {rules.map(r => (
          <div key={r.id} className="category-item">
            <span className="category-name">"{r.contains}" ← {r.category}</span>
            <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => onChange(rules.filter(x => x.id !== r.id))} title="מחיקת הכלל" aria-label={`מחיקת הכלל ${r.contains}`}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// רשימת שמות לזיהוי בעו"ש: הפקדת חיובית (סעיף 7.4), העברות למנהל (סעיף 7.5)
function NamesCard({ icon: Icon, title, text, placeholder, names, onChange }) {
  const [name, setName] = useState('');
  const add = (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean || names.includes(clean)) return;
    onChange([...names, clean]);
    setName('');
  };

  return (
    <div className="card stack" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
        <span className="kpi-icon"><Icon size={18} /></span>
        <div>
          <h3 className="section-title">{title}</h3>
          <p className="section-sub">{text}</p>
        </div>
      </div>
      <form onSubmit={add} className="row" style={{ flexWrap: 'nowrap' }}>
        <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} aria-label={title} />
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}><Plus size={16} /> הוספה</button>
      </form>
      <div className="row" style={{ gap: 8 }}>
        {names.map(n => (
          <span key={n} className="preset-chip">
            <span style={{ padding: '0 6px' }}>{n}</span>
            <button type="button" className="preset-remove" title="הסרה" onClick={() => onChange(names.filter(x => x !== n))}><X size={12} /></button>
          </span>
        ))}
      </div>
    </div>
  );
}
