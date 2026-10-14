// ==========================================================================
// בית ומנוחה - מודל אישור מחיקה מרכזי ומעוצב ("אתה בטוח?")
// ==========================================================================
import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "אישור מחיקה",
  question = "אתה בטוח שברצונך למחוק?",
  description = "",
  subDescription = "פעולה זו היא בלתי הפיכה והנתונים יימחקו לצמיתות מהמערכת.",
  confirmText = "כן, מחק לצמיתות",
  cancelText = "ביטול",
  isDanger = true
}) {
  // סגירה בלחיצה על מקש Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          maxWidth: 480,
          width: '100%',
          padding: 26,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.28)',
          border: isDanger ? '1.5px solid #FCA5A5' : '1.5px solid var(--color-border-card)',
          position: 'relative',
          direction: 'rtl'
        }}
      >
        {/* כפתור סגירה X */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            left: 18,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#64748B',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="סגור חלונית"
        >
          <X size={20} />
        </button>

        {/* אייקון אזהרה בולט */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: isDanger ? '#FEE2E2' : '#FEF3C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {isDanger ? (
              <AlertTriangle size={28} color="#DC2626" />
            ) : (
              <Trash2 size={28} color="#D97706" />
            )}
          </div>
          <div>
            <span style={{ 
              fontSize: '0.82rem', 
              fontWeight: 800, 
              color: isDanger ? '#DC2626' : '#D97706',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {title}
            </span>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 800, 
              color: '#0F172A', 
              margin: '2px 0 0 0',
              lineHeight: 1.2
            }}>
              {question}
            </h3>
          </div>
        </div>

        {/* תוכן והסבר */}
        {description && (
          <div style={{ 
            fontSize: '0.95rem', 
            color: '#334155', 
            marginBottom: 14,
            lineHeight: 1.5,
            fontWeight: 500
          }}>
            {description}
          </div>
        )}

        {/* תיבת אזהרה נוספת */}
        {subDescription && (
          <div style={{
            background: isDanger ? '#FEF2F2' : '#FFFBEB',
            border: isDanger ? '1px solid #FECACA' : '1px solid #FDE68A',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: '0.84rem',
            color: isDanger ? '#991B1B' : '#92400E',
            fontWeight: 600,
            marginBottom: 22,
            lineHeight: 1.4
          }}>
            ⚠️ {subDescription}
          </div>
        )}

        {/* שורת כפתורי פעולה */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10, flexWrap: 'wrap-reverse' }}>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              flex: 1,
              minWidth: 140,
              background: isDanger ? '#DC2626' : '#D97706',
              color: '#FFFFFF',
              border: 'none',
              padding: '11px 20px',
              borderRadius: 8,
              fontSize: '0.92rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: isDanger ? '0 4px 14px rgba(220, 38, 38, 0.35)' : '0 4px 14px rgba(217, 119, 6, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <Trash2 size={16} />
            <span>{confirmText}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '11px 22px',
              borderRadius: 8,
              fontSize: '0.92rem',
              fontWeight: 700,
              color: '#334155',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
