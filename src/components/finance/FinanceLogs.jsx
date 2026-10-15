// ==========================================================================
// בית ומנוחה - היסטוריית קליטות (סעיף 5.4) ויומן שינויים (סעיף 9) של בניין
// ==========================================================================
import React, { useState } from 'react';
import { FileUp, ScrollText, Undo2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EmptyState, Segmented } from '../ui';
import { formatILS, formatMonth } from '../../utils/format';
import { formatDateIL, AUDIT_LABELS, TX_FIELD_LABELS } from '../../utils/ledger';
import ReasonModal from './ReasonModal';

const when = (iso) => `${formatDateIL(iso.slice(0, 10))} ${iso.slice(11, 16)}`;

export function ImportHistory({ building, onFlash }) {
  const { undoImport } = useApp();
  const [undoTarget, setUndoTarget] = useState(null);
  const batches = building.importBatches || [];

  if (batches.length === 0) {
    return <EmptyState icon={FileUp} title="עוד לא נקלטו קבצים" text="קובצי עו״ש וחיובית שייקלטו יופיעו כאן, עם אפשרות לבטל קליטה." />;
  }

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>נקלט</th><th>סוג</th><th>קובץ</th><th>חודשים</th><th className="num">תנועות</th><th /></tr>
          </thead>
          <tbody>
            {batches.map(bt => (
              <tr key={bt.id} className={bt.undoneAt ? 'is-muted' : ''}>
                <td className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{when(bt.at)}</td>
                <td><span className={`badge ${bt.type === 'bank' ? 'badge-petrol' : 'badge-gold'}`}>{bt.type === 'bank' ? 'עו״ש' : 'חיובית'}</span></td>
                <td>
                  <bdi dir="ltr">{bt.fileName}</bdi>
                  {bt.type === 'hiyuvit' && bt.totals && <span className="cell-sub">נטו {formatILS(bt.totals.net)} · {bt.counts?.failed || 0} נכשלו</span>}
                  {bt.undoneAt && <span className="cell-sub">בוטלה ב-{formatDateIL(bt.undoneAt.slice(0, 10))} · {bt.undoReason}</span>}
                </td>
                <td>{(bt.months || []).map(formatMonth).join(', ')}</td>
                <td className="num">{bt.count}</td>
                <td>
                  {bt.type === 'bank' && !bt.undoneAt && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUndoTarget(bt)}>
                      <Undo2 size={14} /> ביטול הקליטה
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ReasonModal
        isOpen={!!undoTarget}
        onClose={() => setUndoTarget(null)}
        danger
        title="ביטול קליטה"
        text={undoTarget ? `כל ${undoTarget.count} התנועות שנקלטו מ"${undoTarget.fileName}" יוסרו. אפשר לקלוט אחר כך את הקובץ הנכון.` : ''}
        placeholder="למשל: נבחר קובץ של בניין אחר"
        confirmText="ביטול הקליטה"
        onConfirm={(reason) => {
          undoImport(building.id, undoTarget.id, reason);
          onFlash(`הקליטה של "${undoTarget.fileName}" בוטלה.`);
          setUndoTarget(null);
        }}
      />
    </>
  );
}

const FILTERS = [
  { id: 'all', label: 'הכול' },
  { id: 'tx', label: 'תנועות' },
  { id: 'import', label: 'קליטות' },
  { id: 'month', label: 'סגירת חודש' }
];

const inFilter = (action, f) => {
  if (f === 'all') return true;
  if (f === 'tx') return action.startsWith('tx_');
  if (f === 'import') return action.startsWith('import');
  if (f === 'month') return action.startsWith('month_') || action === 'opening_balance';
  return true;
};

function describe(e) {
  if (e.action === 'tx_edit' && e.before) {
    return Object.keys(e.before).map(k => `${TX_FIELD_LABELS[k] || k}: ${e.before[k] ?? ''} ← ${e.after?.[k] ?? ''}`).join(' · ');
  }
  if ((e.action === 'tx_delete' || e.action === 'tx_add' || e.action === 'tx_restore') && (e.before || e.after)) {
    const tx = e.before || e.after;
    return `${formatDateIL(tx.date)} · ${tx.category} · ${tx.description} · ${formatILS(tx.amount)}`;
  }
  if (e.action === 'month_close' || e.action === 'month_reopen') return formatMonth(e.note);
  if ((e.action === 'import' || e.action === 'import_undo') && e.after?.fileName) {
    return <><bdi dir="ltr">{e.after.fileName}</bdi> · {e.note}</>;
  }
  if (e.action === 'opening_balance') return `${e.note === 'cash' ? 'מזומן' : 'בנק'}: ${formatILS(e.before?.amount)} ← ${formatILS(e.after?.amount)}`;
  return e.note || '';
}

export function AuditLog({ building }) {
  const [filter, setFilter] = useState('all');
  const entries = (building.auditLog || []).filter(e => inFilter(e.action, filter));

  return (
    <div className="stack" style={{ gap: 12 }}>
      <Segmented value={filter} onChange={setFilter} options={FILTERS} />
      {entries.length === 0 ? (
        <EmptyState icon={ScrollText} title="אין רשומות" text="כל שינוי בכספים של הבניין (הוספה, עריכה, מחיקה, קליטה וסגירת חודש) נרשם כאן." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>מתי</th><th>מי</th><th>פעולה</th><th>פירוט</th><th>סיבה</th></tr></thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{when(e.at)}</td>
                  <td>{e.by}</td>
                  <td className="cell-strong">{AUDIT_LABELS[e.action] || e.action}</td>
                  <td>{describe(e)}</td>
                  <td>{e.reason || <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
