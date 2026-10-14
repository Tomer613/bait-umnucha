// ==========================================================================
// בית ומנוחה - ניהול פניות ותקלות ועד (בסגנון GitHub Issues)
// מבנה ממשק אחיד, עקבי וקבוע לחלוטין בין "כלל הבניינים" לבין "בניין מסוים"
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MessageSquare, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Send, 
  X, 
  Settings2
} from 'lucide-react';

export default function IssuesTracker() {
  const { currentBuilding, buildings, setSelectedBuildingId, selectedBuildingId, addIssue, addIssueComment, toggleIssueStatus, updateBuildingSettings } = useApp();

  const isGlobalMode = !currentBuilding || selectedBuildingId === 'all';

  const [statusFilter, setStatusFilter] = useState('open'); // 'open' | 'closed' | 'all'
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBuildingForNewIssue, setSelectedBuildingForNewIssue] = useState(buildings[0]?.id || '');
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('נציג ועד הבית');
  const [newInitialComment, setNewInitialComment] = useState('');
  const [commentReplyText, setCommentReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // איסוף הפניות הרלוונטיות לתצוגה כעת (בניין יחיד או כלל הבניינים)
  const displayedIssues = isGlobalMode
    ? buildings.flatMap(b => (b.issues || []).map(issue => ({
        ...issue,
        buildingId: b.id,
        buildingName: b.name,
        buildingColor: b.color || { primary: 'var(--color-gold-500)', tint: 'var(--color-gold-50)' }
      })))
    : (currentBuilding?.issues || []).map(issue => ({
        ...issue,
        buildingId: currentBuilding.id,
        buildingName: currentBuilding.name,
        buildingColor: currentBuilding.color || { primary: 'var(--color-gold-500)', tint: 'var(--color-gold-50)' }
      }));

  // סינון לפי סטטוס וחיפוש
  const filteredIssues = displayedIssues.filter(iss => {
    if (statusFilter !== 'all' && iss.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      iss.title.toLowerCase().includes(q) ||
      iss.buildingName.toLowerCase().includes(q) ||
      (iss.author && iss.author.toLowerCase().includes(q))
    );
  });

  // הפנייה הפעילה שנבחרה לצפייה
  const activeIssue = displayedIssues.find(i => i.id === selectedIssueId) || filteredIssues[0] || displayedIssues[0];

  const handleCreateIssue = (e) => {
    e.preventDefault();
    if (!newTitle || !newInitialComment) return;

    const bId = currentBuilding ? currentBuilding.id : selectedBuildingForNewIssue;
    addIssue(bId, newTitle, newAuthor, newInitialComment);
    setShowAddModal(false);
    setNewTitle('');
    setNewInitialComment('');
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!commentReplyText.trim() || !activeIssue) return;

    addIssueComment(activeIssue.buildingId, activeIssue.id, "מנהל החברה", commentReplyText.trim());
    setCommentReplyText('');
  };

  const handleToggleStatus = (issue) => {
    toggleIssueStatus(issue.buildingId, issue.id);
  };

  // שליטה במתגי הרשאות נציגי הבניין (כשנבחר בניין מסוים)
  const toggleIssuePermission = (val) => {
    if (currentBuilding) {
      updateBuildingSettings(currentBuilding.id, { issuesEnabled: val });
    }
  };

  const totalOpen = displayedIssues.filter(i => i.status === 'open').length;
  const totalClosed = displayedIssues.filter(i => i.status === 'closed').length;

  const activeColor = currentBuilding?.color || {
    primary: 'var(--color-gold-500)',
    tint: 'var(--color-gold-50)',
    border: 'var(--color-gold-300)'
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* --------------------------------------------------------------------
          באנר ראשי עליון — קבוע ואחיד לחלוטין בשני המצבים!
          -------------------------------------------------------------------- */}
      <div className="card" style={{ 
        padding: '22px 24px', 
        marginBottom: 24, 
        border: `1.5px solid ${isGlobalMode ? 'var(--color-gold-300)' : activeColor.border}`, 
        background: isGlobalMode 
          ? 'linear-gradient(135deg, #FFFFFF 0%, var(--color-gold-50) 100%)' 
          : `linear-gradient(135deg, #FFFFFF 0%, ${activeColor.tint} 100%)` 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-gold" style={{ fontSize: '0.8rem' }}>
                {isGlobalMode ? "מוקד שירות מרכזי" : "ערוץ פניות פעיל"}
              </span>
              <span style={{ fontSize: '0.85rem', color: isGlobalMode ? 'var(--color-gold-700)' : activeColor.primary, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {!isGlobalMode && (
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: activeColor.primary, display: 'inline-block' }} />
                )}
                <span>{isGlobalMode ? `כלל ${buildings.length} הבניינים המנוהלים` : currentBuilding.name}</span>
              </span>
            </div>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
              מרכז פניות ותקלות ועד (Issues)
            </h2>

            <p style={{ color: 'var(--color-brown-600)', fontSize: '0.92rem', margin: '6px 0 0' }}>
              {isGlobalMode
                ? "מעקב שירות ותקלות מול נציגי הבניינים והדיירים בסגנון GitHub: מעליות, אינסטלציה, שערים וחשמל."
                : `ערוץ תקשורת ישיר, מעקב תקלות ושרשור תגובות מול נציגי הבניין בסגנון GitHub עבור ${currentBuilding.name}.`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* מתג הרשאה לנציג (מוצג בבניין מסוים) */}
            {!isGlobalMode && currentBuilding && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-beige-border)',
                fontSize: '0.82rem'
              }}>
                <Settings2 size={15} color="var(--color-gold-600)" />
                <span style={{ fontWeight: 600, color: 'var(--color-brown-700)' }}>ערוץ פניות נציג:</span>
                <span className="switch">
                  <input
                    type="checkbox"
                    checked={currentBuilding.settings ? currentBuilding.settings.issuesEnabled : true}
                    onChange={(e) => toggleIssuePermission(e.target.checked)}
                  />
                  <span className="slider"></span>
                </span>
              </div>
            )}

            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <PlusCircle size={18} />
              <span>פתיחת קריאת שירות חדשה</span>
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          3 אריחי מדדי המפתח (KPIs) — קבועים ונשארים תמיד בשני המצבים!
          -------------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-warning)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>קריאות בטיפול (פתוחות)</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-warning)', marginTop: 4 }}>
            {totalOpen}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-600)' }}>
            ממתינות למענה או סגירה
          </span>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-success)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>קריאות שטופלו ונסגרו</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-success)', marginTop: 4 }}>
            {totalClosed}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-600)' }}>
            טופלו בהצלחה
          </span>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderRight: `4px solid ${isGlobalMode ? 'var(--color-gold-500)' : activeColor.primary}` }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>סה״כ קריאות בכל הזמנים</span>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brown-900)', marginTop: 4 }}>
            {displayedIssues.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: isGlobalMode ? 'var(--color-gold-700)' : activeColor.primary, fontWeight: 700 }}>
            {isGlobalMode ? `ב-${buildings.length} בניינים מנוהלים` : `בבניין ${currentBuilding?.name}`}
          </span>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          פיצול עמודות בסגנון GitHub Issues — אחיד לחלוטין בשני המצבים!
          -------------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 420px) 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* עמודה ימנית: רשימת קריאות השירות */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '12px 14px',
            background: 'var(--color-gold-50)',
            borderBottom: '1px solid var(--color-beige-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('open')}
                style={{
                  background: statusFilter === 'open' ? '#FFFFFF' : 'transparent',
                  border: statusFilter === 'open' ? '1px solid var(--color-gold-400)' : 'none',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: statusFilter === 'open' ? 'var(--color-brown-900)' : 'var(--color-brown-500)',
                  cursor: 'pointer'
                }}
              >
                פתוחות ({totalOpen})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('closed')}
                style={{
                  background: statusFilter === 'closed' ? '#FFFFFF' : 'transparent',
                  border: statusFilter === 'closed' ? '1px solid var(--color-gold-400)' : 'none',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: statusFilter === 'closed' ? 'var(--color-brown-900)' : 'var(--color-brown-500)',
                  cursor: 'pointer'
                }}
              >
                סגורות ({totalClosed})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  background: statusFilter === 'all' ? '#FFFFFF' : 'transparent',
                  border: statusFilter === 'all' ? '1px solid var(--color-gold-400)' : 'none',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: statusFilter === 'all' ? 'var(--color-brown-900)' : 'var(--color-brown-500)',
                  cursor: 'pointer'
                }}
              >
                הכל ({displayedIssues.length})
              </button>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isGlobalMode ? "סינון לפי כותרת, בניין או פונה..." : "סינון קריאות לפי כותרת או פונה..."}
              className="input"
              style={{ fontSize: '0.85rem', padding: '6px 10px' }}
            />
          </div>

          {/* פריטי הרשימה */}
          <div style={{ maxHeight: 620, overflowY: 'auto' }}>
            {filteredIssues.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-brown-400)', fontSize: '0.9rem' }}>
                לא נמצאו קריאות שירות תואמות.
              </div>
            ) : (
              filteredIssues.map(iss => {
                const isSelected = activeIssue && activeIssue.id === iss.id;
                const bColor = iss.buildingColor || activeColor;

                return (
                  <div
                    key={`${iss.buildingId}-${iss.id}`}
                    onClick={() => setSelectedIssueId(iss.id)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--color-beige-divider)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--color-gold-50)' : '#FFFFFF',
                      borderRight: isSelected ? `4px solid ${bColor.primary}` : '4px solid transparent',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      {isGlobalMode ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: bColor.text,
                          background: bColor.tagBg,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: bColor.primary }} />
                          {iss.buildingName}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>
                          נפתחה ע״י: {iss.author}
                        </span>
                      )}

                      <span style={{ fontSize: '0.75rem', color: 'var(--color-brown-400)' }}>
                        {iss.createdAt}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      {iss.status === 'open' ? (
                        <Clock size={15} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                      ) : (
                        <CheckCircle2 size={15} color="var(--color-success)" style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-brown-900)', lineHeight: 1.2 }}>
                        {iss.title}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--color-brown-500)', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                      {isGlobalMode ? <span>נפתח ע״י: {iss.author}</span> : <span />}
                      <span>{iss.comments?.length || 0} תגובות</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* עמודה שמאלית: פירוט הפנייה ושרשור התגובות */}
        {activeIssue ? (
          <div className="card" style={{ padding: 24 }}>
            
            {/* כותרת הפנייה וסטטוס */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
              borderBottom: '1px solid var(--color-beige-border)',
              paddingBottom: 16,
              marginBottom: 20
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {isGlobalMode && (
                    <button
                      onClick={() => setSelectedBuildingId(activeIssue.buildingId)}
                      style={{
                        background: activeIssue.buildingColor?.tint,
                        border: `1px solid ${activeIssue.buildingColor?.border}`,
                        color: activeIssue.buildingColor?.text,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      title={`מעבר לניהול בניין ${activeIssue.buildingName}`}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeIssue.buildingColor?.primary }} />
                      <span>{activeIssue.buildingName}</span>
                    </button>
                  )}

                  <span className={`badge ${activeIssue.status === 'open' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.8rem' }}>
                    {activeIssue.status === 'open' ? 'קריאה פתוחה' : 'קריאה סגורה'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
                  {activeIssue.title}
                </h3>

                <div style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', marginTop: 4 }}>
                  נפתחה ע״י {activeIssue.author} בתאריך {activeIssue.createdAt}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleStatus(activeIssue)}
                className={`btn ${activeIssue.status === 'open' ? 'btn-secondary' : 'btn-primary'}`}
                style={{ fontSize: '0.85rem' }}
              >
                {activeIssue.status === 'open' ? (
                  <>
                    <CheckCircle2 size={16} color="var(--color-success)" />
                    <span>סמן כטופל / סגור פנייה</span>
                  </>
                ) : (
                  <>
                    <Clock size={16} />
                    <span>פתח מחדש קריאת שירות</span>
                  </>
                )}
              </button>
            </div>

            {/* שרשור תגובות (Timeline) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {(activeIssue.comments || []).map((comm, idx) => {
                const isManager = comm.author === 'מנהל החברה' || comm.author === 'מנהל מערכת';

                return (
                  <div
                    key={comm.id || idx}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: isManager ? 'var(--color-gold-50)' : '#FFFFFF',
                      border: isManager ? '1.5px solid var(--color-gold-300)' : '1px solid var(--color-beige-border)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: isManager ? 'var(--color-gold-800)' : 'var(--color-brown-900)' }}>
                          {comm.author}
                        </span>
                        {isManager && (
                          <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>הנהלת בית ומנוחה</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-brown-400)' }}>
                        {comm.createdAt}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-brown-800)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {comm.content}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* טופס הוספת תגובת מנהל */}
            <form onSubmit={handleSendReply} style={{ borderTop: '1px solid var(--color-beige-border)', paddingTop: 18 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brown-800)', marginBottom: 6 }}>
                הוספת תגובת הנהלה לקריאה זו:
              </label>
              <textarea
                rows={3}
                value={commentReplyText}
                onChange={(e) => setCommentReplyText(e.target.value)}
                placeholder="הקלד תגובה או עדכון לנציגי הבניין..."
                className="textarea"
                style={{ marginBottom: 10 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={!commentReplyText.trim()} className="btn btn-primary btn-sm">
                  <Send size={14} />
                  <span>שלח תגובת הנהלה</span>
                </button>
              </div>
            </form>

          </div>
        ) : (
          <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--color-brown-400)' }}>
            בחר פנייה מהרשימה כדי לצפות בפרטים ובשרשור התגובות.
          </div>
        )}

      </div>

      {/* --------------------------------------------------------------------
          מודל: פתיחת קריאת שירות חדשה
          -------------------------------------------------------------------- */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
                פתיחת קריאת שירות חדשה
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--color-brown-500)" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isGlobalMode && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                    בחירת הבניין:
                  </label>
                  <select
                    value={selectedBuildingForNewIssue}
                    onChange={(e) => setSelectedBuildingForNewIssue(e.target.value)}
                    className="select"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.address || ''})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                  נושא הפנייה:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input"
                  placeholder="למשל: תקלה במנורת חדר מדרגות / שער חניון תקוע"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                  שם הפונה:
                </label>
                <input
                  type="text"
                  required
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                  פירוט התקלה:
                </label>
                <textarea
                  rows={4}
                  required
                  value={newInitialComment}
                  onChange={(e) => setNewInitialComment(e.target.value)}
                  className="textarea"
                  placeholder="תאר את התקלה או הפנייה בהרחבה..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  פתח קריאה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
