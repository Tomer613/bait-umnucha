// ==========================================================================
// בית ומנוחה - אשף מכתבים, מודעות ותפוצה ב-Gmail (בניין יחיד או כלל הבניינים)
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LETTER_TEMPLATES } from '../data/initialData';
import { formatFormattedDate } from '../utils/hebrewDate';
import { 
  Send, 
  Printer, 
  Mail, 
  FileText, 
  Check, 
  Building2, 
  Users, 
  Sparkles, 
  Copy, 
  Layers 
} from 'lucide-react';

export default function LetterWizard() {
  const { currentBuilding, buildings, selectedBuildingId, systemSettings } = useApp();

  const isGlobalMode = selectedBuildingId === 'all' || !currentBuilding;

  const [selectedCategory, setSelectedCategory] = useState("גבייה וחובות");
  const [selectedTemplateId, setSelectedTemplateId] = useState("debt-1");
  const [copiedNotification, setCopiedNotification] = useState(false);

  // רשימת קטגוריות ייחודיות
  const categories = Array.from(new Set(LETTER_TEMPLATES.map(t => t.category)));

  // סינון תבניות לפי הקטגוריה הנבחרת
  const filteredTemplates = LETTER_TEMPLATES.filter(t => t.category === selectedCategory);

  // התבנית הפעילה כעת
  const activeTemplate = LETTER_TEMPLATES.find(t => t.id === selectedTemplateId) || filteredTemplates[0] || LETTER_TEMPLATES[0];

  // חישוב תאריך מותאם (עברי / לועזי / משולב) בהתאם לבחירת המשתמש
  const formattedDateStr = formatFormattedDate(
    new Date(), 
    systemSettings?.hebrewDateFormat || 'both'
  );

  // החלפת משתנים דינמיים
  const replaceVariables = (text) => {
    if (!text) return '';
    const bName = isGlobalMode ? 'הבניין שלכם (בניהול בית ומנוחה)' : currentBuilding.name;
    const signoff = systemSettings?.noticeSignoff || 'בברכת ועד הבית וההנהלה, בית ומנוחה';
    return text
      .replace(/{{שם_בניין}}/g, bName)
      .replace(/{{תאריך}}/g, formattedDateStr)
      .replace(/{{חתימה}}/g, signoff);
  };

  const [editedTitle, setEditedTitle] = useState(activeTemplate.title);
  const [editedContent, setEditedContent] = useState(activeTemplate.content);

  // בעת החלפת תבנית - עדכון התוכן
  const handleTemplateChange = (tplId) => {
    setSelectedTemplateId(tplId);
    const tpl = LETTER_TEMPLATES.find(t => t.id === tplId);
    if (tpl) {
      setEditedTitle(tpl.title);
      setEditedContent(tpl.content);
    }
  };

  // איסוף כל כתובות המייל לפי המצב (רוחבי לכל הבניינים או לבניין ספציפי)
  const tenantEmails = isGlobalMode
    ? buildings.flatMap(b => (b.apartments || []).map(a => a.email).filter(e => e && e.includes('@')))
    : (currentBuilding.apartments || []).map(a => a.email).filter(e => e && e.includes('@'));

  // פתיחה ישירה ב-Gmail דרך mailto עם עותק מוסתר (BCC)
  const openGmailBroadcast = () => {
    const subject = encodeURIComponent(replaceVariables(editedTitle));
    const body = encodeURIComponent(replaceVariables(editedContent));
    const bccList = encodeURIComponent(tenantEmails.join(','));

    const mailtoUrl = `mailto:?bcc=${bccList}&subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
  };

  // הדפסה לתלייה
  const handlePrint = () => {
    window.print();
  };

  // העתקת כל המיילים ללוח
  const copyEmailsToClipboard = () => {
    navigator.clipboard.writeText(tenantEmails.join(', '));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const activeColor = currentBuilding?.color || {
    primary: 'var(--color-gold-500)',
    tint: 'var(--color-gold-50)',
    border: 'var(--color-gold-300)',
    tagBg: 'var(--color-gold-100)',
    text: 'var(--color-gold-700)'
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Wizard Header (No-Print) */}
      <div className="no-print" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)', marginBottom: 6 }}>
          {isGlobalMode ? 'הודעות תלייה ותפוצה רוחבית לכלל הבניינים' : `אשף מכתבים ותפוצה — ${currentBuilding.name}`}
        </h2>
        <p style={{ color: 'var(--color-brown-600)', fontSize: '0.95rem' }}>
          {isGlobalMode 
            ? `הפקת מודעות לכלל 15 הבניינים במקביל, או שליחת מייל מרוכזת (BCC) לכל הדיירים בכל הבניינים ללא עלות שרת`
            : `הפקת מודעות תלייה ללוח המודעות של ${currentBuilding.name}, או שליחה בדוא״ל לכל דיירי הבניין`}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 390px) 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Side: Controls & Editor (No-Print) */}
        <div className="card no-print" style={{ padding: 22 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16, color: 'var(--color-brown-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="var(--color-gold-500)" />
            <span>הגדרות המכתב והנמענים</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* סטטוס נמענים - גלובלי או בניין ספציפי */}
            {isGlobalMode ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-gold-50)',
                border: '1.5px solid var(--color-gold-300)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Layers size={20} color="var(--color-gold-600)" />
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-gold-700)', display: 'block', fontWeight: 800 }}>
                      תפוצה רוחבית מוגדרת כעת:
                    </span>
                    <span style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                      כלל 15 הבניינים המנוהלים
                    </span>
                  </div>
                </div>
                <span className="badge badge-gold" style={{ fontSize: '0.78rem' }}>מבט-על</span>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: activeColor.tint,
                border: `1.5px solid ${activeColor.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: activeColor.primary,
                    display: 'inline-block'
                  }} />
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)', display: 'block', fontWeight: 600 }}>
                      מכתב מיועד עבור הבניין הפעיל:
                    </span>
                    <span style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                      🏢 {currentBuilding.name}
                    </span>
                  </div>
                </div>
                <span className="badge" style={{ background: activeColor.tagBg, color: activeColor.text, fontSize: '0.78rem' }}>
                  בניין בודד
                </span>
              </div>
            )}

            {/* Target Audience Summary */}
            <div style={{ 
              background: isGlobalMode ? 'var(--color-gold-50)' : activeColor.tint, 
              padding: 12, 
              borderRadius: 'var(--radius-sm)', 
              border: `1px solid ${isGlobalMode ? 'var(--color-gold-200)' : activeColor.border}`, 
              fontSize: '0.85rem' 
            }}>
              <div style={{ fontWeight: 700, color: isGlobalMode ? 'var(--color-gold-700)' : activeColor.text, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={15} />
                  <span>
                    {isGlobalMode ? `נמענים בכלל הבניינים (${tenantEmails.length} כתובות מייל):` : `נמענים ב-${currentBuilding.name} (${tenantEmails.length} כתובות מייל):`}
                  </span>
                </span>
                {tenantEmails.length > 0 && (
                  <button 
                    onClick={copyEmailsToClipboard}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-gold-700)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Copy size={13} />
                    <span>{copiedNotification ? "הועתק!" : "העתק הכל"}</span>
                  </button>
                )}
              </div>
              <p style={{ color: 'var(--color-brown-600)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                {tenantEmails.length > 0 
                  ? `${tenantEmails.slice(0, 4).join(', ')}${tenantEmails.length > 4 ? ` ועוד ${tenantEmails.length - 4}...` : ''}`
                  : (isGlobalMode ? "לא נמצאו כתובות מייל בבניינים" : "טרם עודכנו כתובות מייל לדיירי בניין זה")}
              </p>
            </div>

            {/* Category Select */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                קטגוריית מכתב:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  const firstInCat = LETTER_TEMPLATES.find(t => t.category === e.target.value);
                  if (firstInCat) handleTemplateChange(firstInCat.id);
                }}
                className="select"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Template Select */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                תבנית מוכנה:
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="select"
              >
                {filteredTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            {/* Subject Edit */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                נושא ההודעה:
              </label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="input"
              />
            </div>

            {/* Content Edit */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                גוף המכתב (ניתן לערוך):
              </label>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="textarea"
                rows={9}
                style={{ fontSize: '0.88rem', lineHeight: 1.6 }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              <button
                onClick={openGmailBroadcast}
                className="btn btn-primary"
                style={{ 
                  padding: '12px', 
                  width: '100%', 
                  background: isGlobalMode ? 'var(--color-gold-500)' : activeColor.primary 
                }}
              >
                <Send size={18} />
                <span>
                  {isGlobalMode ? `שליחה ב-Gmail לכלל הדיירים (${tenantEmails.length})` : `שליחה ב-Gmail לדיירי הבניין (${tenantEmails.length})`}
                </span>
              </button>

              <button
                onClick={handlePrint}
                className="btn btn-secondary"
                style={{ padding: '12px', width: '100%' }}
              >
                <Printer size={18} />
                <span>הדפסה מעוצבת ללוח מודעות</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Live Luxury Letterhead Preview */}
        <div className="card" style={{ padding: 40, background: '#FFFFFF', minHeight: 650, boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
          
          {/* Header Prefix (e.g. בס״ד) */}
          {systemSettings?.noticeHeaderPrefix && (
            <div style={{
              textAlign: 'left',
              fontSize: '0.86rem',
              fontWeight: 800,
              color: 'var(--color-slate-500)',
              marginBottom: 8
            }}>
              {systemSettings.noticeHeaderPrefix}
            </div>
          )}

          {/* Letterhead Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `2px solid ${isGlobalMode ? 'var(--color-gold-400)' : activeColor.primary}`,
            paddingBottom: 24,
            marginBottom: 32
          }}>
            <div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--color-brown-900)', lineHeight: 1.1 }}>
                {systemSettings?.companyName || 'בית ומנוחה'}
              </h2>
              <div style={{ fontSize: '0.9rem', color: isGlobalMode ? 'var(--color-gold-600)' : activeColor.primary, fontWeight: 700 }}>
                חברה לניהול ועד בית ואחזקת מבנים
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-brown-600)', marginTop: 4 }}>
                {isGlobalMode 
                  ? 'עבור: כלל דיירי הבניינים המנוהלים / לוח מודעות כללי'
                  : `עבור: ${currentBuilding.name} (${currentBuilding.address})`}
              </div>
            </div>

            <img 
              src="/logo.png" 
              alt="לוגו בית ומנוחה" 
              style={{ height: 60, width: 'auto', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* Letter Title */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 800, 
              color: 'var(--color-brown-900)',
              textDecoration: 'underline',
              textUnderlineOffset: 6
            }}>
              {replaceVariables(editedTitle)}
            </h1>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-brown-600)', marginTop: 8 }}>
              תאריך: {formattedDateStr}
            </div>
          </div>

          {/* Letter Body */}
          <div style={{
            fontSize: '1.05rem',
            lineHeight: 1.8,
            color: 'var(--color-brown-800)',
            whiteSpace: 'pre-line',
            minHeight: 280
          }}>
            {replaceVariables(editedContent)}
          </div>

          {/* Letterhead Footer */}
          <div style={{
            marginTop: 48,
            paddingTop: 20,
            borderTop: '1px solid var(--color-beige-divider)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: 'var(--color-brown-600)',
            flexWrap: 'wrap',
            gap: 10
          }}>
            <div>
              <strong>{systemSettings?.companyName || 'בית ומנוחה'}</strong>
              {systemSettings?.managerName ? ` • מנהל: ${systemSettings.managerName}` : ''}
              {' — ניהול ועד בית, שירותי אחזקה, מעליות וגבייה'}
            </div>
            <div>
              {systemSettings?.companyPhone ? `${systemSettings.companyPhone} | ` : ''}
              {systemSettings?.emailList && systemSettings.emailList.length > 0
                ? systemSettings.emailList
                    .filter(e => e.email?.trim())
                    .map(e => e.label?.trim() ? `${e.label.trim()}: ${e.email.trim()}` : e.email.trim())
                    .join(' | ')
                : (systemSettings?.companyEmail ? `מייל: ${systemSettings.companyEmail}` : '')}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
