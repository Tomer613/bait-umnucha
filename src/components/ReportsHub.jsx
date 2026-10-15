// ==========================================================================
// בית ומנוחה - דוחות כספיים להפקה ולשליחה
// ==========================================================================
import React from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from './ui';
import ReportGenerator from './ReportGenerator';

export default function ReportsHub() {
  const { currentBuilding } = useApp();
  return (
    <div className="page">
      <PageHeader title="דוחות" subtitle="דוחות כספיים להדפסה, לאקסל ולשליחה בוואטסאפ" />
      <ReportGenerator key={currentBuilding?.id || 'all'} />
    </div>
  );
}
