// ==========================================================================
// בית ומנוחה - חלונית אישור לפעולות בלתי הפיכות (מחיקה)
// ==========================================================================
import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "אישור מחיקה",
  question = "בטוח שברצונך למחוק?",
  description = "",
  subDescription = "הפעולה אינה הפיכה, והנתונים יימחקו לצמיתות.",
  confirmText = "מחיקה",
  cancelText = "ביטול"
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="modal-content modal-sm" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="row" style={{ gap: 14, flexWrap: 'nowrap' }}>
            <span className="empty-state-icon" style={{ width: 48, height: 48, background: 'var(--coral-100)', color: 'var(--coral-600)', flexShrink: 0 }}>
              <AlertTriangle size={24} />
            </span>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--coral-600)' }}>{title}</span>
              <h3 className="modal-title">{question}</h3>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="סגירה">
            <X size={20} />
          </button>
        </div>

        <div className="form-stack" style={{ gap: 12 }}>
          {description && <div style={{ color: 'var(--ink-700)', fontSize: '0.95rem' }}>{description}</div>}
          {subDescription && <div className="alert alert-error" style={{ fontSize: '0.85rem' }}>{subDescription}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-danger-solid"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              <Trash2 size={16} /> {confirmText}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>{cancelText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
