// ==========================================================================
// בית ומנוחה - ניהול קטגוריות הוצאה (הגדרות)
// הרשימה משמשת בהזנת הוצאות ובדוח ההוצאות השנתי. "אחר" קבוע בסוף ואינו ניתן למחיקה.
// כללי הסיווג האוטומטי באותו עמוד, כי כל כלל מפנה לקטגוריה ונמחק יחד איתה.
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OTHER_CATEGORY } from '../data/initialData';
import { activeTransactions } from '../utils/ledger';
import ConfirmModal from './ConfirmModal';
import { SettingsCard } from './ui';
import { Plus, X, Tags, Lock, Wand2 } from 'lucide-react';

export default function ExpenseCategoriesSettings() {
  const { buildings, expenseCategories, addExpenseCategory, removeExpenseCategory, systemSettings, updateSystemSettings } = useApp();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [showUsage, setShowUsage] = useState(false);
  const [confirm, setConfirm] = useState(null); // { title, question, description, subDescription, onConfirm }

  // הוצאות רשומות בכל הבניינים — לספירת שימוש בקטגוריות ובכללים
  const expenses = buildings.flatMap(b => activeTransactions(b).filter(tx => tx.direction === 'out'));
  const rules = systemSettings.categoryRules || [];
  const usage = {};
  expenses.forEach(tx => { usage[tx.category] = (usage[tx.category] || 0) + 1; });

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
    <>
      <SettingsCard
        icon={Tags}
        title="רשימת הקטגוריות"
        sub="מופיעות בהזנת הוצאה ובדוח ההוצאות השנתי של כל הבניינים. מחיקת קטגוריה מוחקת גם את כללי הסיווג האוטומטי שלה (בכרטיס הבא), אבל לא את ההוצאות שכבר נרשמו בה."
      >

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

        <UsageToggle
          checked={showUsage}
          onChange={setShowUsage}
          hint="כמה הוצאות רשומות כרגע בכל קטגוריה בכל הבניינים, וכמה כללי סיווג אוטומטי מפנים אליה. עוזר להחליט אם קטגוריה מיותרת לפני מחיקה."
        />

        <div className="category-list">
          {expenseCategories.map(cat => {
            const isOther = cat === OTHER_CATEGORY;
            const count = usage[cat] || 0;
            const catRules = rules.filter(r => r.category === cat);
            return (
              <div key={cat} className={`category-item${isOther ? ' is-locked' : ''}`}>
                <span className="category-text">
                  <span className="category-name" title={cat}>{cat}</span>
                  {showUsage && (
                    <span className="category-count">
                      {count ? `${count} הוצאות` : 'לא בשימוש כרגע'}
                      {catRules.length > 0 && ` · ${catRules.length === 1 ? 'כלל סיווג אחד' : `${catRules.length} כללי סיווג`}`}
                    </span>
                  )}
                </span>
                {isOther ? (
                  <span className="category-lock" title="קטגוריה קבועה"><Lock size={14} /></span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm btn-icon"
                    onClick={() => setConfirm({
                      title: 'מחיקת קטגוריה',
                      question: `למחוק את הקטגוריה "${cat}"?`,
                      description: <CategoryDeleteImpact cat={cat} expenseCount={count} rules={catRules} />,
                      subDescription: '',
                      confirmText: catRules.length ? 'מחיקת הקטגוריה והכללים' : 'מחיקת הקטגוריה',
                      onConfirm: () => removeExpenseCategory(cat)
                    })}
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
      </SettingsCard>

      <CategoryRules
        rules={rules}
        categories={expenseCategories}
        expenses={expenses}
        askConfirm={setConfirm}
        onChange={(categoryRules) => updateSystemSettings({ categoryRules })}
      />

      <ConfirmModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm.onConfirm()}
        title={confirm?.title}
        question={confirm?.question}
        description={confirm?.description}
        subDescription={confirm?.subDescription}
        confirmText={confirm?.confirmText}
      />
    </>
  );
}

// כללי סיווג אוטומטי בקליטת עו"ש (אפיון 04, סעיף 5.6) — נערכים רק כאן
function CategoryRules({ rules, categories, expenses, askConfirm, onChange }) {
  const [contains, setContains] = useState('');
  const [showUsage, setShowUsage] = useState(false);
  const [category, setCategory] = useState(categories[0] || '');

  const add = (e) => {
    e.preventDefault();
    const text = contains.trim();
    if (!text || !category) return;
    onChange([{ id: `r-${Date.now()}`, contains: text, category }, ...rules.filter(r => r.contains !== text)]);
    setContains('');
  };

  return (
    <SettingsCard icon={Wand2} title="כללי סיווג אוטומטי" sub="בקליטת דו״ח עו״ש, הוצאה שהתיאור שלה מכיל את הטקסט תסווג אוטומטית לקטגוריה. אפשר תמיד לשנות קטגוריה של תנועה בודדת בתצוגה המקדימה. כל כלל קשור לקטגוריה מהכרטיס הקודם, ונמחק יחד איתה.">
      <form onSubmit={add} className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <input type="text" className="input" style={{ flex: '1 1 200px' }} value={contains} onChange={(e) => setContains(e.target.value)} placeholder="התיאור מכיל, למשל: י.ד. שירותי" aria-label="טקסט בתיאור" />
        <select className="select" style={{ flex: '1 1 200px' }} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="קטגוריה">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="btn btn-primary" disabled={!contains.trim()}><Plus size={16} /> הוספת כלל</button>
      </form>
      {rules.length > 0 && (
        <UsageToggle
          checked={showUsage}
          onChange={setShowUsage}
          hint="כמה הוצאות רשומות כרגע מכילות את הטקסט של הכלל בתיאור, בכל הבניינים. כלל שלא תופס אף הוצאה כנראה מיותר או מנוסח לא נכון."
        />
      )}
      <div className="category-list rule-list">
        {rules.length === 0 && <span className="muted">אין כללים.</span>}
        {rules.map(r => {
          const count = showUsage ? expenses.filter(tx => (tx.description || '').includes(r.contains)).length : 0;
          return (
          <div key={r.id} className="category-item">
            <span className="category-text">
              <span className="category-name" title={`"${r.contains}" ← ${r.category}`}>"{r.contains}" ← {r.category}</span>
              {showUsage && <span className="category-count">{count ? `${count} הוצאות` : 'לא בשימוש כרגע'}</span>}
            </span>
            <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => askConfirm({
              title: 'מחיקת כלל סיווג',
              question: `למחוק את הכלל "${r.contains}" ← ${r.category}?`,
              description: 'הוצאות שכבר נקלטו לא ישתנו.',
              subDescription: 'בקליטות הבאות, הוצאות עם הטקסט הזה לא יסווגו אוטומטית לקטגוריה.',
              onConfirm: () => onChange(rules.filter(x => x.id !== r.id))
            })} title="מחיקת הכלל" aria-label={`מחיקת הכלל ${r.contains}`}>
              <X size={14} />
            </button>
          </div>
          );
        })}
      </div>
    </SettingsCard>
  );
}

// מה קורה במחיקת קטגוריה: מה נמחק ומה נשאר
function CategoryDeleteImpact({ cat, expenseCount, rules }) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className={`alert ${rules.length ? 'alert-error' : 'alert-info'} stack`} style={{ gap: 6, alignItems: 'stretch' }}>
        <strong>מה יימחק</strong>
        <span>• הקטגוריה "{cat}" תוסר מהרשימה ולא תופיע יותר בהזנת הוצאה.</span>
        {rules.length > 0 && (
          <>
            <span>
              • {rules.length === 1 ? 'כלל סיווג אוטומטי אחד' : `${rules.length} כללי סיווג אוטומטי`} שמפנים אליה יימחקו גם הם.
              {' '}הכללים מופיעים בכרטיס <strong>"כללי סיווג אוטומטי"</strong> שמתחת לרשימת הקטגוריות:
            </span>
            <div className="row" style={{ gap: 6, paddingInlineStart: 12 }}>
              {rules.map(r => <span key={r.id} className="badge">"{r.contains}" ← {r.category}</span>)}
            </div>
            <span>מהקליטה הבאה, הוצאות עם הטקסטים האלה יסווגו ל"תחזוקה שוטפת והוצאות חריגות", ואפשר יהיה לשנות להן קטגוריה ידנית בתצוגה המקדימה.</span>
          </>
        )}
      </div>
      <div className="alert alert-success stack" style={{ gap: 6, alignItems: 'stretch', fontWeight: 400 }}>
        <strong>מה יישאר</strong>
        <span>
          {expenseCount
            ? `• ${expenseCount === 1 ? 'ההוצאה הרשומה' : `${expenseCount} ההוצאות הרשומות`} בקטגוריה יישארו כמו שהן וימשיכו להופיע בדוח ההוצאות.`
            : '• אין כרגע הוצאות רשומות בקטגוריה, כך שאף הוצאה לא מושפעת.'}
        </span>
      </div>
    </div>
  );
}

// מתג הצגת שימוש בפועל — מוסתר כברירת מחדל כדי לא להעמיס על הרשימה
function UsageToggle({ checked, onChange, hint }) {
  return (
    <div className="stack" style={{ gap: 4 }}>
      <label className="row" style={{ gap: 10, cursor: 'pointer', flexWrap: 'nowrap' }}>
        <span className="switch">
          <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
          <span className="slider" />
        </span>
        <span className="field-label">{checked ? 'הסתר שימוש בפועל' : 'הצג שימוש בפועל'}</span>
      </label>
      {checked && <span className="field-hint">{hint}</span>}
    </div>
  );
}

