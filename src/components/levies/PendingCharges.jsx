// ==========================================================================
// בית ומנוחה - חיובי חיובית שממתינים לשיוך (אפיון 05, סעיפים 4.3–4.4)
// חיובים שבתצוגה המקדימה נבחר להם "אחר כך" — משייכים כאן לגבייה, לדמי ועד או מסירים.
// ==========================================================================
import React from 'react';
import { Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatILS, formatMonth } from '../../utils/format';
import { unitLabel } from '../../utils/units';
import { formatDateIL } from '../../utils/ledger';
import { pendingGroups } from '../../utils/levies';

export default function PendingCharges({ building }) {
  const { resolvePendingCharges } = useApp();
  const groups = pendingGroups(building);
  if (groups.length === 0) return null;
  const units = Object.fromEntries((building.apartments || []).map(u => [u.id, u]));
  const levies = (building.specialLevies || []).filter(l => l.status === 'active');

  return (
    <div className="card stack" style={{ gap: 10, borderColor: 'var(--warning-border)' }}>
      <div className="row" style={{ gap: 10 }}>
        <span className="kpi-icon"><Clock size={18} /></span>
        <div>
          <h3 className="section-title">חיובים מחיובית שממתינים לשיוך</h3>
          <p className="section-sub">חיובים שלא תאמו לדמי הוועד או לגבייה קיימת. בחרו לאן הם שייכים.</p>
        </div>
      </div>
      {groups.map(g => (
        <div key={`${g.batch.id}-${g.groupKey}`} className="class-line">
          <span className="badge badge-warning">{formatILS(g.amount)}</span>
          <span>
            {g.items.length === 1 ? 'חיוב אחד' : `${g.items.length} חיובים`} ·{' '}
            {g.items.map(i => (units[i.unitId] ? unitLabel(units[i.unitId]) : i.name)).join(', ')} ·{' '}
            {Array.from(new Set(g.items.map(i => formatMonth(i.month)))).join(', ')}
            <span className="muted"> · מקובץ מ-{formatDateIL(g.batch.at.slice(0, 10))}</span>
          </span>
          <span className="class-actions">
            <select
              className="select input-sm"
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                if (v.startsWith('levy:')) resolvePendingCharges(building.id, g.batch.id, g.groupKey, { action: 'levy', levyId: v.slice(5) });
                else resolvePendingCharges(building.id, g.batch.id, g.groupKey, { action: v });
              }}
              aria-label="שיוך החיובים"
            >
              <option value="">שיוך…</option>
              <option value="dues">דמי ועד</option>
              {levies.map(l => <option key={l.id} value={`levy:${l.id}`}>גבייה: {l.name}</option>)}
              <option value="dismiss">לא לשייך (להסיר מהרשימה)</option>
            </select>
          </span>
        </div>
      ))}
    </div>
  );
}
