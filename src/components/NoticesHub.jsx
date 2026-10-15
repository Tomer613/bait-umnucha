// ==========================================================================
// בית ומנוחה - מודעות ומכתבים: בחירת תבנית, עריכה, הדפסה ושליחה
// ==========================================================================
import React from 'react';
import { PageHeader } from './ui';
import NoticesView from './NoticesView';

export default function NoticesHub() {
  return (
    <div className="page">
      <PageHeader title="מודעות ומכתבים" subtitle="מודעות לתלייה בבניין ומכתבים לדיירים" />
      <NoticesView />
    </div>
  );
}
