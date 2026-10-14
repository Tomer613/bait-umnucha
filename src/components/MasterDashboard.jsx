// ==========================================================================
// בית ומנוחה - סקירה
// מבנה אחד וקבוע לבניין בודד ול"כלל הבניינים" — רק היקף הנתונים משתנה.
// (השוואה בין בניינים נמצאת ב"דוח הנהלה" במסך הדוחות, ובתפריט הבניינים.)
// ==========================================================================
import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  ArrowLeft,
  Receipt
} from 'lucide-react';
import { PageHeader, Kpi, BuildingName, BuildingAvatar, EmptyState } from './ui';
import {
  formatILS,
  formatMonth,
  monthName,
  aptDebt,
  hasDebt,
  openIssuesCount,
  sumBy,
  withBuilding
} from '../utils/format';

const MAX_ROWS = 7;

export default function MasterDashboard() {
  const { buildings, setSelectedBuildingId, currentBuilding, setActiveTab, currentMonth } = useApp();

  const isGlobal = !currentBuilding;
  const scope = currentBuilding ? [currentBuilding] : buildings;
  const month = monthName(currentMonth);

  // ------------------------------------------------------------------------
  // נתונים — אותם חישובים בדיוק לבניין אחד או לכולם
  // ------------------------------------------------------------------------
  const balance = sumBy(scope, b => b.currentBalance);

  const debtors = scope
    .flatMap(b => withBuilding(b, (b.apartments || []).filter(hasDebt)))
    .sort((a, b) => aptDebt(b) - aptDebt(a));
  const debtTotal = debtors.reduce((s, a) => s + aptDebt(a), 0);

  const updatedCount = scope.filter(b => b.statusMonthUpdated).length;
  const pendingCount = scope.length - updatedCount;

  const transactions = scope
    .flatMap(b => withBuilding(b, b.expenses))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const openIssues = scope
    .flatMap(b => withBuilding(b, (b.issues || []).filter(i => i.status === 'open')))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const openIssuesTotal = sumBy(scope, openIssuesCount);

  const goToBuilding = (id) => setSelectedBuildingId(id);

  // ------------------------------------------------------------------------
  // כותרת — זהה בשני המצבים
  // ------------------------------------------------------------------------
  const title = isGlobal
    ? 'סקירת בניינים'
    : <span className="title-with-plaque"><BuildingAvatar name={currentBuilding.name} color={currentBuilding.color} size="lg" />{currentBuilding.name}</span>;

  const subtitle = isGlobal
    ? `${formatMonth(currentMonth)} · ${buildings.length} בניינים מנוהלים`
    : (
      <>
        <span>{currentBuilding.address || 'ללא כתובת'}</span>
        {currentBuilding.bankAccount && <><span>·</span><span>{currentBuilding.bankAccount}</span></>}
        <span>·</span>
        <span>קוד חיובית: {currentBuilding.hiyuvitCode || 'לא הוגדר'}</span>
      </>
    );

  return (
    <div className="page">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveTab('reports')}>
              <FileText size={16} /> הפקת דוח
            </button>
            <button className="btn btn-primary" onClick={() => setActiveTab('finance')}>
              <Wallet size={16} /> קליטת כספים
            </button>
          </>
        }
      />

      {/* 4 אריחי מדדים — אותם אריחים בשני המצבים */}
      <div className="kpi-grid">
        <Kpi
          variant="hero"
          icon={Wallet}
          label={isGlobal ? 'יתרה בכל הקופות' : 'יתרת קופה'}
          value={formatILS(balance)}
          meta={isGlobal ? `ב-${buildings.length} חשבונות בנק` : 'בנק + קופת מזומן'}
        />
        <Kpi
          variant={debtTotal > 0 ? 'alert' : 'good'}
          icon={AlertCircle}
          label="חובות דיירים"
          value={formatILS(debtTotal)}
          meta={debtors.length > 0 ? `${debtors.length} דירות בפיגור` : 'כל הדירות שילמו'}
        />
        <Kpi
          variant={pendingCount > 0 ? 'warn' : 'good'}
          icon={pendingCount > 0 ? Clock : CheckCircle2}
          label={`קליטת ${month}`}
          value={isGlobal ? `${updatedCount} / ${buildings.length}` : (pendingCount ? 'ממתין' : 'מעודכן')}
          meta={isGlobal
            ? (pendingCount ? `${pendingCount} בניינים ממתינים לקבצים` : 'כל הבניינים עודכנו')
            : 'קובצי חיובית ועו״ש'}
        />
        <Kpi
          variant="gold"
          icon={MessageSquare}
          label="פניות פתוחות"
          value={openIssuesTotal}
          meta={openIssuesTotal ? 'ממתינות לטיפול' : 'אין פניות פתוחות'}
        />
      </div>

      <div className="grid-2">
        {/* דירות בחוב */}
        <div className="card card-flush">
          <div className="card-header">
            <div>
              <h3 className="section-title">דירות בחוב</h3>
              <p className="section-sub">
                {debtors.length ? `${debtors.length} דירות · ${formatILS(debtTotal)} · הגבוהים ראשונים` : 'אין חובות פתוחים'}
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('tenants')}>
              לכל הדיירים <ArrowLeft size={14} />
            </button>
          </div>
          {debtors.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="אין חובות פתוחים" text="כל הדירות שילמו את דמי הוועד." />
          ) : (
            <div className="table-wrap">
              <table className="data-table data-table-compact">
                <thead>
                  <tr>
                    {isGlobal && <th>בניין</th>}
                    <th>דירה</th>
                    <th>דייר</th>
                    <th>חודשים</th>
                    <th className="num">חוב</th>
                  </tr>
                </thead>
                <tbody>
                  {debtors.slice(0, MAX_ROWS).map(apt => (
                    <tr key={`${apt.buildingId}-${apt.id}`}>
                      {isGlobal && <td><BuildingName name={apt.buildingName} color={apt.buildingColor} onClick={() => goToBuilding(apt.buildingId)} /></td>}
                      <td className="cell-strong">{apt.aptNum}</td>
                      <td>{apt.tenantName}<span className="cell-sub">{apt.paymentMethod}</span></td>
                      <td>{apt.debtMonths.map(monthName).join(', ')}</td>
                      <td className="num amount-out">{formatILS(aptDebt(apt))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* תנועות אחרונות */}
        <div className="card card-flush">
          <div className="card-header">
            <div>
              <h3 className="section-title">תנועות אחרונות</h3>
              <p className="section-sub">הוצאות ותקבולים שנרשמו בקופה</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('finance')}>
              ליומן התנועות <ArrowLeft size={14} />
            </button>
          </div>
          {transactions.length === 0 ? (
            <EmptyState icon={Receipt} title="אין תנועות עדיין" text="העלו קובץ בנק או הזינו תקבול במסך הכספים." />
          ) : (
            <div className="table-wrap">
              <table className="data-table data-table-compact">
                <thead>
                  <tr>
                    {isGlobal && <th>בניין</th>}
                    <th>תאריך</th>
                    <th>תיאור</th>
                    <th className="num">סכום</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, MAX_ROWS).map((tx, idx) => (
                    <tr key={`${tx.buildingId}-${tx.id}-${idx}`}>
                      {isGlobal && <td><BuildingName name={tx.buildingName} color={tx.buildingColor} onClick={() => goToBuilding(tx.buildingId)} /></td>}
                      <td className="num" style={{ textAlign: 'right' }}>{tx.date}</td>
                      <td>{tx.description}<span className="cell-sub">{tx.category}</span></td>
                      <td className={`num ${tx.amount < 0 ? 'amount-in' : 'amount-out'}`}>
                        <span className="money-signed">{tx.amount < 0 ? '+' : '−'}{formatILS(Math.abs(tx.amount))}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* פניות פתוחות */}
      <div className="card card-flush">
        <div className="card-header">
          <div>
            <h3 className="section-title">פניות פתוחות</h3>
            <p className="section-sub">{openIssues.length ? `${openIssues.length} פניות ממתינות לטיפול` : 'אין פניות שממתינות'}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('issues')}>
            למרכז הפניות <ArrowLeft size={14} />
          </button>
        </div>
        {openIssues.length === 0 ? (
          <EmptyState icon={MessageSquare} title="אין פניות פתוחות" text="כל הפניות טופלו." />
        ) : (
          <div className="table-wrap">
            <table className="data-table data-table-compact">
              <thead>
                <tr>
                  {isGlobal && <th>בניין</th>}
                  <th>נושא</th>
                  <th>פונה</th>
                  <th>נפתחה</th>
                  <th className="col-center">תגובות</th>
                </tr>
              </thead>
              <tbody>
                {openIssues.slice(0, MAX_ROWS).map(iss => (
                  <tr key={`${iss.buildingId}-${iss.id}`} className="is-clickable" onClick={() => setActiveTab('issues')}>
                    {isGlobal && <td><BuildingName name={iss.buildingName} color={iss.buildingColor} /></td>}
                    <td className="cell-strong">{iss.title}</td>
                    <td>{iss.author}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{iss.createdAt}</td>
                    <td className="col-center num">{iss.comments?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
