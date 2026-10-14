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

  const [statusFilter, setStatusFilter] = useState('open'); // 'open' | 'closed'
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('נציג ועד הבית');
  const [newInitialComment, setNewInitialComment] = useState('');
  const [commentReplyText, setCommentReplyText] = useState('');

  if (!currentBuilding) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center', padding: 20 }}>
        <Building size={48} color="var(--color-gold-400)" style={{ marginBottom: 16 }} />
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
          אנא בחר בניין לצפייה בפניות ותקלות
        </h3>
        <p style={{ color: 'var(--color-brown-600)', marginBottom: 20 }}>
          בחר בניין כדי לצפות בפניות נציגי הוועד, לענות ולסגור קריאות שירות:
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {buildings.slice(0, 6).map(b => (
            <button key={b.id} onClick={() => setSelectedBuildingId(b.id)} className="btn btn-secondary">
              {b.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const issuesList = currentBuilding.issues || [];
  const filteredIssues = issuesList.filter(i => i.status === statusFilter);

  // הפנייה הפעילה שנבחרה לצפייה
  const activeIssue = issuesList.find(i => i.id === selectedIssueId) || filteredIssues[0] || issuesList[0];

  const handleCreateIssue = (e) => {
    e.preventDefault();
    if (!newTitle || !newInitialComment) return;

    addIssue(currentBuilding.id, newTitle, newAuthor, newInitialComment);
    setShowAddModal(false);
    setNewTitle('');
    setNewInitialComment('');
  };

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
