// ==========================================================================
// בית ומנוחה - עריכה, מחיקה ושחזור של תנועה (אפיון 04, סעיף 6)
// תנועה מקובץ: סכום ותאריך נעולים — מתקנים בביטול הקליטה. שינוי בחודש סגור פותח אותו מחדש.
// ==========================================================================
import React, { useState } from 'react';
import { Lock, Trash2, RotateCcw, History } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal, Field } from '../ui';
import { formatMonth } from '../../utils/format';
import { isImported, formatDateIL, SOURCE_LABELS, ACCOUNTS, TX_FIELD_LABELS, AUDIT_LABELS } from '../../utils/ledger';
import { isMonthClosed } from '../../utils/monthClose';
import { INCOME_CATEGORIES } from '../../utils/importPlan';

export default function TransactionModal({ building, tx, onClose, onDone }) {
  const { updateTransaction, deleteTransaction, restoreTransaction, expenseCategories } = useApp();
  const locked = isImported(tx);
  const [form, setForm] = useState({
    date: tx.date,
    amount: tx.amount,
    category: tx.category,
    description: tx.description
  });
  const [mode, setMode] = useState('edit'); // edit | delete
  const [reason, setReason] = useState('');

  const closedMonth = isMonthClosed(building, tx.month) || (form.date && isMonthClosed(building, form.date.slice(0, 7)));
  const needsReason = mode === 'delete' || closedMonth || !!tx.deletedAt;
  const history = (building.auditLog || []).filter(e => e.txId === tx.id);
  const categories = tx.direction === 'in' ? INCOME_CATEGORIES.concat('הכנסה במזומן') : expenseCategories;
  const categoryOptions = categories.includes(form.category) ? categories : [form.category, ...categories];

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = (e) => {
    e.preventDefault();
    if (needsReason && !reason.trim()) return;
    const changes = locked
      ? { category: form.category, description: form.description }
      : { date: form.date, amount: form.amount, category: form.category, description: form.description };
    updateTransaction(building.id, tx.id, changes, reason.trim());
    onDone('התנועה עודכנה.');
  };

  const remove = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    deleteTransaction(building.id, tx.id, reason.trim());
    onDone('התנועה נמחקה. אפשר לשחזר אותה מ"תנועות שנמחקו".');
  };

  const restore = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    restoreTransaction(building.id, tx.id, reason.trim());
    onDone('התנועה שוחזרה.');
  };

  const subtitle = `${tx.direction === 'in' ? 'הכנסה' : 'הוצאה'} · ${ACCOUNTS[tx.account] || ''} · מקור: ${SOURCE_LABELS[tx.source] || tx.source}`;

  return (
    <Modal isOpen onClose={onClose} title={tx.deletedAt ? 'תנועה שנמחקה' : 'עריכת תנועה'} subtitle={subtitle}>
      <form onSubmit={tx.deletedAt ? restore : mode === 'delete' ? remove : save} className="form-stack">
        {tx.deletedAt && (
          <div className="alert alert-warning">
            <Trash2 size={18} />
            <span>נמחקה ב-{formatDateIL(tx.deletedAt.slice(0, 10))} · סיבה: {tx.deleteReason}</span>
          </div>
        )}

        {locked && !tx.deletedAt && (
          <div className="alert alert-info">
            <Lock size={18} />
            <span>התנועה הגיעה מקובץ ה{SOURCE_LABELS[tx.source]}, ולכן הסכום והתאריך נעולים. אם הם שגויים, בטלו את הקליטה כולה בלשונית "יומנים" ← "היסטוריית קליטות", וקלטו את הקובץ הנכון.</span>
          </div>
        )}

        <div className="field-row">
          <Field label="תאריך">
            <input type="date" className="input" value={form.date} onChange={set('date')} disabled={locked || !!tx.deletedAt || mode === 'delete'} required />
          </Field>
          <Field label="סכום (₪)">
            <input type="number" step="0.01" min="0.01" className="input" value={form.amount} onChange={set('amount')} disabled={locked || !!tx.deletedAt || mode === 'delete'} required />
          </Field>
        </div>
        <Field label="קטגוריה">
          <select className="select" value={form.category} onChange={set('category')} disabled={!!tx.deletedAt || mode === 'delete'}>
            {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="תיאור">
          <input type="text" className="input" value={form.description} onChange={set('description')} disabled={!!tx.deletedAt || mode === 'delete'} />
        </Field>

        {needsReason && (
          <Field
            label={tx.deletedAt ? 'סיבת השחזור' : mode === 'delete' ? 'סיבת המחיקה (חובה)' : 'סיבה (חובה)'}
            hint={closedMonth && !tx.deletedAt ? `${formatMonth(tx.month)} כבר נסגר. השינוי יפתח אותו מחדש, והסיבה תירשם ביומן.` : 'הסיבה נשמרת ביומן השינויים.'}
          >
            <input type="text" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={mode === 'delete' ? 'למשל: הוזן פעמיים' : 'למשל: טעות הקלדה'} required />
          </Field>
        )}

        {history.length > 0 && (
          <details className="tx-history">
            <summary><History size={15} /> היסטוריית התנועה ({history.length})</summary>
            <ul>
              {history.map(h => (
                <li key={h.id}>
                  <span className="muted">{formatDateIL(h.at.slice(0, 10))} {h.at.slice(11, 16)}</span> · {AUDIT_LABELS[h.action] || h.action}
                  {h.action === 'tx_edit' && h.before && Object.keys(h.before).map(k => (
                    <span key={k}> · {TX_FIELD_LABELS[k] || k}: {String(h.before[k] ?? '')} ← {String(h.after?.[k] ?? '')}</span>
                  ))}
                  {h.reason && <span className="muted"> · סיבה: {h.reason}</span>}
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="modal-actions">
          {tx.deletedAt ? (
            <button type="submit" className="btn btn-primary" disabled={!reason.trim()}><RotateCcw size={16} /> שחזור התנועה</button>
          ) : mode === 'delete' ? (
            <>
              <button type="submit" className="btn btn-danger-solid" disabled={!reason.trim()}><Trash2 size={16} /> מחיקה</button>
              <button type="button" className="btn btn-secondary" onClick={() => setMode('edit')}>חזרה</button>
            </>
          ) : (
            <>
              <button type="submit" className="btn btn-primary" disabled={needsReason && !reason.trim()}>שמירה</button>
              <button type="button" className="btn btn-danger btn-icon" title="מחיקת התנועה" onClick={() => setMode('delete')}><Trash2 size={16} /></button>
            </>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>סגירה</button>
        </div>
      </form>
    </Modal>
  );
}
