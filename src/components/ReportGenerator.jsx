// ==========================================================================
// בית ומנוחה - מחולל דוחות: דוח הנהלה לכלל הבניינים, או דוח הוצאות/חובות לבניין
// עם מצבים שמורים (Presets), סינון לפי כניסה וצירוף קופות מיוחדות
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportExpensesMatrixExcel, exportDebtsLedgerExcel, exportMasterSummaryExcel } from '../utils/excelHelper';
import { Printer, FileSpreadsheet, Share2, Bookmark, X, Save, AlertTriangle } from 'lucide-react';
import { Segmented, Modal, Field, BuildingName, BuildingAvatar } from './ui';
import {
  HEBREW_MONTHS,
  formatILS,
  formatMonth as formatMonthName,
  todayISO,
  aptDebt,
  hasDebt,
  buildingDebt,
  buildingExpectedMonthly,
  openIssuesCount,
  sumBy
} from '../utils/format';
import { buildingBalance, activeTransactions, expenseSum, formatDateIL } from '../utils/ledger';
import { isCommercial, unitLabel, unitDisplayName } from '../utils/units';
import { levyTotals } from '../utils/levies';
import { planTotals, counterpartyText } from '../utils/paymentPlans';
import { reportMonths, openMonthsIn, reportLogEntry, staleReports, REPORT_LABELS, CHANNEL_LABELS } from '../utils/reportLog';

export default function ReportGenerator() {
  const { currentBuilding, buildings, setSelectedBuildingId, setActiveTab, reportPresets, savePreset, deletePreset, currentMonth, systemSettings, expenseCategories, logReport } = useApp();

  const isGlobalMode = !currentBuilding;
  const companyName = systemSettings?.companyName || 'בית ומנוחה';

  // הגדרות הדוח
  const [reportType, setReportType] = useState('expenses'); // expenses | debts
  const [reportYear, setReportYear] = useState(currentMonth.slice(0, 4));
  const [includeLevies, setIncludeLevies] = useState(false);
  const [entrance, setEntrance] = useState('all');
  const [activePresetId, setActivePresetId] = useState(null);

  const [showSavePreset, setShowSavePreset] = useState(false);
  const [pendingProduce, setPendingProduce] = useState(null); // הפקה שממתינה לאישור "טיוטה"
  const [newPresetName, setNewPresetName] = useState('');

  // ------------------------------------------------------------------------
  // נתונים
  // ------------------------------------------------------------------------
  const totalBalance = sumBy(buildings, buildingBalance);
  const totalApartments = sumBy(buildings, b => b.apartments?.length || 0);
  const totalExpected = sumBy(buildings, buildingExpectedMonthly);
  const totalDebts = sumBy(buildings, buildingDebt);
  const totalOpenIssues = sumBy(buildings, openIssuesCount);

  const entrances = currentBuilding
    ? Array.from(new Set((currentBuilding.apartments || []).map(a => a.entrance).filter(Boolean))).sort()
    : [];
  const years = Array.from(new Set([
    currentMonth.slice(0, 4),
    ...activeTransactions(currentBuilding).map(tx => (tx.month || '').slice(0, 4)).filter(Boolean)
  ])).sort().reverse();

  const reportApartments = (currentBuilding?.apartments || []).filter(a => entrance === 'all' || a.entrance === entrance);
  const reportDebts = reportApartments.reduce((s, a) => s + aptDebt(a), 0);
  const levies = currentBuilding?.specialLevies || [];

  // דוח שכולל חודש פתוח הוא טיוטה (אפיון 04, סעיף 6.5)
  const periodMonths = currentBuilding ? reportMonths(reportType, { year: reportYear, currentMonth }) : [];
  const openMonths = currentBuilding ? openMonthsIn(currentBuilding, periodMonths, currentMonth) : [];
  const isDraft = openMonths.length > 0;
  const stale = currentBuilding ? staleReports(currentBuilding) : [];
  const todayIso = todayISO();
  const activePlans = (currentBuilding?.paymentPlans || []).filter(p => p.status === 'active');

  // כל הפקה נרשמת ביומן הדוחות; דוח שכולל חודש פתוח — קודם שואלים
  const produce = (channel, run) => {
    if (isGlobalMode) { run(); return; }
    const go = () => {
      logReport(currentBuilding.id, reportLogEntry(currentBuilding, reportType, { year: reportYear, currentMonth, channel }));
      run();
    };
    if (isDraft) setPendingProduce({ channel, go });
    else go();
  };

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
        `יתרת קופה: ${formatILS(buildingBalance(currentBuilding))} · חובות פתוחים: ${formatILS(reportDebts)}\n${companyName}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleExcelExport = () => {
    if (isGlobalMode) exportMasterSummaryExcel(buildings);
    else if (reportType === 'expenses') exportExpensesMatrixExcel(currentBuilding, reportYear, reportCategories(currentBuilding, reportYear, expenseCategories));
    else exportDebtsLedgerExcel(currentBuilding);
  };

  const reportTitle = isGlobalMode
    ? `דוח הנהלה — ${buildings.length} בניינים מנוהלים`
    : `${reportType === 'expenses' ? `דוח הוצאות שנתי ${reportYear}` : 'דוח תקבולים וחובות'} — ${currentBuilding.name}${entrance !== 'all' ? ` (כניסה ${entrance})` : ''}`;

  return (
    <>
      {stale.length > 0 && (
        <div className="alert alert-warning no-print stack" style={{ gap: 6, alignItems: 'stretch' }}>
          <span className="row" style={{ gap: 8 }}><AlertTriangle size={18} /> <strong>דוחות שנשלחו והשתנו מאז</strong></span>
          {stale.map(({ report, changes }) => (
            <span key={report.id}>
              {REPORT_LABELS[report.type]} {report.period} ({CHANNEL_LABELS[report.channel] || report.channel}, {formatDateIL(report.at.slice(0, 10))}):
              {' '}{changes.map(c => `${c.label}${c.expenses ? ` · הוצאות ${c.expenses > 0 ? '+' : '−'}${formatILS(Math.abs(c.expenses))}` : ''}${c.income ? ` · הכנסות ${c.income > 0 ? '+' : '−'}${formatILS(Math.abs(c.income))}` : ''}`).join('; ')}.
              {' '}כדאי להפיק ולשלוח דוח מעודכן.
            </span>
          ))}
        </div>
      )}

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
              דוח מרוכז לכלל הבניינים. לדוח הוצאות או חובות מפורט, בחרו בניין מתפריט הבניינים או לחצו על שם בניין בטבלה.
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
            <button onClick={() => produce('whatsapp', handleWhatsAppShare)} className="btn btn-secondary" title="שליחת סיכום בוואטסאפ">
              <Share2 size={16} /> וואטסאפ
            </button>
            <button onClick={() => produce('print', () => window.print())} className="btn btn-secondary">
              <Printer size={16} /> הדפסה
            </button>
            <button onClick={() => produce('excel', handleExcelExport)} className="btn btn-primary">
              <FileSpreadsheet size={16} /> {isGlobalMode ? 'אקסל מאסטר' : 'ייצוא לאקסל'}
            </button>
          </div>
        </div>
      </div>

      {/* מסמך הדוח */}
      <div className={`card report-doc${!isGlobalMode && isDraft ? ' is-draft' : ''}`}>
        {!isGlobalMode && isDraft && (
          <div className="draft-banner">
            <AlertTriangle size={16} />
            {reportType === 'debts'
              ? `טיוטה – ${formatMonthName(currentMonth)} טרם נסגר. הנתונים עשויים להשתנות.`
              : `טיוטה – ${openMonths.map(formatMonthName).join(', ')} ${openMonths.length === 1 ? 'טרם נסגר' : 'טרם נסגרו'}. הנתונים שלהם עשויים להשתנות.`}
          </div>
        )}
        <div className="letterhead">
          <div>
            <div className="letterhead-name">{companyName}</div>
            <div className="letterhead-tag">ניהול ועד בית ואחזקת מבנים</div>
            <h2 className="letterhead-title title-with-plaque">{currentBuilding && <BuildingAvatar name={currentBuilding.name} color={currentBuilding.color} />}{reportTitle}</h2>
            {currentBuilding && <div className="muted" style={{ fontSize: '0.88rem' }}>{currentBuilding.address}</div>}
          </div>
          <div style={{ textAlign: 'left' }}>
            <img src="/logo.png" alt="" style={{ height: 64, width: 'auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="muted" style={{ fontSize: '0.86rem', marginTop: 6 }}>הופק: {new Date().toLocaleDateString('he-IL')}</div>
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
                      <td style={{ fontSize: '0.87rem' }}>
                        {b.bankAccount || <span className="muted">טרם הוזן</span>}
                        {b.hiyuvitCode && <span className="cell-sub">קוד {b.hiyuvitCode}</span>}
                      </td>
                      <td className="col-center num">{b.apartments?.length || 0}</td>
                      <td className="num cell-strong" style={{ color: buildingBalance(b) < 0 ? 'var(--coral-600)' : undefined }}>{formatILS(buildingBalance(b))}</td>
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
          <ExpensesMatrix building={currentBuilding} year={reportYear} categories={reportCategories(currentBuilding, reportYear, expenseCategories)} />
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
                {[...reportApartments.filter(a => !isCommercial(a)), ...reportApartments.filter(isCommercial)].map((apt, i, arr) => (
                  <React.Fragment key={apt.id}>
                  {isCommercial(apt) && !isCommercial(arr[i - 1]) && (
                    <tr className="group-row"><td colSpan={7}>יחידות מסחר</td></tr>
                  )}
                  <tr className={hasDebt(apt) ? 'row-alert' : ''}>
                    <td className="cell-strong">{isCommercial(apt) ? unitLabel(apt) : apt.aptNum}</td>
                    <td>{unitDisplayName(apt)}</td>
                    <td className="ltr">{apt.phone || '—'}</td>
                    <td><span className="badge badge-neutral">{apt.paymentMethod || 'חיובית'}</span></td>
                    <td className="num">{formatILS(apt.monthlyDues)}</td>
                    <td>{hasDebt(apt) ? apt.debtMonths.join(', ') : <span className="badge badge-success">שולם</span>}</td>
                    <td className="num">{hasDebt(apt) ? <span className="amount-out">{formatILS(aptDebt(apt))}</span> : '0 ₪'}</td>
                  </tr>
                  </React.Fragment>
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

        {!isGlobalMode && reportType === 'debts' && activePlans.length > 0 && (
          <div className="stack" style={{ marginTop: 28 }}>
            <h3 className="section-title">פריסות חוב</h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>כיוון</th><th>צד שני</th><th>על מה</th><th className="col-center">שולמו</th><th className="num">נותר</th><th>תשלום הבא</th></tr></thead>
                <tbody>
                  {activePlans.map(p => {
                    const t = planTotals(p, todayIso);
                    return (
                      <tr key={p.id}>
                        <td>{p.direction === 'payable' ? 'התחייבות של הבניין' : 'חוב בהסדר לבניין'}</td>
                        <td className="cell-strong">{counterpartyText(p, currentBuilding)}</td>
                        <td>{p.purpose}</td>
                        <td className="col-center num">{t.paidCount} / {t.count}</td>
                        <td className={`num ${p.direction === 'payable' ? 'amount-out' : 'amount-in'}`}>{formatILS(t.remaining)}</td>
                        <td>{t.next ? `${formatDateIL(t.next.dueDate)} · ${formatILS(t.next.amount)}` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                    <tr><th>גבייה</th><th>בעבור</th><th>אופן</th><th className="num">יעד</th><th className="num">נגבה</th><th className="num">יתרה לגבייה</th></tr>
                  </thead>
                  <tbody>
                    {levies.filter(l => l.status !== 'cancelled').map(l => {
                      const t = levyTotals(l, currentBuilding, currentMonth);
                      return (
                        <tr key={l.id}>
                          <td className="cell-strong">{l.name}</td>
                          <td>{l.purpose}</td>
                          <td>{l.mode === 'monthly' ? `${formatILS(l.amountPerApt)} לחודש${l.installments ? ` × ${l.installments}` : ''}` : `${formatILS(l.amountPerApt)} לדירה`}{l.includesCommercial ? ' · כולל מסחר' : ''}</td>
                          <td className="num">{formatILS(t.target)}</td>
                          <td className="num amount-in">{formatILS(t.collected)}</td>
                          <td className="num amount-out">{formatILS(Math.max(t.target - t.collected, 0))}</td>
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

      <Modal
        isOpen={!!pendingProduce}
        onClose={() => setPendingProduce(null)}
        size="sm"
        title="הדוח כולל חודש פתוח"
        subtitle={`${openMonths.map(formatMonthName).join(', ')} עדיין ${openMonths.length === 1 ? 'פתוח' : 'פתוחים'}. הדוח יסומן כטיוטה.`}
      >
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={() => { const p = pendingProduce; setPendingProduce(null); p.go(); }}>להפיק כטיוטה</button>
          <button type="button" className="btn btn-secondary" onClick={() => { setPendingProduce(null); setActiveTab('finance'); }}>לסגירת החודש</button>
        </div>
      </Modal>

      <Modal isOpen={showSavePreset} onClose={() => setShowSavePreset(false)} size="sm" title="שמירת מצב דוח" subtitle="ההגדרות הנוכחיות יישמרו להפקה מהירה בלחיצה אחת.">
        <form onSubmit={handleSavePreset} className="form-stack">
          <Field label="שם המצב">
            <input type="text" required autoFocus value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} className="input" placeholder="למשל: דוח אמצע שנה" />
          </Field>
          <div className="info-panel muted" style={{ fontSize: '0.87rem' }}>
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

// קטגוריות הדוח: הרשימה מההגדרות, ובנוסף כל קטגוריה שיש בה הוצאות בשנה הזו
// (למשל קטגוריה שנמחקה מהרשימה) — כדי שאף סכום לא ייעלם מהדוח
function reportCategories(building, year, listed) {
  const used = activeTransactions(building)
    .filter(tx => tx.direction === 'out' && (tx.month || '').startsWith(year))
    .map(tx => tx.category);
  const extra = Array.from(new Set(used)).filter(c => c && !listed.includes(c));
  return [...listed, ...extra];
}

function ExpensesMatrix({ building, year, categories }) {
  const sums = categories.map(cat => {
    const months = HEBREW_MONTHS.map((_, mIdx) => {
      const key = `${year}-${String(mIdx + 1).padStart(2, '0')}`;
      return expenseSum(building, { month: key, category: cat });
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
