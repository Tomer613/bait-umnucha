// ==========================================================================
// בית ומנוחה - ניהול פניות ותקלות ועד (בסגנון GitHub Issues)
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MessageSquare, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Send, 
  Building, 
  X, 
  Settings2,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function IssuesTracker() {
  const { currentBuilding, buildings, setSelectedBuildingId, addIssue, addIssueComment, toggleIssueStatus, updateBuildingSettings } = useApp();
  const [statusFilter, setStatusFilter] = useState('open'); // 'open' | 'closed' | 'all'
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('נציג ועד הבית');
  const [newInitialComment, setNewInitialComment] = useState('');
  const [commentReplyText, setCommentReplyText] = useState('');
  const [selectedBuildingForNewIssue, setSelectedBuildingForNewIssue] = useState(buildings[0]?.id || '');
  const [masterSearch, setMasterSearch] = useState('');

  // כלל הפניות מכלל הבניינים
  const allMasterIssues = buildings.flatMap(b => (b.issues || []).map(issue => ({
    ...issue,
    buildingId: b.id,
    buildingName: b.name,
    buildingColor: b.color || { primary: 'var(--color-gold-500)', tint: 'var(--color-gold-50)' }
  })));

  const filteredMasterIssues = allMasterIssues.filter(iss => {
    if (statusFilter !== 'all' && iss.status !== statusFilter) return false;
    if (!masterSearch) return true;
    const q = masterSearch.toLowerCase();
    return (
      iss.title.toLowerCase().includes(q) ||
      iss.buildingName.toLowerCase().includes(q) ||
      (iss.author && iss.author.toLowerCase().includes(q))
    );
  });

  const activeMasterIssue = allMasterIssues.find(i => i.id === selectedIssueId) || filteredMasterIssues[0] || allMasterIssues[0];

  const handleCreateIssue = (e) => {
    e.preventDefault();
    if (!newTitle || !newInitialComment) return;

    const bId = currentBuilding ? currentBuilding.id : selectedBuildingForNewIssue;
    addIssue(bId, newTitle, newAuthor, newInitialComment);
    setShowAddModal(false);
    setNewTitle('');
    setNewInitialComment('');
  };

  const handleSendMasterReply = (e) => {
    e.preventDefault();
    if (!commentReplyText.trim() || !activeMasterIssue) return;

    addIssueComment(activeMasterIssue.buildingId, activeMasterIssue.id, "מנהל החברה", commentReplyText.trim());
    setCommentReplyText('');
  };

  const totalMasterOpen = allMasterIssues.filter(i => i.status === 'open').length;
  const totalMasterClosed = allMasterIssues.filter(i => i.status === 'closed').length;

  if (!currentBuilding) {
    return (
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Master Header Bar */}
        <div className="card" style={{ padding: '22px 24px', marginBottom: 24, border: '1.5px solid var(--color-gold-300)', background: 'linear-gradient(135deg, #FFFFFF 0%, var(--color-gold-50) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="badge badge-gold" style={{ fontSize: '0.8rem' }}>מוקד שירות מרכזי</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-gold-700)', fontWeight: 700 }}>
                  ריכוז קריאות לכלל {buildings.length} הבניינים המנוהלים
                </span>
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
                מרכז פניות ותקלות ועד (Issues)
              </h2>
              <p style={{ color: 'var(--color-brown-600)', fontSize: '0.92rem', margin: '6px 0 0' }}>
                מעקב שירות ותקלות מול נציגי הבניינים והדיירים בסגנון GitHub: מעליות, אינסטלציה, שערים וחשמל.
              </p>
            </div>

            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <PlusCircle size={18} />
              <span>פתיחת קריאת שירות חדשה</span>
            </button>
          </div>
        </div>

        {/* Master KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-warning)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>קריאות בטיפול (פתוחות)</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-warning)', marginTop: 4 }}>
              {totalMasterOpen}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-600)' }}>
              ממתינות למענה או סגירה
            </span>
          </div>

          <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-success)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>קריאות שטופלו ונסגרו</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-success)', marginTop: 4 }}>
              {totalMasterClosed}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-600)' }}>
              טופלו בהצלחה
            </span>
          </div>

          <div className="card" style={{ padding: '18px 20px', borderRight: '4px solid var(--color-gold-500)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', fontWeight: 600 }}>סה״כ קריאות בכל הזמנים</span>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brown-900)', marginTop: 4 }}>
              {allMasterIssues.length}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-brown-600)' }}>
              ב-{buildings.length} בניינים מנוהלים
            </span>
          </div>
        </div>

        {/* Master GitHub-style Split View */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 420px) 1fr', gap: 20, alignItems: 'start' }}>
          
          {/* List Column */}
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
                  פתוחות ({totalMasterOpen})
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
                  סגורות ({totalMasterClosed})
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
                  הכל ({allMasterIssues.length})
                </button>
              </div>

              <input
                type="text"
                value={masterSearch}
                onChange={(e) => setMasterSearch(e.target.value)}
                placeholder="סינון לפי כותרת, בניין או פונה..."
                className="input"
                style={{ fontSize: '0.85rem', padding: '6px 10px' }}
              />
            </div>

            {/* Issues List Items */}
            <div style={{ maxHeight: 620, overflowY: 'auto' }}>
              {filteredMasterIssues.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-brown-400)', fontSize: '0.9rem' }}>
                  לא נמצאו קריאות שירות תואמות.
                </div>
              ) : (
                filteredMasterIssues.map(iss => {
                  const isSelected = activeMasterIssue && activeMasterIssue.id === iss.id;
                  const bColor = iss.buildingColor;

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
                        <span>נפתח ע״י: {iss.author}</span>
                        <span>{iss.comments?.length || 0} תגובות</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Details & Conversation Column */}
          {activeMasterIssue ? (
            <div className="card" style={{ padding: 24 }}>
              
              {/* Issue Header */}
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
                    <button
                      onClick={() => setSelectedBuildingId(activeMasterIssue.buildingId)}
                      style={{
                        background: activeMasterIssue.buildingColor.tint,
                        border: `1px solid ${activeMasterIssue.buildingColor.border}`,
                        color: activeMasterIssue.buildingColor.text,
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      title={`מעבר לניהול בניין ${activeMasterIssue.buildingName}`}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeMasterIssue.buildingColor.primary }} />
                      <span>{activeMasterIssue.buildingName}</span>
                    </button>

                    <span className={`badge ${activeMasterIssue.status === 'open' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.8rem' }}>
                      {activeMasterIssue.status === 'open' ? 'קריאה פתוחה' : 'קריאה סגורה'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
                    {activeMasterIssue.title}
                  </h3>

                  <div style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)', marginTop: 4 }}>
                    נפתחה ע״י {activeMasterIssue.author} בתאריך {activeMasterIssue.createdAt}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleIssueStatus(activeMasterIssue.buildingId, activeMasterIssue.id)}
                  className={`btn ${activeMasterIssue.status === 'open' ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ fontSize: '0.85rem' }}
                >
                  {activeMasterIssue.status === 'open' ? (
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

              {/* Timeline Thread */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                {(activeMasterIssue.comments || []).map((comm, idx) => {
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

              {/* Quick Reply Form */}
              <form onSubmit={handleSendMasterReply} style={{ borderTop: '1px solid var(--color-beige-border)', paddingTop: 18 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brown-800)', marginBottom: 6 }}>
                  הוספת תגובת מנהל לקריאה זו:
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

        {/* Modal: Add Issue (Also rendered for Master View!) */}
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

  const issuesList = currentBuilding?.issues || [];
  const filteredIssues = issuesList.filter(i => i.status === statusFilter);
  const activeIssue = issuesList.find(i => i.id === selectedIssueId) || filteredIssues[0] || issuesList[0];

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!commentReplyText.trim() || !activeIssue) return;

    addIssueComment(currentBuilding.id, activeIssue.id, "מנהל החברה", commentReplyText.trim());
    setCommentReplyText('');
  };

  // שליטה במתגי הרשאות נציגי הבניין
  const toggleIssuePermission = (val) => {
    updateBuildingSettings(currentBuilding.id, { issuesEnabled: val });
  };

  const toggleReportsPermission = (val) => {
    updateBuildingSettings(currentBuilding.id, { reportsViewEnabled: val });
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Header & Building Permissions Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20
      }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            פניות ותקלות ועד (Issues) — {currentBuilding.name}
          </h2>
          <p style={{ color: 'var(--color-brown-600)', fontSize: '0.92rem' }}>
            ערוץ תקשורת ישיר, מעקב תקלות ושרשור תגובות מול נציגי הבניין בסגנון GitHub
          </p>
        </div>

        {/* Permissions Toggles for Representatives */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: '#FFFFFF',
          padding: '10px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-beige-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Settings2 size={16} color="var(--color-gold-600)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-brown-700)' }}>
              הרשאות נציג לבניין:
            </span>
          </div>

          {/* Toggle 1: Issues (Default ON) */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', cursor: 'pointer' }}>
            <span className="switch">
              <input
                type="checkbox"
                checked={currentBuilding.settings ? currentBuilding.settings.issuesEnabled : true}
                onChange={(e) => toggleIssuePermission(e.target.checked)}
              />
              <span className="slider"></span>
            </span>
            <span>ערוץ פניות</span>
          </label>

          {/* Toggle 2: Reports View (Default OFF) */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', cursor: 'pointer' }}>
            <span className="switch">
              <input
                type="checkbox"
                checked={currentBuilding.settings ? currentBuilding.settings.reportsViewEnabled : false}
                onChange={(e) => toggleReportsPermission(e.target.checked)}
              />
              <span className="slider"></span>
            </span>
            <span>צפייה בדוחות</span>
          </label>
        </div>
      </div>

      {/* Main Issues GitHub-style Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* Left Side: Issues List (GitHub style tabs) */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          
          {/* Tabs: Open / Closed & New Issue Button */}
          <div style={{
            padding: '14px 16px',
            background: 'var(--color-gold-50)',
            borderBottom: '1px solid var(--color-beige-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setStatusFilter('open')}
                style={{
                  background: statusFilter === 'open' ? '#FFFFFF' : 'transparent',
                  border: statusFilter === 'open' ? '1px solid var(--color-gold-300)' : 'none',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: statusFilter === 'open' ? 'var(--color-brown-900)' : 'var(--color-brown-500)',
                  cursor: 'pointer'
                }}
              >
                פתוחות ({issuesList.filter(i => i.status === 'open').length})
              </button>

              <button
                onClick={() => setStatusFilter('closed')}
                style={{
                  background: statusFilter === 'closed' ? '#FFFFFF' : 'transparent',
                  border: statusFilter === 'closed' ? '1px solid var(--color-gold-300)' : 'none',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: statusFilter === 'closed' ? 'var(--color-brown-900)' : 'var(--color-brown-500)',
                  cursor: 'pointer'
                }}
              >
                סגורות ({issuesList.filter(i => i.status === 'closed').length})
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm"
            >
              <PlusCircle size={15} />
              <span>פנייה חדשה</span>
            </button>
          </div>

          {/* List Items */}
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {filteredIssues.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-brown-400)', fontSize: '0.9rem' }}>
                אין פניות {statusFilter === 'open' ? 'פתוחות' : 'סגורות'} בבניין זה.
              </div>
            ) : (
              filteredIssues.map(iss => {
                const isSelected = activeIssue && activeIssue.id === iss.id;
                return (
                  <div
                    key={iss.id}
                    onClick={() => setSelectedIssueId(iss.id)}
                    style={{
                      padding: '16px 18px',
                      borderBottom: '1px solid var(--color-beige-divider)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--color-gold-50)' : '#FFFFFF',
                      borderRight: isSelected ? '4px solid var(--color-gold-500)' : '4px solid transparent',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      {iss.status === 'open' ? (
                        <Clock size={15} color="var(--color-warning)" />
                      ) : (
                        <CheckCircle2 size={15} color="var(--color-success)" />
                      )}
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-brown-900)' }}>
                        {iss.title}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>נפתחה ע"י: {iss.author}</span>
                      <span>{iss.createdAt}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Conversation Thread View */}
        {activeIssue ? (
          <div className="card" style={{ padding: 28, background: '#FFFFFF' }}>
            
            {/* Issue Header & Status Toggle */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--color-beige-border)',
              paddingBottom: 16,
              marginBottom: 20
            }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-brown-900)', marginBottom: 6 }}>
                  {activeIssue.title}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-brown-500)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${activeIssue.status === 'open' ? 'badge-gold' : 'badge-success'}`}>
                    {activeIssue.status === 'open' ? 'פנייה פתוחה' : 'פנייה טופלה ונסגרה'}
                  </span>
                  <span>נפתחה ע"י {activeIssue.author} בתאריך {activeIssue.createdAt}</span>
                </div>
              </div>

              <button
                onClick={() => toggleIssueStatus(currentBuilding.id, activeIssue.id)}
                className={`btn btn-sm ${activeIssue.status === 'open' ? 'btn-secondary' : 'btn-primary'}`}
              >
                {activeIssue.status === 'open' ? 'סמן כפנייה שטופלה וסגור' : 'פתח מחדש'}
              </button>
            </div>

            {/* Conversation Thread */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {(activeIssue.comments || []).map((comm, idx) => (
                <div
                  key={comm.id || idx}
                  style={{
                    background: comm.author.includes('מנהל') ? 'var(--color-gold-50)' : '#FFFFFF',
                    border: '1px solid var(--color-beige-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-brown-900)' }}>
                      {comm.author}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-400)' }}>
                      {comm.time}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--color-brown-800)', lineHeight: 1.6 }}>
                    {comm.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            {activeIssue.status === 'open' ? (
              <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  rows={3}
                  required
                  placeholder="כתוב תגובה או עדכון לנציג הבניין..."
                  value={commentReplyText}
                  onChange={(e) => setCommentReplyText(e.target.value)}
                  className="textarea"
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary">
                    <Send size={15} />
                    <span>שלח מענה לפנייה</span>
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ background: 'var(--color-cream-subtle)', padding: 12, borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.88rem', color: 'var(--color-brown-600)' }}>
                פנייה זו סגורה. כדי להגיב עליה יש לפתוח אותה מחדש בכפתור למעלה.
              </div>
            )}

          </div>
        ) : (
          <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--color-brown-400)' }}>
            בחר פנייה מהרשימה כדי לצפות בשרשור השיחה
          </div>
        )}

      </div>

      {/* Modal: New Issue */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                פתיחת פנייה / קריאת שירות חדשה
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--color-brown-500)" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
