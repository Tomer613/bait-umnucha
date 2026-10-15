// ==========================================================================
// בית ומנוחה - רכיבי ממשק משותפים (כותרת עמוד, אריח מדד, חלונית, טאבים)
// ==========================================================================
import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, AlertCircle, LayoutGrid, ChevronDown } from 'lucide-react';

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
      <span className="bavatar-num"><LayoutGrid size={{ sm: 11, md: 15, lg: 22, xl: 30 }[size] || 15} /></span>
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
      <div className={`modal-content${size === 'sm' ? ' modal-sm' : size === 'lg' ? ' modal-lg' : ''}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
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

// כרטיס הגדרות אחיד: אייקון, כותרת, שורת הסבר ותוכן
export function SettingsCard({ icon: Icon, title, sub, actions, children }) {
  return (
    <section className="card stack settings-card" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 12, flexWrap: 'nowrap', alignItems: 'flex-start' }}>
        {Icon && <span className="kpi-icon"><Icon size={18} /></span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="section-title">{title}</h3>
          {sub && <p className="section-sub">{sub}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

// כפתור עם תפריט נפתח. פריט: { label, icon, onClick } או { label, icon, file: { accept, onChange } }
export function MenuButton({ label, icon: Icon, items, variant = 'secondary', align = 'end' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <span className="menu-btn" ref={ref}>
      <button type="button" className={`btn btn-${variant}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        {Icon && <Icon size={16} />} {label} <ChevronDown size={15} />
      </button>
      {open && (
        <span className={`menu-list menu-list--${align}`} role="menu">
          {items.filter(Boolean).map(it => it.file ? (
            <label key={it.label} className="menu-item" role="menuitem">
              {it.icon && <it.icon size={16} />} <span>{it.label}</span>
              <input type="file" accept={it.file.accept} hidden onChange={(e) => { setOpen(false); it.file.onChange(e); }} />
            </label>
          ) : (
            <button key={it.label} type="button" className="menu-item" role="menuitem" onClick={() => { setOpen(false); it.onClick(); }}>
              {it.icon && <it.icon size={16} />} <span>{it.label}</span>
              {it.hint && <span className="menu-item-hint">{it.hint}</span>}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

// חלונית צד לפרטי רשומה: נפתחת מהצד השמאלי, נסגרת ב-Esc או בלחיצה מחוץ לה
export function Drawer({ isOpen, onClose, title, subtitle, children, footer }) {
  const panelRef = useRef(null);
  useEffect(() => { if (isOpen) panelRef.current?.focus(); }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div className="drawer-overlay no-print" onClick={onClose}>
      <aside className="drawer" ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div style={{ minWidth: 0 }}>
            <h2 className="drawer-title">{title}</h2>
            {subtitle && <div className="drawer-sub">{subtitle}</div>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="סגירה"><X size={20} /></button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-foot">{footer}</footer>}
      </aside>
    </div>
  );
}
