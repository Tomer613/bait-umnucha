// ==========================================================================
// בית ומנוחה - ניהול מצבי דוח שמורים (שינוי שם, מחיקה עם אישור, שחזור מצבים מקוריים)
// שמירת מצב חדש נעשית במסך הדוחות; הניהול — רק כאן (עקרונות, סעיף 1)
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bookmark, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { Field, Segmented, Modal } from './ui';
import ConfirmModal from './ConfirmModal';

const TYPE_LABELS = { expenses: 'דוח הוצאות שנתי', debts: 'דוח תקבולים וחובות' };

function describe(p) {
  return [
    TYPE_LABELS[p.reportType] || 'דוח',
    p.entrance && p.entrance !== 'all' ? `כניסה ${p.entrance}` : 'כל הבניין',
    p.includeLevies ? 'כולל קופות מיוחדות' : null
  ].filter(Boolean).join(' · ');
}

export default function ReportPresetsSettings() {
  const { reportPresets, deletePreset, updatePreset, restoreDefaultPresets, defaultPresetIds } = useApp();
  const [editing, setEditing] = useState(null); // עותק של המצב שבעריכה
  const [toDelete, setToDelete] = useState(null);
  const missingDefaults = defaultPresetIds.filter(id => !reportPresets.some(p => p.id === id)).length;

  const save = (e) => {
    e.preventDefault();
    if (!editing.name.trim()) return;
    updatePreset(editing.id, editing);
    setEditing(null);
  };
  const duplicate = editing && reportPresets.find(p => p.id !== editing.id && p.reportType === editing.reportType && !!p.includeLevies === !!editing.includeLevies && (p.entrance || 'all') === ((editing.entrance || '').trim() || 'all'));

  return (
    <div className="stack" style={{ gap: 18, maxWidth: 820 }}>
      <div className="card stack" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
          <span className="kpi-icon"><Bookmark size={18} /></span>
          <div>
            <h3 className="section-title">מצבי דוח שמורים</h3>
            <p className="section-sub">שילובי הגדרות שנשמרו במסך הדוחות, לטעינה בלחיצה אחת. כאן עורכים (שם והגדרות) או מוחקים. מצב חדש שומרים מתוך מסך הדוחות.</p>
          </div>
        </div>

        {reportPresets.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>אין מצבים שמורים.</p>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {reportPresets.map(p => (
              <div key={p.id} className="preset-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cell-strong">{p.name}</div>
                  <div className="muted" style={{ fontSize: '0.86rem' }}>{describe(p)}</div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button type="button" className="btn btn-secondary btn-sm btn-icon" title="עריכה" onClick={() => setEditing({ ...p, entrance: p.entrance || 'all' })}><Pencil size={14} /></button>
                  <button type="button" className="btn btn-danger btn-sm btn-icon" title="מחיקה" onClick={() => setToDelete(p)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {missingDefaults > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={restoreDefaultPresets}>
            <RotateCcw size={14} /> שחזור {missingDefaults === 1 ? 'מצב מקורי שנמחק' : `${missingDefaults} מצבים מקוריים שנמחקו`}
          </button>
        )}
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="עריכת מצב שמור" subtitle={editing ? `"${reportPresets.find(p => p.id === editing.id)?.name || ''}"` : ''}>
        {editing && (
          <form className="form-stack" onSubmit={save}>
            <Field label="שם">
              <input type="text" autoFocus className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <div className="field">
              <span className="field-label">סוג הדוח</span>
              <Segmented value={editing.reportType} onChange={(v) => setEditing({ ...editing, reportType: v })} options={[{ id: 'expenses', label: 'הוצאות שנתי' }, { id: 'debts', label: 'תקבולים וחובות' }]} />
            </div>
            <Field label="היקף דירות" hint="ריק = כל הבניין. לכניסה מסוימת כתבו את האות שלה, למשל א.">
              <input type="text" className="input" value={editing.entrance === 'all' ? '' : editing.entrance} onChange={(e) => setEditing({ ...editing, entrance: e.target.value || 'all' })} placeholder="כל הבניין" />
            </Field>
            <label className="check-chip" style={{ alignSelf: 'flex-start' }}>
              <input type="checkbox" checked={!!editing.includeLevies} onChange={(e) => setEditing({ ...editing, includeLevies: e.target.checked })} />
              צירוף קופות גבייה מיוחדות
            </label>
            {duplicate && <div className="alert alert-warning"><span>אותן הגדרות כבר שמורות בשם "{duplicate.name}".</span></div>}
            <div className="modal-actions">
              <button type="submit" className="btn btn-primary" disabled={!editing.name.trim()}>שמירת השינויים</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>ביטול</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => { deletePreset(toDelete.id); setToDelete(null); }}
        title="מחיקת מצב שמור"
        question={`למחוק את "${toDelete?.name || ''}"?`}
        description={toDelete ? describe(toDelete) : ''}
        subDescription="רק השם וההגדרות השמורות יימחקו. הדוחות עצמם לא מושפעים."
        confirmText="מחיקה"
      />
    </div>
  );
}
