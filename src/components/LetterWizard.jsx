// ==========================================================================
// בית ומנוחה - אשף מכתבים, מודעות תלייה ותפוצה במייל (בניין יחיד או כלל הבניינים)
// ==========================================================================
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LETTER_TEMPLATES } from '../data/initialData';
import { formatFormattedDate } from '../utils/hebrewDate';
import { Send, Printer, Users, Copy, Check } from 'lucide-react';
import { Field, BuildingAvatar, AllBuildingsAvatar } from './ui';

export default function LetterWizard() {
  const { currentBuilding, buildings, systemSettings, letterPreset, setLetterPreset } = useApp();
  // אם הגענו ממשימה (למשל מכתב התראה) — פותחים עם התבנית שלה
  const initialTemplate = LETTER_TEMPLATES.find(t => t.id === letterPreset) || LETTER_TEMPLATES[0];

  const isGlobalMode = !currentBuilding;
  const companyName = systemSettings?.companyName || 'בית ומנוחה';

  const categories = Array.from(new Set(LETTER_TEMPLATES.map(t => t.category)));
  const [selectedCategory, setSelectedCategory] = useState(initialTemplate.category);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate.id);
  const [editedTitle, setEditedTitle] = useState(initialTemplate.title);
  const [editedContent, setEditedContent] = useState(initialTemplate.content);

  // הבחירה המוקדמת חד-פעמית
  useEffect(() => {
    if (letterPreset) setLetterPreset(null);
  }, [letterPreset, setLetterPreset]);
  const [copied, setCopied] = useState(false);

  const filteredTemplates = LETTER_TEMPLATES.filter(t => t.category === selectedCategory);
  const formattedDateStr = formatFormattedDate(new Date(), systemSettings?.hebrewDateFormat || 'both');

  const replaceVariables = (text) => {
    if (!text) return '';
    const bName = isGlobalMode ? 'בניינכם' : currentBuilding.name;
    const signoff = systemSettings?.noticeSignoff || `בברכה,\n${companyName}`;
    return text
      .replace(/{{שם_בניין}}/g, bName)
      .replace(/{{תאריך}}/g, formattedDateStr)
      .replace(/{{חתימה}}/g, signoff);
  };

  const handleTemplateChange = (tplId) => {
    const tpl = LETTER_TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;
    setSelectedTemplateId(tplId);
    setEditedTitle(tpl.title);
    setEditedContent(tpl.content);
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    const first = LETTER_TEMPLATES.find(t => t.category === cat);
    if (first) handleTemplateChange(first.id);
  };

  const scopeBuildings = currentBuilding ? [currentBuilding] : buildings;
  const tenantEmails = scopeBuildings.flatMap(b => (b.apartments || []).map(a => a.email).filter(e => e && e.includes('@')));

  const openMailBroadcast = () => {
    const subject = encodeURIComponent(replaceVariables(editedTitle));
    const body = encodeURIComponent(replaceVariables(editedContent));
    const bcc = encodeURIComponent(tenantEmails.join(','));
    window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
  };

  const copyEmails = async () => {
    try {
      await navigator.clipboard.writeText(tenantEmails.join(', '));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const contactLine = [
    systemSettings?.companyPhone,
    ...(systemSettings?.emailList || []).filter(e => e.email?.trim()).map(e => e.email.trim())
  ].filter(Boolean).join(' | ');

  return (
    <div className="letter-split">
      {/* עורך */}
      <div className="card no-print form-stack">
        <div className="info-panel stack" style={{ gap: 8 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="row" style={{ gap: 8, fontWeight: 600 }}>
              {isGlobalMode ? <AllBuildingsAvatar size="sm" /> : <BuildingAvatar name={currentBuilding.name} color={currentBuilding.color} size="sm" />}
              {isGlobalMode ? `כל דיירי ${buildings.length} הבניינים` : `דיירי ${currentBuilding.name}`}
            </span>
            <span className="badge badge-petrol"><Users size={12} /> {tenantEmails.length} כתובות</span>
          </div>
          {tenantEmails.length > 0 ? (
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
              <span className="muted" dir="ltr" style={{ fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                {tenantEmails.slice(0, 3).join(', ')}{tenantEmails.length > 3 ? ` ועוד ${tenantEmails.length - 3}` : ''}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={copyEmails}>
                {copied ? <><Check size={13} /> הועתק</> : <><Copy size={13} /> העתקה</>}
              </button>
            </div>
          ) : (
            <span className="muted" style={{ fontSize: '0.86rem' }}>אין כתובות מייל לדיירים. הוסיפו אותן במסך הדיירים.</span>
          )}
        </div>

        <div className="field-row">
          <Field label="קטגוריה">
            <select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="select">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="תבנית">
            <select value={selectedTemplateId} onChange={(e) => handleTemplateChange(e.target.value)} className="select">
              {filteredTemplates.map(t => <option key={t.id} value={t.id}>{t.subcategory}</option>)}
            </select>
          </Field>
        </div>

        <Field label="נושא">
          <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="input" />
        </Field>

        <Field label="תוכן המכתב" hint="אפשר להשתמש ב-{{שם_בניין}} וב-{{תאריך}}, והם יוחלפו אוטומטית.">
          <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="textarea" rows={10} />
        </Field>

        <div className="stack" style={{ gap: 8 }}>
          <button onClick={openMailBroadcast} className="btn btn-primary btn-block" disabled={tenantEmails.length === 0}>
            <Send size={17} /> פתיחה בתוכנת המייל ({tenantEmails.length} נמענים בעותק מוסתר)
          </button>
          <button onClick={() => window.print()} className="btn btn-secondary btn-block">
            <Printer size={17} /> הדפסה ללוח המודעות
          </button>
        </div>
      </div>

      {/* תצוגה מקדימה של המכתב */}
      <div className="card letter-sheet">
        {systemSettings?.noticeHeaderPrefix && (
          <div style={{ textAlign: 'left', fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink-500)', marginBottom: 6 }}>
            {systemSettings.noticeHeaderPrefix}
          </div>
        )}

        <div className="letterhead">
          <div>
            <div className="letterhead-name">{companyName}</div>
            <div className="letterhead-tag">ניהול ועד בית ואחזקת מבנים</div>
            <div className="muted title-with-plaque" style={{ fontSize: '0.89rem', marginTop: 8, gap: 8 }}>
              {!isGlobalMode && <BuildingAvatar name={currentBuilding.name} color={currentBuilding.color} size="sm" />}
              {isGlobalMode ? 'לכל דיירי הבניינים המנוהלים' : `לדיירי ${currentBuilding.name}${currentBuilding.address ? `, ${currentBuilding.address}` : ''}`}
            </div>
          </div>
          <img src="/logo.png" alt="" style={{ height: 64, width: 'auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700 }}>{replaceVariables(editedTitle)}</h1>
          <div className="muted" style={{ fontSize: '0.91rem', marginTop: 6 }}>{formattedDateStr}</div>
        </div>

        <div className="letter-body">{replaceVariables(editedContent)}</div>

        <div className="report-footer">
          <span>
            <strong>{companyName}</strong>
            {systemSettings?.managerName ? ` · מנהל: ${systemSettings.managerName}` : ''}
          </span>
          {contactLine && <span>{contactLine}</span>}
        </div>
      </div>
    </div>
  );
}
