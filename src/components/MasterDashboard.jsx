// ==========================================================================
// בית ומנוחה - דשבורד-על (15 בניינים) ודשבורד ממוקד לבניין נבחר
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

  // --------------------------------------------------------------------------
  // תצוגת דשבורד ממוקד לבניין יחיד שנבחר בדרופליסט
  // --------------------------------------------------------------------------
  if (selectedBuildingId !== 'all' && currentBuilding) {
    const bApts = currentBuilding.apartments || [];
    const bDebtsCount = bApts.filter(a => a.debtMonths && a.debtMonths.length > 0).length;
    const bDebtsSum = bApts.reduce((acc, a) => acc + ((a.debtMonths?.length || 0) * (a.monthlyDues || 0)), 0);
    const bOpenIssues = (currentBuilding.issues || []).filter(i => i.status === 'open').length;
    const bExpenses = currentBuilding.expenses || [];

    return (
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        
        {/* כותרת עליונה עם חזרה לכל הבניינים */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          padding: '24px 28px',
          border: '1px solid var(--color-beige-border)',
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
              <button
                onClick={() => setSelectedBuildingId('all')}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--color-brown-700)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ChevronRight size={16} />
                <span>חזרה לכלל 15 הבניינים</span>
              </button>
              <span className="badge badge-gold" style={{ fontSize: '0.8rem' }}>בניין פעיל כעת</span>
            </div>
            
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-brown-900)', lineHeight: 1.2 }}>
              {currentBuilding.name}
            </h2>
            <p style={{ color: 'var(--color-brown-600)', fontSize: '0.95rem', marginTop: 4 }}>
              📍 {currentBuilding.address} • 🏦 {currentBuilding.bankAccount} • קוד חיובית: {currentBuilding.hiyuvitCode || 'לא הוגדר'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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

        {/* 4 כרטיסי מדד לבניין הספציפי */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28
        }}>
          {/* קופה נוכחית */}
          <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-gold-500)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)' }}>יתרת קופה עדכנית</span>
              <div style={{ background: 'var(--color-gold-100)', padding: 7, borderRadius: 'var(--radius-sm)' }}>
                <Wallet size={18} color="var(--color-gold-600)" />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
              {(currentBuilding.currentBalance || 0).toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-gold-600)' }}>בחשבון הבנק ובקופת המזומן</span>
          </div>

          {/* סטטוס חודשי */}
          <div className="card" style={{ background: '#FFFFFF', borderRight: `4px solid ${currentBuilding.statusMonthUpdated ? 'var(--color-success)' : 'var(--color-warning)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)' }}>סטטוס קליטת החודש</span>
              <div style={{ background: currentBuilding.statusMonthUpdated ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', padding: 7, borderRadius: 'var(--radius-sm)' }}>
                {currentBuilding.statusMonthUpdated ? <CheckCircle2 size={18} color="var(--color-success)" /> : <Clock size={18} color="var(--color-warning)" />}
              </div>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: currentBuilding.statusMonthUpdated ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {currentBuilding.statusMonthUpdated ? 'מעודכן לספטמבר' : 'ממתין לקובצי חודש'}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)' }}>סליקת חיובית ועו״ש</span>
          </div>

          {/* חובות דיירים */}
          <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-danger)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)' }}>חובות דיירים בבניין</span>
              <div style={{ background: 'var(--color-danger-bg)', padding: 7, borderRadius: 'var(--radius-sm)' }}>
                <AlertCircle size={18} color="var(--color-danger)" />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: bDebtsSum > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {bDebtsSum > 0 ? `${bDebtsSum.toLocaleString('he-IL')} ₪` : 'מאופס'}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)' }}>
              {bDebtsCount > 0 ? `${bDebtsCount} דירות בפיגור תשלום` : 'כלל הדירות שילמו בזמן'}
            </span>
          </div>

          {/* דירות בבניין */}
          <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-brown-500)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)' }}>דירות מנוהלות</span>
              <div style={{ background: 'var(--color-cream-subtle)', padding: 7, borderRadius: 'var(--radius-sm)' }}>
                <Users size={18} color="var(--color-brown-600)" />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
              {bApts.length} דירות
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-500)' }}>
              {bOpenIssues > 0 ? `${bOpenIssues} פניות ועד פתוחות` : 'אין פניות פתוחות'}
            </span>
          </div>
        </div>

        {/* סרגל קיצורי דרך מהירים לפעולות בבניין */}
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
            ⚡ פעולות מהירות עבור {currentBuilding.name}:
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab('financials')} className="btn btn-secondary btn-sm">
              <Layers size={15} />
              <span>תנועות וכספים</span>
            </button>
            <button onClick={() => setActiveTab('reports')} className="btn btn-secondary btn-sm">
              <FileSpreadsheet size={15} />
              <span>מחולל דוחות</span>
            </button>
            <button onClick={() => setActiveTab('apartments')} className="btn btn-secondary btn-sm">
              <Users size={15} />
              <span>רשימת דירות</span>
            </button>
            <button onClick={() => setActiveTab('levies')} className="btn btn-secondary btn-sm">
              <Wrench size={15} />
              <span>גבייה מיוחדת</span>
            </button>
            <button onClick={() => setActiveTab('letters')} className="btn btn-secondary btn-sm">
              <Send size={15} />
              <span>אשף מכתבים וג'ימייל</span>
            </button>
            <button onClick={() => setActiveTab('issues')} className="btn btn-secondary btn-sm">
              <MessageSquare size={15} />
              <span>פניות ותקלות ({bOpenIssues})</span>
            </button>
          </div>
        </div>

        {/* שני בלוקים: דירות וחובות + תנועות אחרונות */}
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

      </div>
    );
  }

  // --------------------------------------------------------------------------
  // תצוגת דשבורד-על לכל 15 הבניינים (כאשר נבחר 'all')
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

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
      
      {/* Welcome & Overview Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            שלום תומר, מבט-על לכלל הבניינים
          </h2>
          <p style={{ color: 'var(--color-brown-600)', fontSize: '0.95rem' }}>
            מרכז שליטה וניהול עבור {buildings.length} הבניינים המנוהלים בחברת בית ומנוחה
          </p>
        </div>

        <button 
          onClick={onOpenAddBuilding}
          className="btn btn-primary btn-lg"
        >
          <PlusCircle size={20} />
          <span>הוספת בניין חדש</span>
        </button>
      </div>

      {/* Top Statistic Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        {/* Total Balance */}
        <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-gold-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)' }}>יתרה מצרפית בקופות</span>
            <div style={{ background: 'var(--color-gold-100)', padding: 7, borderRadius: 'var(--radius-sm)' }}>
              <Wallet size={18} color="var(--color-gold-600)" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            {totalBalance.toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-gold-600)' }}>בכל 15 חשבונות הבנק</span>
        </div>

        {/* Ingestion Status */}
        <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)' }}>סטטוס קליטת החודש</span>
            <div style={{ background: 'var(--color-success-bg)', padding: 7, borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle2 size={18} color="var(--color-success)" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            {updatedBuildingsCount} / {buildings.length}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>בניינים עודכנו בספטמבר</span>
        </div>

        {/* Outstanding Debts */}
        <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)' }}>חובות דיירים פתוחים</span>
            <div style={{ background: 'var(--color-danger-bg)', padding: 7, borderRadius: 'var(--radius-sm)' }}>
              <AlertCircle size={18} color="var(--color-danger)" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            {totalDebtsSum.toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>ב-{totalDebtorsCount} דירות בפיגור</span>
        </div>

        {/* Open Issues */}
        <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-brown-600)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)' }}>פניות ותקלות פתוחות</span>
            <div style={{ background: 'var(--color-rose-100)', padding: 7, borderRadius: 'var(--radius-sm)' }}>
              <MessageSquare size={18} color="var(--color-brown-700)" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            {totalOpenIssues}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-brown-600)' }}>בכלל 15 הבניינים</span>
        </div>
      </div>

      {/* Buildings Table Section */}
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
              רשימת 15 הבניינים המנוהלים
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-brown-500)' }}>
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

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: 'var(--color-cream-subtle)', borderBottom: '1px solid var(--color-beige-border)' }}>
                <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--color-brown-700)', fontSize: '0.88rem' }}>שם הבניין וכתובת</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-brown-700)', fontSize: '0.88rem' }}>חשבון בנק</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-brown-700)', fontSize: '0.88rem' }}>יתרה בקופה</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-brown-700)', fontSize: '0.88rem' }}>סטטוס קליטת חודש</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-brown-700)', fontSize: '0.88rem' }}>חובות דיירים</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-brown-700)', fontSize: '0.88rem' }}>פניות ועד</th>
                <th style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--color-brown-700)', fontSize: '0.88rem', textAlign: 'center' }}>פעולות מהירות</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuildings.map(b => {
                const bDebts = (b.apartments || []).reduce((acc, apt) => {
                  return acc + ((apt.debtMonths ? apt.debtMonths.length : 0) * (apt.monthlyDues || 0));
                }, 0);
                const bOpenIssues = (b.issues || []).filter(i => i.status === 'open').length;

                return (
                  <tr 
                    key={b.id}
                    style={{ 
                      borderBottom: '1px solid var(--color-beige-divider)',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onClick={() => setSelectedBuildingId(b.id)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-gold-50)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Name & Address */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.02rem', color: 'var(--color-brown-900)' }}>
                        {b.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-brown-500)' }}>
                        {b.address}
                      </div>
                    </td>

                    {/* Bank Account */}
                    <td style={{ padding: '16px 16px', fontSize: '0.88rem', color: 'var(--color-brown-700)' }}>
                      {b.bankAccount}
                    </td>

                    {/* Balance */}
                    <td style={{ padding: '16px 16px', fontWeight: 800, fontSize: '1rem', color: 'var(--color-brown-900)' }}>
                      {(b.currentBalance || 0).toLocaleString('he-IL', { maximumFractionDigits: 0 })} ₪
                    </td>

                    {/* Status Month Updated */}
                    <td style={{ padding: '16px 16px' }}>
                      {b.statusMonthUpdated ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={13} />
                          עודכן החודש
                        </span>
                      ) : (
                        <span className="badge badge-neutral">
                          <Clock size={13} />
                          ממתין לקבצים
                        </span>
                      )}
                    </td>

                    {/* Debts */}
                    <td style={{ padding: '16px 16px' }}>
                      {bDebts > 0 ? (
                        <span className="badge badge-danger">
                          {bDebts.toLocaleString('he-IL')} ₪ חוב
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          מאופס
                        </span>
                      )}
                    </td>

                    {/* Open Issues */}
                    <td style={{ padding: '16px 16px' }}>
                      {bOpenIssues > 0 ? (
                        <span className="badge badge-gold">
                          <MessageSquare size={13} />
                          {bOpenIssues} פניות
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-brown-400)' }}>אין פניות</span>
                      )}
                    </td>

                    {/* Actions */}
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
