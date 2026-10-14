// ==========================================================================
// בית ומנוחה - רכיבי ממשק משותפים (כותרת עמוד, אריח מדד, חלונית, טאבים)
// ==========================================================================
import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, LayoutGrid } from 'lucide-react';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header no-print">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, meta, icon: Icon, variant }) {
  return (
    <div className={`kpi${variant ? ` kpi--${variant}` : ''}`}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {Icon && <span className="kpi-icon"><Icon size={18} /></span>}
      </div>
      <div className="kpi-value">{value}</div>
      {meta && <div className="kpi-meta">{meta}</div>}
    </div>
  );
}

// שלט הבניין: לוח זכוכית חלבית שמרחף מעל משטח בצבע הבניין, עם מספר הבית מובלט
// (או ראשי תיבות אם אין מספר בשם)
function avatarLabel(name = '') {
  const num = name.match(/\d+/);
  if (num) return num[0];
  const words = name.trim().split(/\s+/);
  return words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2);
}

export function BuildingAvatar({ name, color, size = 'md' }) {
  return (
    <span className={`bavatar bavatar--${size}`} style={{ '--c': color?.primary || 'var(--petrol-600)' }} aria-hidden="true">
      <span className="bavatar-num">{avatarLabel(name)}</span>
    </span>
  );
}

// אריח "כלל הבניינים"
export function AllBuildingsAvatar({ size = 'md' }) {
  return (
    <span className={`bavatar bavatar--${size} bavatar--all`} aria-hidden="true">
      <span className="bavatar-num"><LayoutGrid size={size === 'sm' ? 11 : 15} /></span>
    </span>
  );
}

// שם בניין עם נקודת הצבע שלו; לחיץ אם הועבר onClick
export function BuildingName({ name, color, onClick, sub }) {
  const content = (
    <>
      <BuildingAvatar name={name} color={color} size="sm" />
      <span>
        {name}
        {sub && <span className="cell-sub">{sub}</span>}
      </span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" className="bname bname-link" onClick={onClick} title={`מעבר לבניין ${name}`}>
        {content}
      </button>
    );
  }
  return <span className="bname">{content}</span>;
}

export function SubTabs({ tabs, active, onChange }) {
  return (
    <div className="subtabs no-print" role="tablist">
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`subtab${active === t.id ? ' is-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <t.icon size={16} />}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`seg ${className}`}>
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          className={`seg-btn${value === o.id ? ' is-active' : ''}`}
          onClick={() => onChange(o.id)}
        >
          <span>{o.label}</span>
          {o.count !== undefined && <span className="seg-count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, subtitle, children, size }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content${size === 'sm' ? ' modal-sm' : ''}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{title}</h3>
            {subtitle && <p className="modal-sub">{subtitle}</p>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="סגירה">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state">
      {Icon && <div className="empty-state-icon"><Icon size={26} /></div>}
      {title && <h3>{title}</h3>}
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

// הודעת סטטוס זמנית: [message, show] — show('טקסט') או show('טקסט', 'error')
export function useFlash(timeout = 5000) {
  const [flash, setFlash] = useState(null);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), timeout);
    return () => clearTimeout(t);
  }, [flash, timeout]);
  const show = (text, type = 'success') => setFlash({ text, type });
  return [flash, show];
}

export function FlashMessage({ flash }) {
  if (!flash) return null;
  const isError = flash.type === 'error';
  return (
    <div className={`alert ${isError ? 'alert-error' : 'alert-success'} no-print`} role="status">
      {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      <span>{flash.text}</span>
    </div>
  );
}
