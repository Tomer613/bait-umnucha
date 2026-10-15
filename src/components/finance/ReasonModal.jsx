// ==========================================================================
// בית ומנוחה - חלונית סיבה: פעולה שמחייבת הסבר (מחיקה, שינוי בחודש סגור, ביטול קליטה)
// הסיבה נשמרת ביומן השינויים (אפיון 04, סעיף 9)
// ==========================================================================
import React, { useState } from 'react';
import { Modal, Field } from '../ui';

export default function ReasonModal({ isOpen, onClose, onConfirm, title, text, placeholder = 'למשל: הוזן פעמיים', confirmText = 'אישור', danger = false }) {
  const [reason, setReason] = useState('');

  const close = () => {
    setReason('');
    onClose();
  };

  const submit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <Modal isOpen={isOpen} onClose={close} size="sm" title={title} subtitle={text}>
      <form onSubmit={submit} className="form-stack">
        <Field label="סיבה" hint="הסיבה נשמרת ביומן השינויים של הבניין.">
          <input type="text" required autoFocus value={reason} onChange={(e) => setReason(e.target.value)} className="input" placeholder={placeholder} />
        </Field>
        <div className="modal-actions">
          <button type="submit" className={`btn ${danger ? 'btn-danger-solid' : 'btn-primary'}`} disabled={!reason.trim()}>{confirmText}</button>
          <button type="button" className="btn btn-secondary" onClick={close}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}
