// ==========================================================================
// בית ומנוחה - משימות: "מה דורש טיפול"
// תדריך קצר ורשימת משימות שהמערכת מזהה לבד, עם פעולה ישירה ליד כל פריט.
// אותו מבנה לבניין בודד ול"כלל הבניינים" — רק היקף הבדיקה משתנה.
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CloudUpload, Mail, MessageSquareReply, Wrench, Wallet, PartyPopper, ChevronLeft, LayoutGrid } from 'lucide-react';
import { BuildingAvatar, AllBuildingsAvatar } from './ui';
import { formatFormattedDate } from '../utils/hebrewDate';
import { computeTasks, countTaskItems, DEFAULT_LOW_BALANCE, DEFAULT_CHRONIC_MONTHS } from '../utils/tasks';

const TASK_ICONS = { intake: CloudUpload, debts: Mail, issues: MessageSquareReply, levies: Wrench, balance: Wallet };

const ACTION_LABELS = {
  intake: 'לסגירת החודש',
  letter: 'מכתב התראה',
  issue: 'למענה',
  levy: 'למעקב',
  finance: 'לכספים'
};

const VISIBLE_ITEMS = 5;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  return 'ערב טוב';
}

export default function MasterDashboard() {
  const { buildings, currentBuilding, setSelectedBuildingId, setActiveTab, setLetterPreset, currentMonth, systemSettings } = useApp();
  const [expanded, setExpanded] = useState({});

  const scope = currentBuilding ? [currentBuilding] : buildings;
  const tasks = computeTasks(scope, {
    currentMonth,
    lowBalance: Number(systemSettings?.lowBalanceThreshold) || DEFAULT_LOW_BALANCE,
    chronicMonths: Number(systemSettings?.chronicDebtMonths) || DEFAULT_CHRONIC_MONTHS
  });
  const total = countTaskItems(tasks);
  // כשמוצג בניין בודד — כמה משימות יש בשאר הבניינים (כדי ששום דבר לא "ייעלם")
  const otherTasks = currentBuilding
    ? countTaskItems(computeTasks(buildings, {
        currentMonth,
        lowBalance: Number(systemSettings?.lowBalanceThreshold) || DEFAULT_LOW_BALANCE,
        chronicMonths: Number(systemSettings?.chronicDebtMonths) || DEFAULT_CHRONIC_MONTHS
      })) - total
    : 0;
  const firstName = (systemSettings?.managerName || '').trim().split(/\s+/)[0];

  const runAction = (item) => {
    setSelectedBuildingId(item.building.id);
    switch (item.action) {
      case 'intake': setActiveTab('finance'); break;
      case 'letter': setLetterPreset('debt-2'); setActiveTab('reports', 'letters'); break;
      case 'issue': setActiveTab('issues'); break;
      case 'levy': setActiveTab('finance', 'levies'); break;
      default: setActiveTab('finance');
    }
  };

  return (
    <div className="page">
      {/* תדריך — עם "אזור זהות": שלט הבניין, או "כל הבניינים" */}
      <div className="brief">
        <div className="brief-identity">
          {currentBuilding
            ? <BuildingAvatar name={currentBuilding.name} color={currentBuilding.color} size="xl" />
            : <AllBuildingsAvatar size="xl" />}
          <span className="brief-identity-name">{currentBuilding ? currentBuilding.name : 'כל הבניינים'}</span>
        </div>
        <div className="brief-text">
          <span className="brief-date">{formatFormattedDate(new Date(), systemSettings?.hebrewDateFormat || 'both')}</span>
          <h1 className="brief-title">{greeting()}{firstName ? `, ${firstName}` : ''}</h1>
          <p className="brief-sub">
            {total === 0
              ? `הכל מטופל${currentBuilding ? ` בבניין ${currentBuilding.name}` : ''}. אין משימות פתוחות.`
              : `${total === 1 ? 'דבר אחד מחכה' : `${total} דברים מחכים`} לטיפול${currentBuilding ? ` בבניין ${currentBuilding.name}` : ` ב-${buildings.length} הבניינים`}.`}
          </p>
        </div>
      </div>

      {/* כשמוצג בניין בודד — פס בולט מחוץ לתדריך, עם מעבר לכל הבניינים */}
      {currentBuilding && (
        <div className="scope-bar">
          <span className="scope-bar-text">
            מוצגות רק המשימות של <strong>{currentBuilding.name}</strong>
            {otherTasks > 0 && <> · בשאר הבניינים יש עוד <strong>{otherTasks}</strong> {otherTasks === 1 ? 'משימה' : 'משימות'}</>}
          </span>
          <button type="button" className="btn btn-gold" onClick={() => setSelectedBuildingId('all')}>
            <LayoutGrid size={17} /> מעבר לכל הבניינים
          </button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}><PartyPopper size={26} /></div>
            <h3>הכל מטופל</h3>
            <p>החודש סגור, אין חובות מתמשכים ואין פניות שמחכות לתשובה.</p>
          </div>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map(task => {
            const Icon = TASK_ICONS[task.id];
            const isOpen = expanded[task.id];
            const items = isOpen ? task.items : task.items.slice(0, VISIBLE_ITEMS);
            const hidden = task.items.length - items.length;
            return (
              <section key={task.id} className={`task-card task-card--${task.tone}`}>
                <header className="task-head">
                  <span className="task-icon"><Icon size={22} /></span>
                  <div className="task-titles">
                    <h2>{task.title}</h2>
                    <p>{task.text}</p>
                  </div>
                  <span className="task-count">{task.items.length}</span>
                </header>

                {task.progress && (
                  <div className="task-progress">
                    <div className="progress"><div className="progress-bar" style={{ width: `${(task.progress.done / task.progress.total) * 100}%` }} /></div>
                    <span>{task.progress.done} מתוך {task.progress.total} בניינים כבר סגרו את החודש</span>
                  </div>
                )}

                <ul className="task-items">
                  {items.map(item => (
                    <li key={item.key} className="task-item">
                      <BuildingAvatar name={item.building.name} color={item.building.color} size="sm" />
                      <span className="task-item-text">
                        <strong>{item.building.name}</strong>
                        <span>{item.detail}</span>
                      </span>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => runAction(item)}>
                        {ACTION_LABELS[item.action]} <ChevronLeft size={15} />
                      </button>
                    </li>
                  ))}
                </ul>

                {hidden > 0 && (
                  <button type="button" className="btn btn-ghost btn-sm task-more" onClick={() => setExpanded(e => ({ ...e, [task.id]: true }))}>
                    הצגת עוד {hidden}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
