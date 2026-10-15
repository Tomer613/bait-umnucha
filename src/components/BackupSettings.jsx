// ==========================================================================
// בית ומנוחה - גיבוי ושחזור של כל נתוני המערכת (הגדרות)
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ConfirmModal from './ConfirmModal';
import { SettingsCard } from './ui';
import { Download, Upload } from 'lucide-react';

export default function BackupSettings() {
  const { buildings, exportFullBackup, importFullBackup } = useApp();
  const [pending, setPending] = useState(null); // { name, content } — קובץ שנבחר וממתין לאישור

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setPending({ name: file.name, content: event.target.result });
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <SettingsCard icon={Download} title="הורדת גיבוי" sub={`קובץ אחד עם כל ${buildings.length} הבניינים, הדירות, ההוצאות, התנועות וההגדרות. מומלץ לשמור עותק אחרי כל סגירת חודש.`}>
        <div>
          <button type="button" onClick={exportFullBackup} className="btn btn-primary"><Download size={16} /> הורדת גיבוי מלא</button>
        </div>
      </SettingsCard>

      <SettingsCard icon={Upload} title="שחזור מגיבוי" sub="טעינת קובץ גיבוי שנשמר בעבר. כל הנתונים הנוכחיים יוחלפו בנתונים שבקובץ.">
        <div>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> בחירת קובץ גיבוי…
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={onFile} />
          </label>
        </div>
      </SettingsCard>

      <ConfirmModal
        isOpen={!!pending}
        onClose={() => setPending(null)}
        onConfirm={() => importFullBackup(pending.content)}
        title="שחזור מגיבוי"
        question="להחליף את כל הנתונים בנתוני הגיבוי?"
        description={pending ? `קובץ: ${pending.name}` : ''}
        subDescription="כל הבניינים, הדירות, התנועות וההגדרות הנוכחיים יוחלפו בתוכן הקובץ. שינויים שנעשו אחרי שהגיבוי נשמר יאבדו. כדאי להוריד קודם גיבוי של המצב הנוכחי."
        confirmText="שחזור והחלפה"
      />
    </>
  );
}
