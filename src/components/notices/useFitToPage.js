// ==========================================================================
// בית ומנוחה - התאמת מודעה לדף A4 אחד: מקטין את --fit עד שהתוכן נכנס (עד 70%)
// ==========================================================================
import { useCallback, useRef, useState } from 'react';

export default function useFitToPage() {
  const contentRef = useRef(null);
  const [overflow, setOverflow] = useState(false);
  const fit = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    let f = 1;
    el.style.setProperty('--fit', '1');
    while (el.scrollHeight > el.clientHeight + 1 && f > 0.7) {
      f = Math.round((f - 0.04) * 100) / 100;
      el.style.setProperty('--fit', String(f));
    }
    setOverflow(el.scrollHeight > el.clientHeight + 1);
  }, []);
  return { contentRef, fit, overflow };
}
