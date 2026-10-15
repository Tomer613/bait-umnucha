// ==========================================================================
// בית ומנוחה - דף מודעה בגודל A4 עם נייר המכתבים של החברה (אפיון 03)
// כותרת ולוגו למעלה, פרטי החברה מוצמדים לתחתית הדף. אם הטקסט ארוך,
// הגופן מוקטן אוטומטית כדי שהמודעה תיכנס בדף אחד.
// ==========================================================================
import React from 'react';
import { contactLine } from '../../utils/notices';

const SERVICES = 'ניהול נכסים · מבנים · בניינים · דירות';

export default function NoticeSheet({ settings, dateText, children, contentRef, className = '' }) {
  const prefix = settings?.noticeHeaderPrefix || '';
  const signoff = (settings?.noticeSignoff || 'בברכה,\nועד הבית "בית ומנוחה"').split('\n');
  return (
    <div className={`notice-sheet ${className}`}>
      <header className="ns-head">
        <svg className="ns-arch" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0 H215 C 270 40, 300 110, 290 200 H0 Z" />
        </svg>
        <div className="ns-brand">
          <img src="/logo.png" alt="" className="ns-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="ns-brand-name">{settings?.companyName || 'בית ומנוחה'}</div>
          <div className="ns-brand-tag">ניהול נכסים מקצועי</div>
        </div>
        {prefix && <div className="ns-prefix">{prefix}</div>}
        {dateText && <div className="ns-date">{dateText}</div>}
      </header>

      <div className="ns-content" ref={contentRef}>
        {children}
        <div className="ns-signoff">{signoff.map((l, i) => <div key={i}>{l}</div>)}</div>
      </div>

      <footer className="ns-foot">
        <div className="ns-services">{SERVICES}</div>
        <div className="ns-contacts">{contactLine(settings).map((c, i) => <span key={i} dir="auto">{c}</span>)}</div>
      </footer>
    </div>
  );
}
