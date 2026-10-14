// ==========================================================================
// בית ומנוחה - דשבורד-על (15 בניינים) ודשבורד ממוקד לבניין נבחר
// מבנה ממשק אחיד, עקבי וקבוע לחלוטין בין "כלל הבניינים" לבין "בניין מסוים"
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Search, 
  PlusCircle, 
  FileSpreadsheet, 
  Send,
  ArrowUpRight,
  ArrowRight,
  Users,
  Wrench,
  Layers,
  ChevronRight,
  DollarSign
} from 'lucide-react';

export default function MasterDashboard({ onOpenAddBuilding }) {
  const { buildings, selectedBuildingId, setSelectedBuildingId, currentBuilding, setActiveTab } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const isGlobalMode = !currentBuilding || selectedBuildingId === 'all';

  // --------------------------------------------------------------------------
  // חישובי מדדים כלליים (כלל 15 הבניינים)
  // --------------------------------------------------------------------------
  const totalBalance = buildings.reduce((acc, b) => acc + (b.currentBalance || 0), 0);
  const totalApartments = buildings.reduce((acc, b) => acc + (b.apartments ? b.apartments.length : 0), 0);
  
  let totalDebtsSum = 0;
  let totalDebtorsCount = 0;
  buildings.forEach(b => {
    (b.apartments || []).forEach(apt => {
      const debtCount = apt.debtMonths ? apt.debtMonths.length : 0;
      if (debtCount > 0) {
        totalDebtorsCount++;
        totalDebtsSum += debtCount * (apt.monthlyDues || 0);
      }
    });
  });

  const totalOpenIssues = buildings.reduce((acc, b) => {
    const openCount = (b.issues || []).filter(i => i.status === 'open').length;
    return acc + openCount;
  }, 0);

  const updatedBuildingsCount = buildings.filter(b => b.statusMonthUpdated).length;

  const filteredBuildings = buildings.filter(b => 
    b.name.includes(searchTerm) || b.address.includes(searchTerm)
  );

  const enterBuilding = (buildingId, targetTab = 'financials') => {
    setSelectedBuildingId(buildingId);
    setActiveTab(targetTab);
  };

  // --------------------------------------------------------------------------
  // חישובי מדדים לבניין יחיד
  // --------------------------------------------------------------------------
  const bApts = currentBuilding?.apartments || [];
  const bDebtsCount = bApts.filter(a => a.debtMonths && a.debtMonths.length > 0).length;
  const bDebtsSum = bApts.reduce((acc, a) => acc + ((a.debtMonths?.length || 0) * (a.monthlyDues || 0)), 0);
  const bOpenIssues = (currentBuilding?.issues || []).filter(i => i.status === 'open').length;
  const bExpenses = currentBuilding?.expenses || [];

  const activeColor = currentBuilding?.color || {
    primary: 'var(--color-gold-500)',
    tint: 'var(--color-gold-50)',
    border: 'var(--color-gold-300)',
    tagBg: 'var(--color-gold-100)',
    text: 'var(--color-gold-700)',
    name: 'זהב מותג'
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* --------------------------------------------------------------------
          באנר ראשי עליון — מבנה קבוע ואחיד לחלוטין בשני המצבים!
          -------------------------------------------------------------------- */}
      <div className="card" style={{
        background: isGlobalMode 
          ? 'linear-gradient(135deg, #FFFFFF 0%, var(--color-gold-50) 100%)' 
          : `linear-gradient(135deg, ${activeColor.tint} 0%, #FFFFFF 100%)`,
        borderRadius: 'var(--radius-md)',
        padding: '24px 28px',
        border: `1.5px solid ${isGlobalMode ? 'var(--color-gold-300)' : activeColor.border}`,
        borderRight: `6px solid ${isGlobalMode ? 'var(--color-gold-500)' : activeColor.primary}`,
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span 
              className="badge" 
              style={{ 
                background: isGlobalMode ? 'var(--color-gold-100)' : activeColor.tagBg,
                color: isGlobalMode ? 'var(--color-gold-700)' : activeColor.text,
                border: `1px solid ${isGlobalMode ? 'var(--color-gold-300)' : activeColor.border}`,
                fontSize: '0.8rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isGlobalMode ? 'var(--color-gold-500)' : activeColor.primary }} />
              {isGlobalMode ? "מרכז שליטה מצרפי" : `חותמת צבע: ${activeColor.name}`}
            </span>
            <span style={{ fontSize: '0.85rem', color: isGlobalMode ? 'var(--color-gold-700)' : activeColor.primary, fontWeight: 700 }}>
              {isGlobalMode ? `כלל ${buildings.length} הבניינים המנוהלים` : currentBuilding.name}
            </span>
          </div>
          
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-brown-900)', lineHeight: 1.2, margin: 0 }}>
            {isGlobalMode ? "מרכז שליטה — מבט-על לכלל הבניינים" : currentBuilding.name}
          </h2>

          <p style={{ color: 'var(--color-brown-600)', fontSize: '0.95rem', margin: '6px 0 0' }}>
            {isGlobalMode
              ? `מרכז שליטה וניהול עבור כלל ${buildings.length} הבניינים המנוהלים בחברת בית ומנוחה`
              : `📍 ${currentBuilding.address} • 🏦 ${currentBuilding.bankAccount} • קוד בניין בחיובית: ${currentBuilding.hiyuvitCode || 'לא הוגדר'}`}
          </p>
        </div>

        {/* כפתורי פעולה עליונים — זהים לחלוטין בשני המצבים! */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isGlobalMode && onOpenAddBuilding && (
            <button
              onClick={onOpenAddBuilding}
              className="btn btn-secondary btn-md"
              style={{ background: '#FFFFFF', borderColor: 'var(--color-gold-500)', color: 'var(--color-gold-700)' }}
            >
              <PlusCircle size={17} />
              <span>הוספת בניין חדש</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('financials')}
            className="btn btn-primary btn-md"
          >
            <Layers size={17} />
            <span>קליטת כספים ותנועות</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className="btn btn-secondary btn-md"
          >
            <FileSpreadsheet size={17} />
            <span>מחולל דוחות ואקסל</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          4 אריחי מדדי מפתח (KPIs) — קבועים ונשארים תמיד בשני המצבים!
          -------------------------------------------------------------------- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* קופה / יתרה */}
        <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-gold-500)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)' }}>
              {isGlobalMode ? "יתרה מצרפית בקופות" : "יתרת קופה עדכנית"}
            </span>
            <div style={{ background: 'var(--color-gold-100)', padding: 7, borderRadius: 'var(--radius-sm)' }}>
              <Wallet size={18} color="var(--color-gold-600)" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            {(isGlobalMode ? totalBalance : (currentBuilding.currentBalance || 0)).toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-gold-600)' }}>
            {isGlobalMode ? `בכל ${buildings.length} חשבונות הבנק` : "בחשבון הבנק ובקופת המזומן"}
          </span>
        </div>

        {/* סטטוס קליטה / עדכון */}
        <div className="card" style={{ 
          background: '#FFFFFF', 
          borderRight: `4px solid ${isGlobalMode ? 'var(--color-success)' : (currentBuilding.statusMonthUpdated ? 'var(--color-success)' : 'var(--color-warning)')}`,
          padding: '18px 20px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)' }}>
              סטטוס קליטת החודש
            </span>
            <div style={{ 
              background: isGlobalMode || currentBuilding.statusMonthUpdated ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', 
              padding: 7, 
              borderRadius: 'var(--radius-sm)' 
            }}>
              {isGlobalMode || currentBuilding.statusMonthUpdated ? (
                <CheckCircle2 size={18} color="var(--color-success)" />
              ) : (
                <Clock size={18} color="var(--color-warning)" />
              )}
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            {isGlobalMode 
              ? `${updatedBuildingsCount} / ${buildings.length}` 
              : (currentBuilding.statusMonthUpdated ? 'מעודכן' : 'ממתין לקובץ')}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)' }}>
            {isGlobalMode ? "בניינים עודכנו בספטמבר" : "סליקת חיובית ועו״ש"}
          </span>
        </div>

        {/* חובות דיירים */}
        <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-danger)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)' }}>
              {isGlobalMode ? "חובות דיירים פתוחים" : "חובות דיירים בבניין"}
            </span>
            <div style={{ background: 'var(--color-danger-bg)', padding: 7, borderRadius: 'var(--radius-sm)' }}>
              <AlertCircle size={18} color="var(--color-danger)" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: (isGlobalMode ? totalDebtsSum : bDebtsSum) > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {(isGlobalMode ? totalDebtsSum : bDebtsSum).toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>
            {isGlobalMode 
              ? `ב-${totalDebtorsCount} דירות בפיגור` 
              : (bDebtsCount > 0 ? `${bDebtsCount} דירות בפיגור תשלום` : "כלל הדירות שילמו בזמן")}
          </span>
        </div>

        {/* פניות ותקלות */}
        <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-brown-600)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)' }}>
              {isGlobalMode ? "פניות ותקלות פתוחות" : "פניות שירות פתוחות"}
            </span>
            <div style={{ background: 'var(--color-rose-100)', padding: 7, borderRadius: 'var(--radius-sm)' }}>
              <MessageSquare size={18} color="var(--color-brown-700)" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            {isGlobalMode ? totalOpenIssues : bOpenIssues}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-600)' }}>
            {isGlobalMode ? `בכלל ${buildings.length} הבניינים` : "בטיפול בבניין זה"}
          </span>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          סרגל פעולות מהירות — קבוע ונשאר תמיד בשני המצבים!
          -------------------------------------------------------------------- */}
      <div style={{
        background: 'var(--color-gold-50)',
        border: '1px solid var(--color-gold-200)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ fontWeight: 700, color: 'var(--color-brown-900)', fontSize: '0.95rem' }}>
          ⚡ פעולות מהירות {isGlobalMode ? "במבט-על מצרפי" : `עבור ${currentBuilding.name}`}:
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('financials')} className="btn btn-secondary btn-sm" style={{ background: '#FFFFFF' }}>
            <Layers size={15} />
            <span>תנועות וכספים</span>
          </button>
          <button onClick={() => setActiveTab('reports')} className="btn btn-secondary btn-sm" style={{ background: '#FFFFFF' }}>
            <FileSpreadsheet size={15} />
            <span>מחולל דוחות</span>
          </button>
          <button onClick={() => setActiveTab('apartments')} className="btn btn-secondary btn-sm" style={{ background: '#FFFFFF' }}>
            <Users size={15} />
            <span>רשימת דירות</span>
          </button>
          <button onClick={() => setActiveTab('levies')} className="btn btn-secondary btn-sm" style={{ background: '#FFFFFF' }}>
            <Wrench size={15} />
            <span>גבייה מיוחדת</span>
          </button>
          <button onClick={() => setActiveTab('letters')} className="btn btn-secondary btn-sm" style={{ background: '#FFFFFF' }}>
            <Send size={15} />
            <span>אשף מכתבים וג'ימייל</span>
          </button>
          <button onClick={() => setActiveTab('issues')} className="btn btn-secondary btn-sm" style={{ background: '#FFFFFF' }}>
            <MessageSquare size={15} />
            <span>פניות ותקלות ({isGlobalMode ? totalOpenIssues : bOpenIssues})</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          אזור התוכן המרכזי
          -------------------------------------------------------------------- */}
      {isGlobalMode ? (
        /* Buildings Table Section for All Buildings */
        <div className="card" style={{ background: '#FFFFFF', padding: 0, overflow: 'hidden' }}>
          {/* Table Header & Search */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-beige-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brown-900)', margin: 0 }}>
                רשימת {buildings.length} הבניינים המנוהלים
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-brown-500)', margin: '4px 0 0' }}>
                לחץ על שורת בניין לצפייה ממוקדת או בחר פעולה מהירה
              </p>
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
              <Search size={18} color="var(--color-brown-400)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                placeholder="חיפוש בניין לפי שם או כתובת..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
                style={{ paddingRight: 38 }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: 'var(--color-cream-subtle)', borderBottom: '1px solid var(--color-beige-border)' }}>
                  <th style={{ padding: '14px 24px', fontWeight: 700 }}>בניין וכתובת</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>דירות</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>יתרת קופה</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>סטטוס קליטה</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>חובות פתוחים</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>פניות</th>
                  <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'center' }}>פעולות מהירות</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuildings.map(b => {
                  const bDebts = (b.apartments || []).reduce((acc, a) => {
                    return acc + ((a.debtMonths?.length || 0) * (a.monthlyDues || 0));
                  }, 0);
                  const bIssuesCount = (b.issues || []).filter(i => i.status === 'open').length;

                  return (
                    <tr 
                      key={b.id}
                      onClick={() => enterBuilding(b.id, 'financials')}
                      style={{ 
                        borderBottom: '1px solid var(--color-beige-divider)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-gold-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: b.color?.primary || 'var(--color-gold-500)', display: 'inline-block' }} />
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--color-brown-900)', fontSize: '0.98rem' }}>{b.name}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)' }}>{b.address}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '16px 16px', fontWeight: 600, color: 'var(--color-brown-700)' }}>
                        {b.apartments ? b.apartments.length : 0} דירות
                      </td>

                      <td style={{ padding: '16px 16px', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                        {(b.currentBalance || 0).toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
                      </td>

                      <td style={{ padding: '16px 16px' }}>
                        {b.statusMonthUpdated ? (
                          <span className="badge badge-success">מעודכן לספטמבר</span>
                        ) : (
                          <span className="badge badge-neutral">ממתין לקליטה</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 16px' }}>
                        {bDebts > 0 ? (
                          <span className="badge badge-danger">
                            {bDebts.toLocaleString('he-IL')} ₪
                          </span>
                        ) : (
                          <span className="badge badge-success">תקין (0 ₪)</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 16px' }}>
                        {bIssuesCount > 0 ? (
                          <span className="badge badge-gold">
                            <MessageSquare size={13} />
                            {bIssuesCount} פניות
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-brown-400)' }}>אין פניות</span>
                        )}
                      </td>

                      <td style={{ padding: '16px 20px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => enterBuilding(b.id, 'financials')}
                            className="btn btn-primary btn-sm"
                            title="ניהול כספים ותנועות"
                          >
                            <span>ניהול כספים</span>
                            <ArrowUpRight size={14} />
                          </button>
                          <button
                            onClick={() => enterBuilding(b.id, 'reports')}
                            className="btn btn-secondary btn-sm"
                            title="הפקת דוחות"
                          >
                            <FileSpreadsheet size={15} />
                          </button>
                          <button
                            onClick={() => enterBuilding(b.id, 'letters')}
                            className="btn btn-secondary btn-sm"
                            title="אשף מכתבים"
                          >
                            <Send size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* שני בלוקים לבניין יחיד: דירות וחובות + תנועות אחרונות */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }}>
          
          {/* מצב דירות וחובות */}
          <div className="card" style={{ background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                  דירות ומצב גבייה בבניין
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)' }}>
                  {bApts.length} דירות רשומות
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('apartments')}
                className="btn btn-secondary btn-sm"
              >
                לכל הדירות
                <ArrowLeftIcon />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-cream-subtle)', borderBottom: '1px solid var(--color-beige-border)' }}>
                    <th style={{ padding: '8px 12px' }}>דירה</th>
                    <th style={{ padding: '8px 12px' }}>דייר</th>
                    <th style={{ padding: '8px 12px' }}>דמי ועד</th>
                    <th style={{ padding: '8px 12px' }}>אמצעי תשלום</th>
                    <th style={{ padding: '8px 12px' }}>סטטוס חוב</th>
                  </tr>
                </thead>
                <tbody>
                  {bApts.map(apt => {
                    const hasDebt = apt.debtMonths && apt.debtMonths.length > 0;
                    return (
                      <tr key={apt.id} style={{ borderBottom: '1px solid var(--color-beige-divider)', background: hasDebt ? 'var(--color-danger-bg)' : 'transparent' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>דירה {apt.aptNum}</td>
                        <td style={{ padding: '10px 12px' }}>{apt.tenantName}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{apt.monthlyDues} ₪</td>
                        <td style={{ padding: '10px 12px', color: 'var(--color-brown-600)' }}>{apt.paymentMethod}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {hasDebt ? (
                            <span className="badge badge-danger" style={{ fontSize: '0.78rem' }}>
                              חוב: {apt.debtMonths.length * apt.monthlyDues} ₪ ({apt.debtMonths.join(', ')})
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
                              הוסדר
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* תנועות אחרונות בקופה */}
          <div className="card" style={{ background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
                  תנועות אחרונות בקופה
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)' }}>
                  הוצאות ותקבולים אחרונים שנרשמו
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('financials')}
                className="btn btn-secondary btn-sm"
              >
                לקליטת תנועות
                <ArrowLeftIcon />
              </button>
            </div>

            {bExpenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-brown-500)' }}>
                טרם נרשמו תנועות כספיות החודש
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-cream-subtle)', borderBottom: '1px solid var(--color-beige-border)' }}>
                      <th style={{ padding: '8px 12px' }}>תאריך</th>
                      <th style={{ padding: '8px 12px' }}>תיאור</th>
                      <th style={{ padding: '8px 12px' }}>קטגוריה</th>
                      <th style={{ padding: '8px 12px' }}>סכום</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bExpenses.slice(0, 6).map(exp => (
                      <tr key={exp.id} style={{ borderBottom: '1px solid var(--color-beige-divider)' }}>
                        <td style={{ padding: '10px 12px', fontSize: '0.82rem' }}>{exp.date}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{exp.description}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--color-brown-600)', fontSize: '0.82rem' }}>{exp.category}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-danger)' }}>
                          -{exp.amount.toLocaleString('he-IL')} ₪
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <span style={{ display: 'inline-block', transform: 'rotate(180deg)', marginRight: 4 }}>
      ➔
    </span>
  );
}
