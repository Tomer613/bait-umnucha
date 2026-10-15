// ==========================================================================
// בית ומנוחה - דוחות ומכתבים: מחולל דוחות + אשף מכתבים ותפוצה
// ==========================================================================
import React from 'react';
import { useApp } from '../context/AppContext';
import { FileSpreadsheet, Mail } from 'lucide-react';
import { PageHeader, SubTabs } from './ui';
import ReportGenerator from './ReportGenerator';
import NoticesView from './NoticesView';

export default function ReportsHub() {
  const { currentBuilding, activeSubTab, setActiveSubTab } = useApp();
  const subTab = activeSubTab || 'reports';

  return (
    <div className="page">
      <PageHeader title="דוחות ומכתבים" subtitle="דוחות כספיים להפקה, ומכתבים לתלייה ולשליחה במייל" />
      <SubTabs
        active={subTab}
        onChange={setActiveSubTab}
        tabs={[
          { id: 'reports', label: 'דוחות כספיים', icon: FileSpreadsheet },
          { id: 'letters', label: 'מודעות ומכתבים', icon: Mail }
        ]}
      />
      {subTab === 'letters' ? <NoticesView /> : <ReportGenerator key={currentBuilding?.id || 'all'} />}
    </div>
  );
}
