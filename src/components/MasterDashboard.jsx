// ==========================================================================
// בית ומנוחה - סקירה: מבט-על על כלל הבניינים, או סקירה ממוקדת לבניין נבחר
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Search,
  FileText,
  Users,
  ArrowLeft,
  Receipt
} from 'lucide-react';
import { PageHeader, Kpi, BuildingName, Segmented, EmptyState } from './ui';
import {
  formatILS,
  formatMonth,
  monthName,
  aptDebt,
  hasDebt,
  buildingDebt,
  buildingDebtorsCount,
  openIssuesCount,
  sumBy
} from '../utils/format';

export default function MasterDashboard() {
  const { buildings, setSelectedBuildingId, currentBuilding, setActiveTab, currentMonth } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [rowFilter, setRowFilter] = useState('all'); // all | pending | debts

  const month = monthName(currentMonth);

  // ------------------------------------------------------------------------
  // בניין יחיד
  // ------------------------------------------------------------------------
  if (currentBuilding) {
    const b = currentBuilding;
    const debtors = (b.apartments || []).filter(hasDebt);
    const debtSum = buildingDebt(b);
    const openIssues = openIssuesCount(b);
    const recent = (b.expenses || []).slice(0, 7);

    return (
      <div className="page">
        <PageHeader
          title={b.name}
          subtitle={
            <>
              <span>{b.address || 'ללא כתובת'}</span>
              {b.bankAccount && <><span>·</span><span>{b.bankAccount}</span></>}
              <span>·</span>
              <span>קוד חיובית: {b.hiyuvitCode || 'לא הוגדר'}</span>
            </>
          }
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

        <div className="kpi-grid">
          <Kpi variant="hero" icon={Wallet} label="יתרת קופה" value={formatILS(b.currentBalance)} meta="בנק + קופת מזומן" />
          <Kpi
            variant={debtSum > 0 ? 'alert' : 'good'}
            icon={AlertCircle}
            label="חובות דיירים"
            value={formatILS(debtSum)}
            meta={debtors.length > 0 ? `${debtors.length} דירות בפיגור` : 'כל הדירות שילמו'}
          />
          <Kpi
            variant={b.statusMonthUpdated ? 'good' : 'warn'}
            icon={b.statusMonthUpdated ? CheckCircle2 : Clock}
            label={`קליטת ${month}`}
            value={b.statusMonthUpdated ? 'מעודכן' : 'ממתין'}
            meta="קובצי חיובית ועו״ש"
          />
          <Kpi variant="gold" icon={MessageSquare} label="פניות פתוחות" value={openIssues} meta={openIssues ? 'ממתינות לטיפול' : 'אין פניות פתוחות'} />
        </div>

        <div className="grid-2">
          <div className="card card-flush">
            <div className="card-header">
              <div>
                <h3 className="section-title">דירות בחוב</h3>
                <p className="section-sub">{debtors.length} מתוך {b.apartments?.length || 0} דירות</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('tenants')}>
                לכל הדיירים <ArrowLeft size={14} />
              </button>
            </div>
            {debtors.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="אין חובות פתוחים" text="כל הדירות בבניין שילמו את דמי הוועד." />
            ) : (
              <div className="table-wrap">
                <table className="data-table data-table-compact">
                  <thead>
                    <tr><th>דירה</th><th>דייר</th><th>חודשים</th><th className="num">חוב</th></tr>
                  </thead>
                  <tbody>
                    {debtors.map(apt => (
                      <tr key={apt.id}>
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
            {recent.length === 0 ? (
              <EmptyState icon={Receipt} title="אין תנועות עדיין" text="העלו קובץ בנק או הזינו תקבול במסך הכספים." />
            ) : (
              <div className="table-wrap">
                <table className="data-table data-table-compact">
                  <thead>
                    <tr><th>תאריך</th><th>תיאור</th><th className="num">סכום</th></tr>
                  </thead>
                  <tbody>
                    {recent.map(tx => (
                      <tr key={tx.id}>
                        <td className="num" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{tx.date}</td>
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
      </div>
    );
  }

  // ------------------------------------------------------------------------
  // כלל הבניינים
  // ------------------------------------------------------------------------
  const totalBalance = sumBy(buildings, b => b.currentBalance);
  const totalDebts = sumBy(buildings, buildingDebt);
  const totalDebtors = sumBy(buildings, buildingDebtorsCount);
  const totalOpenIssues = sumBy(buildings, openIssuesCount);
  const updatedCount = buildings.filter(b => b.statusMonthUpdated).length;
  const pendingCount = buildings.length - updatedCount;
  const withDebtsCount = buildings.filter(b => buildingDebt(b) > 0).length;

  const q = searchTerm.trim();
  const filteredBuildings = buildings.filter(b => {
    if (rowFilter === 'pending' && b.statusMonthUpdated) return false;
    if (rowFilter === 'debts' && buildingDebt(b) === 0) return false;
    return !q || b.name.includes(q) || (b.address || '').includes(q);
  });

  const openBuilding = (id, tab = 'dashboard') => {
    setSelectedBuildingId(id);
    setActiveTab(tab);
  };

  return (
    <div className="page">
      <PageHeader
        title="סקירת בניינים"
        subtitle={`${formatMonth(currentMonth)} · ${updatedCount} מתוך ${buildings.length} בניינים קלטו את קובצי החודש`}
      />

      <div className="kpi-grid">
        <Kpi variant="hero" icon={Wallet} label="יתרה בכל הקופות" value={formatILS(totalBalance)} meta={`ב-${buildings.length} חשבונות בנק`} />
        <Kpi
          variant={totalDebts > 0 ? 'alert' : 'good'}
          icon={AlertCircle}
          label="חובות דיירים פתוחים"
          value={formatILS(totalDebts)}
          meta={totalDebtors > 0 ? `${totalDebtors} דירות בפיגור` : 'אין חובות פתוחים'}
        />
        <Kpi
          variant={pendingCount > 0 ? 'warn' : 'good'}
          icon={pendingCount > 0 ? Clock : CheckCircle2}
          label={`קליטת ${month}`}
          value={`${updatedCount} / ${buildings.length}`}
          meta={pendingCount > 0 ? `${pendingCount} בניינים ממתינים לקבצים` : 'כל הבניינים עודכנו'}
        />
        <Kpi variant="gold" icon={MessageSquare} label="פניות פתוחות" value={totalOpenIssues} meta={totalOpenIssues ? 'ממתינות לטיפול' : 'אין פניות פתוחות'} />
      </div>

      <div className="card card-flush">
        <div className="card-header">
          <Segmented
            value={rowFilter}
            onChange={setRowFilter}
            options={[
              { id: 'all', label: 'כל הבניינים', count: buildings.length },
              { id: 'pending', label: 'ממתינים לקליטה', count: pendingCount },
              { id: 'debts', label: 'עם חובות', count: withDebtsCount }
            ]}
          />
          <div className="search-box">
            <Search size={17} />
            <input
              type="text"
              placeholder="חיפוש בניין לפי שם או כתובת..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>בניין</th>
                <th className="col-center">דירות</th>
                <th className="num">יתרת קופה</th>
                <th>קליטת {month}</th>
                <th className="num">חובות</th>
                <th className="col-center">פניות</th>
                <th className="col-center">מעבר מהיר</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuildings.length === 0 && (
                <tr><td colSpan={7}><EmptyState title="לא נמצאו בניינים" text="נסו לשנות את החיפוש או את הסינון." /></td></tr>
              )}
              {filteredBuildings.map(b => {
                const debts = buildingDebt(b);
                const issues = openIssuesCount(b);
                return (
                  <tr key={b.id} className="is-clickable" onClick={() => openBuilding(b.id)}>
                    <td><BuildingName name={b.name} color={b.color} sub={b.address} /></td>
                    <td className="col-center num">{b.apartments?.length || 0}</td>
                    <td className="num cell-strong">{formatILS(b.currentBalance)}</td>
                    <td>
                      {b.statusMonthUpdated
                        ? <span className="badge badge-success badge-dot">מעודכן</span>
                        : <span className="badge badge-warning badge-dot">ממתין לקבצים</span>}
                    </td>
                    <td className="num">
                      {debts > 0
                        ? <span className="amount-out">{formatILS(debts)}</span>
                        : <span className="muted">—</span>}
                    </td>
                    <td className="col-center">
                      {issues > 0 ? <span className="badge badge-gold">{issues}</span> : <span className="muted">—</span>}
                    </td>
                    <td className="cell-actions" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <button className="btn btn-secondary btn-sm btn-icon" title="כספים" onClick={() => openBuilding(b.id, 'finance')}><Wallet size={15} /></button>
                        <button className="btn btn-secondary btn-sm btn-icon" title="דיירים" onClick={() => openBuilding(b.id, 'tenants')}><Users size={15} /></button>
                        <button className="btn btn-secondary btn-sm btn-icon" title="דוחות ומכתבים" onClick={() => openBuilding(b.id, 'reports')}><FileText size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
