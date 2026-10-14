// ==========================================================================
// בית ומנוחה - פניות ותקלות: רשימת קריאות, שרשור תגובות ומתג הרשאת נציגים
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlusCircle, CheckCircle2, Clock, Send, Search, MessageSquare, RotateCcw } from 'lucide-react';
import { PageHeader, Segmented, Modal, Field, EmptyState, BuildingName } from './ui';
import { withBuilding, requestBuildingPick } from '../utils/format';

const MANAGER_AUTHOR = 'מנהל החברה';
const issueKey = (iss) => `${iss.buildingId}:${iss.id}`;

export default function IssuesTracker() {
  const { currentBuilding, buildings, setSelectedBuildingId, addIssue, addIssueComment, toggleIssueStatus, updateBuildingSettings } = useApp();

  const isGlobalMode = !currentBuilding;

  const [statusFilter, setStatusFilter] = useState('open'); // open | closed | all
  const [selectedKey, setSelectedKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('נציג ועד הבית');
  const [newBody, setNewBody] = useState('');

  const scopeBuildings = currentBuilding ? [currentBuilding] : buildings;
  const allIssues = scopeBuildings.flatMap(b => withBuilding(b, b.issues));
  const openCount = allIssues.filter(i => i.status === 'open').length;
  const closedCount = allIssues.length - openCount;

  const q = searchQuery.trim().toLowerCase();
  const filteredIssues = allIssues.filter(iss => {
    if (statusFilter !== 'all' && iss.status !== statusFilter) return false;
    if (!q) return true;
    return [iss.title, iss.buildingName, iss.author].some(v => (v || '').toLowerCase().includes(q));
  });

  const activeIssue = allIssues.find(i => issueKey(i) === selectedKey) || filteredIssues[0] || null;

  const handleCreateIssue = (e) => {
    e.preventDefault();
    if (!newTitle || !newBody) return;
    if (!currentBuilding) return;
    addIssue(currentBuilding.id, newTitle, newAuthor, newBody);
    setShowAddModal(false);
    setNewTitle('');
    setNewBody('');
    setStatusFilter('open');
    setSelectedKey(null);
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeIssue) return;
    addIssueComment(activeIssue.buildingId, activeIssue.id, MANAGER_AUTHOR, replyText.trim());
    setReplyText('');
  };

  const issuesEnabled = currentBuilding?.settings ? currentBuilding.settings.issuesEnabled : true;

  return (
    <div className="page">
      <PageHeader
        title="פניות ותקלות"
        subtitle={`${openCount} פתוחות · ${closedCount} טופלו`}
        actions={
          <>
            {!isGlobalMode && (
              <label className="row" style={{ gap: 8, fontSize: '0.89rem', fontWeight: 500, color: 'var(--ink-600)', cursor: 'pointer' }}>
                <span>נציגי הבניין יכולים לפתוח פניות</span>
                <span className="switch">
                  <input
                    type="checkbox"
                    checked={issuesEnabled}
                    onChange={(e) => updateBuildingSettings(currentBuilding.id, { issuesEnabled: e.target.checked })}
                  />
                  <span className="slider" />
                </span>
              </label>
            )}
            <button
              onClick={() => currentBuilding ? setShowAddModal(true) : requestBuildingPick('לאיזה בניין לפתוח את הפנייה? בחרו בניין')}
              className="btn btn-primary"
            >
              <PlusCircle size={17} /> פנייה חדשה
            </button>
          </>
        }
      />

      <div className="issues-split">
        {/* רשימת הפניות */}
        <div className="card card-flush">
          <div className="card-header" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <Segmented
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setSelectedKey(null); }}
              options={[
                { id: 'open', label: 'פתוחות', count: openCount },
                { id: 'closed', label: 'סגורות', count: closedCount },
                { id: 'all', label: 'הכל', count: allIssues.length }
              ]}
            />
            <div className="search-box" style={{ maxWidth: 'none', flex: '0 0 auto' }}>
              <Search size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isGlobalMode ? 'חיפוש לפי נושא, בניין או פונה...' : 'חיפוש לפי נושא או פונה...'}
                className="input input-sm"
              />
            </div>
          </div>

          <div className="issue-list">
            {filteredIssues.length === 0 ? (
              <EmptyState icon={MessageSquare} title="אין פניות להצגה" text={statusFilter === 'open' ? 'אין כרגע פניות שממתינות לטיפול.' : 'נסו לשנות את הסינון.'} />
            ) : (
              filteredIssues.map(iss => {
                const isSelected = activeIssue && issueKey(activeIssue) === issueKey(iss);
                return (
                  <button
                    key={issueKey(iss)}
                    type="button"
                    className={`issue-item${isSelected ? ' is-selected' : ''}`}
                    style={{ '--issue-color': iss.buildingColor?.primary }}
                    onClick={() => setSelectedKey(issueKey(iss))}
                  >
                    <span className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                      {isGlobalMode
                        ? <BuildingName name={iss.buildingName} color={iss.buildingColor} />
                        : <span className="muted" style={{ fontSize: '0.85rem' }}>{iss.author}</span>}
                      <span className="muted" style={{ fontSize: '0.82rem' }}>{iss.createdAt}</span>
                    </span>
                    <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                      {iss.status === 'open'
                        ? <Clock size={15} color="var(--warning)" style={{ flexShrink: 0 }} />
                        : <CheckCircle2 size={15} color="var(--success)" style={{ flexShrink: 0 }} />}
                      <span className="issue-title">{iss.title}</span>
                    </span>
                    <span className="muted" style={{ fontSize: '0.83rem' }}>
                      {isGlobalMode && `${iss.author} · `}{iss.comments?.length || 0} תגובות
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* פירוט הפנייה */}
        {activeIssue ? (
          <div className="card stack" style={{ gap: 18 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: 16 }}>
              <div className="stack" style={{ gap: 6 }}>
                <div className="row" style={{ gap: 8 }}>
                  {isGlobalMode && (
                    <BuildingName name={activeIssue.buildingName} color={activeIssue.buildingColor} onClick={() => setSelectedBuildingId(activeIssue.buildingId)} />
                  )}
                  <span className={`badge badge-dot ${activeIssue.status === 'open' ? 'badge-warning' : 'badge-success'}`}>
                    {activeIssue.status === 'open' ? 'פתוחה' : 'סגורה'}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.35rem' }}>{activeIssue.title}</h2>
                <span className="muted" style={{ fontSize: '0.86rem' }}>נפתחה ע״י {activeIssue.author} · {activeIssue.createdAt}</span>
              </div>
              <button
                type="button"
                onClick={() => toggleIssueStatus(activeIssue.buildingId, activeIssue.id)}
                className={`btn ${activeIssue.status === 'open' ? 'btn-success' : 'btn-secondary'}`}
              >
                {activeIssue.status === 'open'
                  ? <><CheckCircle2 size={16} /> סימון כטופלה</>
                  : <><RotateCcw size={16} /> פתיחה מחדש</>}
              </button>
            </div>

            <div className="stack" style={{ gap: 12 }}>
              {(activeIssue.comments || []).map((comm, idx) => {
                const isManager = comm.author === MANAGER_AUTHOR || comm.author === 'מנהל מערכת';
                return (
                  <div key={comm.id || idx} className={`comment${isManager ? ' comment--manager' : ''}`}>
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="row" style={{ gap: 8 }}>
                        <strong style={{ fontSize: '0.93rem' }}>{comm.author}</strong>
                        {isManager && <span className="badge badge-gold">הנהלה</span>}
                      </span>
                      <span className="muted" style={{ fontSize: '0.82rem' }}>{comm.time || comm.createdAt}</span>
                    </div>
                    <p style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', color: 'var(--ink-800)' }}>{comm.text || comm.content}</p>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendReply} className="stack" style={{ gap: 10, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <Field label="תגובת הנהלה">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="עדכון לנציגי הבניין..."
                  className="textarea"
                />
              </Field>
              <div>
                <button type="submit" disabled={!replyText.trim()} className="btn btn-primary">
                  <Send size={15} /> שליחת תגובה
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="card">
            <EmptyState icon={MessageSquare} title="לא נבחרה פנייה" text="בחרו פנייה מהרשימה כדי לראות את הפרטים ואת שרשור התגובות." />
          </div>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="פנייה חדשה" subtitle={currentBuilding ? <BuildingName name={currentBuilding.name} color={currentBuilding.color} /> : null}>
        <form onSubmit={handleCreateIssue} className="form-stack">
          <Field label="נושא">
            <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="input" placeholder="למשל: שער החניון תקוע" />
          </Field>
          <Field label="שם הפונה">
            <input type="text" required value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} className="input" />
          </Field>
          <Field label="פירוט">
            <textarea rows={4} required value={newBody} onChange={(e) => setNewBody(e.target.value)} className="textarea" placeholder="תארו את התקלה או הבקשה..." />
          </Field>
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">פתיחת הפנייה</button>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">ביטול</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
