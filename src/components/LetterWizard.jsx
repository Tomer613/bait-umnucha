// ==========================================================================
// בית ומנוחה - אשף מכתבים ותפוצה ב-Gmail (ללא עלות שרת)
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LETTER_TEMPLATES } from '../data/initialData';
import { 
  Send, 
  Printer, 
  Mail, 
  FileText, 
  Check, 
  Building, 
  Users, 
  Sparkles,
  Copy
} from 'lucide-react';

export default function LetterWizard() {
  const { currentBuilding, buildings, setSelectedBuildingId } = useApp();

  const [selectedCategory, setSelectedCategory] = useState("גבייה וחובות");
  const [selectedTemplateId, setSelectedTemplateId] = useState("debt-1");
  const [targetBuildingId, setTargetBuildingId] = useState(currentBuilding ? currentBuilding.id : (buildings[0] ? buildings[0].id : ''));
  const [copiedNotification, setCopiedNotification] = useState(false);

  // הבניין הנבחר למכתב
  const targetBuilding = buildings.find(b => b.id === targetBuildingId) || currentBuilding || buildings[0];

  // רשימת קטגוריות ייחודיות
  const categories = Array.from(new Set(LETTER_TEMPLATES.map(t => t.category)));

  // סינון תבניות לפי הקטגוריה הנבחרת
  const filteredTemplates = LETTER_TEMPLATES.filter(t => t.category === selectedCategory);

  // התבנית הפעילה כעת
  const activeTemplate = LETTER_TEMPLATES.find(t => t.id === selectedTemplateId) || filteredTemplates[0] || LETTER_TEMPLATES[0];

  // החלפת משתנים דינמיים (שם הבניין, תאריך)
  const replaceVariables = (text) => {
    if (!text) return '';
    const bName = targetBuilding ? targetBuilding.name : 'הבניין';
    const dateStr = new Date().toLocaleDateString('he-IL');
    return text
      .replace(/{{שם_בניין}}/g, bName)
      .replace(/{{תאריך}}/g, dateStr);
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

  // איסוף כל כתובות המייל של דיירי הבניין הנבחר
  const tenantEmails = (targetBuilding && targetBuilding.apartments)
    ? targetBuilding.apartments.map(a => a.email).filter(e => e && e.includes('@'))
    : [];

  // פתיחה ישירה ב-Gmail דרך mailto עם עותק מוסתר (BCC)
  const openGmailBroadcast = () => {
    const subject = encodeURIComponent(replaceVariables(editedTitle));
    const body = encodeURIComponent(replaceVariables(editedContent));
    const bccList = encodeURIComponent(tenantEmails.join(','));

    // יצירת קישור mailto מלא
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

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Wizard Header (No-Print) */}
      <div className="no-print" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)', marginBottom: 6 }}>
          אשף מכתבים, מודעות תלייה ותפוצה ב-Gmail
        </h2>
        <p style={{ color: 'var(--color-brown-600)', fontSize: '0.95rem' }}>
          הפקת מודעות ייצוגיות ללוח המודעות, או שליחה מרוכזת לכל דיירי הבניין ישירות מג'ימייל ללא שום עלות
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Side: Controls & Editor (No-Print) */}
        <div className="card no-print" style={{ padding: 22 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16, color: 'var(--color-brown-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="var(--color-gold-500)" />
            <span>הגדרות המכתב והנמענים</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Target Building Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                בניין יעד למכתב:
              </label>
              <select
                value={targetBuildingId}
                onChange={(e) => setTargetBuildingId(e.target.value)}
                className="select"
              >
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name} — {b.address}</option>
                ))}
              </select>
            </div>

            {/* Target Audience Summary */}
            <div style={{ background: 'var(--color-gold-50)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-gold-200)', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--color-gold-700)', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={15} />
                  <span>נמענים בבניין ({tenantEmails.length} כתובות מייל):</span>
                </span>
                {tenantEmails.length > 0 && (
                  <button 
                    onClick={copyEmailsToClipboard}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-gold-700)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Copy size={12} />
                    <span>{copiedNotification ? 'הועתק!' : 'העתק'}</span>
                  </button>
                )}
              </div>
              <div style={{ color: 'var(--color-brown-600)', wordBreak: 'break-all' }}>
                {tenantEmails.length > 0 
                  ? tenantEmails.slice(0, 3).join(', ') + (tenantEmails.length > 3 ? ` ועוד ${tenantEmails.length - 3}...` : '')
                  : 'לא הוזנו כתובות מייל לדיירי בניין זה.'}
              </div>
            </div>

            {/* Category Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                קטגוריה ראשית:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  const firstTpl = LETTER_TEMPLATES.find(t => t.category === e.target.value);
                  if (firstTpl) handleTemplateChange(firstTpl.id);
                }}
                className="select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Subcategory / Template Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                בחר נוסח מוכן (תבנית):
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="select"
              >
                {filteredTemplates.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.subcategory} — {tpl.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Editable Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                כותרת המכתב / נושא המייל:
              </label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="input"
              />
            </div>

            {/* Editable Content */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-brown-700)' }}>
                תוכן המכתב (ניתן לעריכה חופשית):
              </label>
              <textarea
                rows={9}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="textarea"
                style={{ resize: 'vertical', fontSize: '0.88rem' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              <button
                onClick={openGmailBroadcast}
                className="btn btn-primary"
                style={{ padding: '14px', width: '100%' }}
              >
                <Mail size={18} />
                <span>פתיחה ושליחה בתפוצה בג'ימייל (BCC)</span>
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
        <div className="card" style={{ padding: 40, background: '#FFFFFF', minHeight: 650, boxShadow: 'var(--shadow-lg)' }}>
          
          {/* Letterhead Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid var(--color-gold-400)',
            paddingBottom: 24,
            marginBottom: 32
          }}>
            <div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--color-brown-900)', lineHeight: 1.1 }}>
                בית ומנוחה
              </h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-gold-600)', fontWeight: 600 }}>
                חברה לניהול ועד בית ואחזקת מבנים
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', marginTop: 4 }}>
                עבור: {targetBuilding ? `${targetBuilding.name} (${targetBuilding.address})` : 'דיירי הבניין'}
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <img 
                src="/logo.png" 
                alt="לוגו" 
                style={{ height: 65, width: 'auto', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', marginTop: 6 }}>
                תאריך: {new Date().toLocaleDateString('he-IL')}
              </div>
            </div>
          </div>

          {/* Letter Body */}
          <div style={{ padding: '10px 14px' }}>
            {/* Title */}
            <h3 style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--color-brown-900)',
              marginBottom: 24,
              textAlign: 'center',
              textDecoration: 'underline',
              textUnderlineOffset: '6px',
              textDecorationColor: 'var(--color-gold-400)'
            }}>
              {replaceVariables(editedTitle)}
            </h3>

            {/* Paragraphs */}
            <div style={{
              fontSize: '1.08rem',
              lineHeight: 1.8,
              color: 'var(--color-brown-800)',
              whiteSpace: 'pre-wrap'
            }}>
              {replaceVariables(editedContent)}
            </div>
          </div>

          {/* Letterhead Footer */}
          <div style={{
            marginTop: 60,
            paddingTop: 24,
            borderTop: '1px solid var(--color-beige-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: 'var(--color-brown-600)'
          }}>
            <div>
              בברכה, הנהלת בית ומנוחה | טלפון שירות וחירום: 050-0000000
            </div>
            <div style={{ fontWeight: 700, color: 'var(--color-gold-700)' }}>
              איכות חיים ושקט נפשי בבניין שלכם
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
