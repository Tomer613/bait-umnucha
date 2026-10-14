// ==========================================================================
// בית ומנוחה - מחולל דוחות: דוח הנהלה לכלל הבניינים, או דוח הוצאות/חובות לבניין
// עם מצבים שמורים (Presets), סינון לפי כניסה וצירוף קופות מיוחדות
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportExpensesMatrixExcel, exportDebtsLedgerExcel, exportMasterSummaryExcel } from '../utils/excelHelper';
import { EXPENSE_CATEGORIES } from '../data/initialData';
import { Printer, FileSpreadsheet, Share2, Bookmark, X, Save } from 'lucide-react';
import { Segmented, Modal, Field, BuildingName } from './ui';
import {
  HEBREW_MONTHS,
  formatILS,
  aptDebt,
  hasDebt,
  buildingDebt,
  buildingExpectedMonthly,
  openIssuesCount,
  sumBy
} from '../utils/format';

export default function ReportGenerator() {
  const { currentBuilding, buildings, setSelectedBuildingId, reportPresets, savePreset, deletePreset, currentMonth, systemSettings } = useApp();

  const isGlobalMode = !currentBuilding;
  const companyName = systemSettings?.companyName || 'בית ומנוחה';

  // הגדרות הדוח
  const [reportType, setReportType] = useState('expenses'); // expenses | debts
  const [reportYear, setReportYear] = useState(currentMonth.slice(0, 4));
  const [includeLevies, setIncludeLevies] = useState(false);
  const [entrance, setEntrance] = useState('all');
  const [activePresetId, setActivePresetId] = useState(null);

  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // ------------------------------------------------------------------------
  // נתונים
  // ------------------------------------------------------------------------
  const totalBalance = sumBy(buildings, b => b.currentBalance);
  const totalApartments = sumBy(buildings, b => b.apartments?.length || 0);
  const totalExpected = sumBy(buildings, buildingExpectedMonthly);
  const totalDebts = sumBy(buildings, buildingDebt);
  const totalOpenIssues = sumBy(buildings, openIssuesCount);

  const entrances = currentBuilding
    ? Array.from(new Set((currentBuilding.apartments || []).map(a => a.entrance).filter(Boolean))).sort()
    : [];
  const years = Array.from(new Set([
    currentMonth.slice(0, 4),
    ...(currentBuilding?.expenses || []).map(e => (e.month || e.date || '').slice(0, 4)).filter(Boolean)
  ])).sort().reverse();

  const reportApartments = (currentBuilding?.apartments || []).filter(a => entrance === 'all' || a.entrance === entrance);
  const reportDebts = reportApartments.reduce((s, a) => s + aptDebt(a), 0);
  const levies = currentBuilding?.specialLevies || [];

  const updateOption = (setter) => (value) => {
    setter(value);
    setActivePresetId(null);
  };

  // ------------------------------------------------------------------------
  // מצבים שמורים
  // ------------------------------------------------------------------------
  const applyPreset = (preset) => {
    setReportType(preset.reportType || 'expenses');
    setIncludeLevies(!!preset.includeLevies);
    setEntrance(preset.entrance && entrances.includes(preset.entrance) ? preset.entrance : 'all');
    setActivePresetId(preset.id);
  };

  const handleSavePreset = (e) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    savePreset({ name: newPresetName.trim(), reportType, includeLevies, entrance });
    setNewPresetName('');
    setShowSavePreset(false);
  };

  // ------------------------------------------------------------------------
  // הפקה
  // ------------------------------------------------------------------------
  const handleWhatsAppShare = () => {
    const date = new Date().toLocaleDateString('he-IL');
    const text = isGlobalMode
      ? `📊 *סיכום ניהול — ${companyName}*\n📅 ${date}\n\n` +
        `🏢 בניינים מנוהלים: ${buildings.length}\n` +
        `🏠 יחידות דיור: ${totalApartments}\n` +
        `💰 יתרה בכל הקופות: ${formatILS(totalBalance)}\n` +
        `📈 צפי גבייה חודשי: ${formatILS(totalExpected)}\n` +
        `⚠️ חובות פתוחים: ${formatILS(totalDebts)}\n` +
        `🔧 פניות פתוחות: ${totalOpenIssues}`
      : `שלום, מצורף דוח ${reportType === 'expenses' ? `הוצאות לשנת ${reportYear}` : 'תקבולים וחובות'} עבור ${currentBuilding.name}.\n` +
        `יתרת קופה: ${formatILS(currentBuilding.currentBalance)} · חובות פתוחים: ${formatILS(reportDebts)}\n${companyName}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleExcelExport = () => {
    if (isGlobalMode) exportMasterSummaryExcel(buildings);
    else if (reportType === 'expenses') exportExpensesMatrixExcel(currentBuilding, reportYear, EXPENSE_CATEGORIES);
    else exportDebtsLedgerExcel(currentBuilding);
  };

  const reportTitle = isGlobalMode
    ? `דוח הנהלה — ${buildings.length} בניינים מנוהלים`
    : `${reportType === 'expenses' ? `דוח הוצאות שנתי ${reportYear}` : 'דוח תקבולים וחובות'} — ${currentBuilding.name}${entrance !== 'all' ? ` (כניסה ${entrance})` : ''}`;

  return (
    <>
      {/* סרגל הגדרות הדוח */}
      <div className="card no-print stack" style={{ gap: 16 }}>
        {!isGlobalMode && (
          <div className="row" style={{ gap: 8 }}>
            <span className="field-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Bookmark size={15} /> מצבים שמורים:
            </span>
            {reportPresets.map(p => (
              <span key={p.id} className={`preset-chip${activePresetId === p.id ? ' is-active' : ''}`}>
                <button type="button" onClick={() => applyPreset(p)}>{p.name}</button>
                <button type="button" className="preset-remove" title="מחיקת המצב השמור" onClick={() => deletePreset(p.id)}><X size={12} /></button>
              </span>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSavePreset(true)}>
              <Save size={14} /> שמירת ההגדרות הנוכחיות
            </button>
          </div>
        )}

        <div className="row" style={{ justifyContent: 'space-between', gap: 14 }}>
          {isGlobalMode ? (
            <p className="section-sub" style={{ margin: 0 }}>
              דוח מרוכז לכלל הבניינים. לדוח הוצאות או חובות מפורט, בחרו בניין בסרגל העליון או לחצו על שם בניין בטבלה.
            </p>
          ) : (
            <div className="row" style={{ gap: 12 }}>
              <Segmented
                value={reportType}
                onChange={updateOption(setReportType)}
                options={[
                  { id: 'expenses', label: 'הוצאות שנתי' },
                  { id: 'debts', label: 'תקבולים וחובות' }
                ]}
              />
              {reportType === 'expenses' ? (
                <select className="select input-sm" style={{ width: 'auto' }} value={reportYear} onChange={(e) => updateOption(setReportYear)(e.target.value)} aria-label="שנת הדוח">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              ) : (
                <select
                  className="select input-sm"
                  style={{ width: 'auto' }}
                  value={entrance}
                  onChange={(e) => updateOption(setEntrance)(e.target.value)}
                  disabled={entrances.length === 0}
                  title={entrances.length === 0 ? 'הגדירו כניסה לדירות במסך הדיירים כדי לסנן לפי כניסה' : ''}
                  aria-label="היקף דירות"
                >
                  <option value="all">כל הבניין</option>
                  {entrances.map(en => <option key={en} value={en}>כניסה {en}</option>)}
                </select>
              )}
              <label className="check-chip">
                <input type="checkbox" checked={includeLevies} onChange={(e) => updateOption(setIncludeLevies)(e.target.checked)} />
                צירוף קופות גבייה מיוחדות
              </label>
            </div>
          )}

          <div className="row" style={{ gap: 8 }}>
            <button onClick={handleWhatsAppShare} className="btn btn-secondary" title="שליחת סיכום בוואטסאפ">
              <Share2 size={16} /> וואטסאפ
            </button>
            <button onClick={() => window.print()} className="btn btn-secondary">
              <Printer size={16} /> הדפסה
            </button>
            <button onClick={handleExcelExport} className="btn btn-primary">
              <FileSpreadsheet size={16} /> {isGlobalMode ? 'אקסל מאסטר' : 'ייצוא לאקסל'}
            </button>
          </div>
        </div>
      </div>

      {/* מסמך הדוח */}
      <div className="card report-doc">
        <div className="letterhead">
          <div>
            <div className="letterhead-name">{companyName}</div>
            <div className="letterhead-tag">ניהול ועד בית ואחזקת מבנים</div>
            <h2 className="letterhead-title">{reportTitle}</h2>
            {currentBuilding && <div className="muted" style={{ fontSize: '0.85rem' }}>{currentBuilding.address}</div>}
          </div>
          <div style={{ textAlign: 'left' }}>
            <img src="/logo.png" alt="" style={{ height: 64, width: 'auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="muted" style={{ fontSize: '0.8rem', marginTop: 6 }}>הופק: {new Date().toLocaleDateString('he-IL')}</div>
          </div>
        </div>

        {isGlobalMode ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>בניין</th>
                  <th>חשבון / קוד חיובית</th>
                  <th className="col-center">דירות</th>
                  <th className="num">יתרת קופה</th>
                  <th className="num">צפי גבייה</th>
                  <th className="num">חובות</th>
                  <th className="col-center">פניות</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map(b => {
                  const debts = buildingDebt(b);
                  const issues = openIssuesCount(b);
                  return (
                    <tr key={b.id}>
                      <td><BuildingName name={b.name} color={b.color} sub={b.address} onClick={() => setSelectedBuildingId(b.id)} /></td>
                      <td style={{ fontSize: '0.84rem' }}>
                        {b.bankAccount || <span className="muted">טרם הוזן</span>}
                        {b.hiyuvitCode && <span className="cell-sub">קוד {b.hiyuvitCode}</span>}
                      </td>
                      <td className="col-center num">{b.apartments?.length || 0}</td>
                      <td className="num cell-strong" style={{ color: (b.currentBalance || 0) < 0 ? 'var(--coral-600)' : undefined }}>{formatILS(b.currentBalance)}</td>
                      <td className="num">{formatILS(buildingExpectedMonthly(b))}</td>
                      <td className="num">{debts > 0 ? <span className="amount-out">{formatILS(debts)}</span> : <span className="muted">—</span>}</td>
                      <td className="col-center">{issues > 0 ? <span className="badge badge-warning">{issues}</span> : <span className="muted">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>סה״כ {buildings.length} בניינים</td>
                  <td className="col-center num">{totalApartments}</td>
                  <td className="num">{formatILS(totalBalance)}</td>
                  <td className="num">{formatILS(totalExpected)}</td>
                  <td className="num">{formatILS(totalDebts)}</td>
                  <td className="col-center">{totalOpenIssues}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : reportType === 'expenses' ? (
          <ExpensesMatrix building={currentBuilding} year={reportYear} />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>דירה</th>
                  <th>דייר</th>
                  <th>טלפון</th>
                  <th>אופן תשלום</th>
                  <th className="num">דמי ועד</th>
                  <th>חודשים בחוב</th>
                  <th className="num">חוב מצטבר</th>
                </tr>
              </thead>
              <tbody>
                {reportApartments.map(apt => (
                  <tr key={apt.id} className={hasDebt(apt) ? 'row-alert' : ''}>
                    <td className="cell-strong">{apt.aptNum}</td>
                    <td>{apt.tenantName}</td>
                    <td className="ltr">{apt.phone || '—'}</td>
                    <td><span className="badge badge-neutral">{apt.paymentMethod || 'חיובית'}</span></td>
                    <td className="num">{formatILS(apt.monthlyDues)}</td>
                    <td>{hasDebt(apt) ? apt.debtMonths.join(', ') : <span className="badge badge-success">שולם</span>}</td>
                    <td className="num">{hasDebt(apt) ? <span className="amount-out">{formatILS(aptDebt(apt))}</span> : '0 ₪'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6}>סה״כ חובות פתוחים{entrance !== 'all' ? ` בכניסה ${entrance}` : ''}</td>
                  <td className="num">{formatILS(reportDebts)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {!isGlobalMode && includeLevies && (
          <div className="stack" style={{ marginTop: 28 }}>
            <h3 className="section-title">קופות גבייה מיוחדות</h3>
            {levies.length === 0 ? (
              <p className="muted">אין בבניין פרויקטי גבייה מיוחדים.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>פרויקט</th><th>נפתח</th><th className="num">עלות</th><th className="num">לדירה</th><th className="col-center">שילמו</th><th className="num">נגבה</th><th className="num">יתרה לגבייה</th></tr>
                  </thead>
                  <tbody>
                    {levies.map(l => {
                      const paid = l.paidApartmentIds?.length || 0;
                      const collected = paid * (l.amountPerApt || 0);
                      return (
                        <tr key={l.id}>
                          <td className="cell-strong">{l.title}</td>
                          <td>{l.createdAt}</td>
                          <td className="num">{formatILS(l.totalAmount)}</td>
                          <td className="num">{formatILS(l.amountPerApt)}</td>
                          <td className="col-center num">{paid} / {currentBuilding.apartments?.length || 0}</td>
                          <td className="num amount-in">{formatILS(collected)}</td>
                          <td className="num amount-out">{formatILS(Math.max((l.totalAmount || 0) - collected, 0))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="report-footer">
          <span><strong>{companyName}</strong> · ניהול ועד בית, אחזקה וגבייה</span>
          <span>חתימת מנהל: __________________</span>
        </div>
      </div>

      <Modal isOpen={showSavePreset} onClose={() => setShowSavePreset(false)} size="sm" title="שמירת מצב דוח" subtitle="ההגדרות הנוכחיות יישמרו להפקה מהירה בלחיצה אחת.">
        <form onSubmit={handleSavePreset} className="form-stack">
          <Field label="שם המצב">
            <input type="text" required autoFocus value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} className="input" placeholder="למשל: דוח אמצע שנה" />
          </Field>
          <div className="info-panel muted" style={{ fontSize: '0.84rem' }}>
            {reportType === 'expenses' ? 'דוח הוצאות שנתי' : 'דוח תקבולים וחובות'}
            {entrance !== 'all' ? ` · כניסה ${entrance}` : ' · כל הבניין'}
            {includeLevies ? ' · כולל קופות מיוחדות' : ''}
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">שמירה</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowSavePreset(false)}>ביטול</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function ExpensesMatrix({ building, year }) {
  const sums = EXPENSE_CATEGORIES.map(cat => {
    const months = HEBREW_MONTHS.map((_, mIdx) => {
      const key = `${year}-${String(mIdx + 1).padStart(2, '0')}`;
      return (building.expenses || [])
        .filter(exp => exp.month === key && exp.category === cat && exp.amount > 0)
        .reduce((acc, exp) => acc + (parseFloat(exp.amount) || 0), 0);
    });
    return { cat, months, total: months.reduce((a, b) => a + b, 0) };
  });
  const monthTotals = HEBREW_MONTHS.map((_, i) => sums.reduce((acc, row) => acc + row.months[i], 0));
  const grandTotal = monthTotals.reduce((a, b) => a + b, 0);
  const fmt = (n) => (n ? Math.round(n).toLocaleString('he-IL') : '—');

  return (
    <div className="table-wrap">
      <table className="data-table data-table-compact matrix">
        <thead>
          <tr>
            <th>סעיף</th>
            {HEBREW_MONTHS.map(m => <th key={m} className="col-center">{m}</th>)}
            <th className="num">סה״כ</th>
          </tr>
        </thead>
        <tbody>
          {sums.map(row => (
            <tr key={row.cat}>
              <td className="cell-strong" style={{ whiteSpace: 'nowrap' }}>{row.cat}</td>
              {row.months.map((v, i) => <td key={i} className={`col-center num${v ? '' : ' muted'}`}>{fmt(v)}</td>)}
              <td className="num cell-strong">{formatILS(row.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>סה״כ</td>
            {monthTotals.map((v, i) => <td key={i} className="col-center num">{fmt(v)}</td>)}
            <td className="num">{formatILS(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
