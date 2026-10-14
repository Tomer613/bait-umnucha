// ==========================================================================
// בית ומנוחה - דשבורד-על ראשי לכל 15 הבניינים
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
  ChevronLeft, 
  PlusCircle, 
  FileSpreadsheet, 
  Send,
  ArrowUpRight
} from 'lucide-react';

export default function MasterDashboard({ onOpenAddBuilding }) {
  const { buildings, setSelectedBuildingId, setActiveTab } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // חישוב מדדי על
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

  // סינון בניינים לפי חיפוש
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
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-danger)' }}>
            {totalDebtsSum.toLocaleString('he-IL')} ₪
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>{totalDebtorsCount} דירות בחוב</span>
        </div>

        {/* Open Issues */}
        <div className="card" style={{ background: '#FFFFFF', borderRight: '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-brown-500)' }}>פניות ועד פתוחות</span>
            <div style={{ background: 'var(--color-warning-bg)', padding: 7, borderRadius: 'var(--radius-sm)' }}>
              <MessageSquare size={18} color="var(--color-warning)" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
            {totalOpenIssues}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}>ממתינות למענה / טיפול</span>
        </div>
      </div>

      {/* Buildings List Table & Search */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table Toolbar */}
        <div style={{
          padding: '16px 20px',
          background: 'var(--color-gold-50)',
          borderBottom: '1px solid var(--color-beige-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-brown-900)' }}>
            רשימת הבניינים המנוהלים ({filteredBuildings.length})
          </h3>

          <div style={{ position: 'relative', width: 280 }}>
            <input
              type="text"
              placeholder="חיפוש לפי שם בניין או כתובת..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingRight: 36, fontSize: '0.88rem' }}
            />
            <Search size={16} color="var(--color-brown-400)" style={{ position: 'absolute', right: 12, top: 12 }} />
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: '#FFFFFF', borderBottom: '1px solid var(--color-beige-border)', fontSize: '0.85rem', color: 'var(--color-brown-500)' }}>
                <th style={{ padding: '14px 20px' }}>שם הבניין וכתובת</th>
                <th style={{ padding: '14px 16px' }}>חשבון בנק</th>
                <th style={{ padding: '14px 16px' }}>יתרת קופה</th>
                <th style={{ padding: '14px 16px' }}>סטטוס קליטת ספטמבר</th>
                <th style={{ padding: '14px 16px' }}>חובות דיירים</th>
                <th style={{ padding: '14px 16px' }}>פניות פתוחות</th>
                <th style={{ padding: '14px 20px', textAlign: 'center' }}>פעולות מהירות</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuildings.map((b) => {
                const bDebts = (b.apartments || []).reduce((acc, apt) => {
                  return acc + ((apt.debtMonths ? apt.debtMonths.length : 0) * (apt.monthlyDues || 0));
                }, 0);
                const bOpenIssues = (b.issues || []).filter(i => i.status === 'open').length;

                return (
                  <tr 
                    key={b.id}
                    style={{ 
                      borderBottom: '1px solid var(--color-beige-divider)',
                      transition: 'background 0.15s'
                    }}
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
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
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
