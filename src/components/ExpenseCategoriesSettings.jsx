// ==========================================================================
// בית ומנוחה - ניהול קטגוריות הוצאה (הגדרות)
// הרשימה משמשת בהזנת הוצאות ובדוח ההוצאות השנתי. "אחר" קבוע בסוף ואינו ניתן למחיקה.
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OTHER_CATEGORY } from '../data/initialData';
import { Plus, X, Tags, Lock } from 'lucide-react';

export default function ExpenseCategoriesSettings() {
  const { buildings, expenseCategories, addExpenseCategory, removeExpenseCategory } = useApp();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  // בכמה הוצאות כל קטגוריה בשימוש (בכל הבניינים)
  const usage = {};
  buildings.forEach(b => (b.expenses || []).forEach(e => {
    if (e.amount > 0) usage[e.category] = (usage[e.category] || 0) + 1;
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
    </div>
  );
}
