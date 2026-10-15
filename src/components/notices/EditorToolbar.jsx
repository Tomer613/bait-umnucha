// ==========================================================================
// בית ומנוחה - סרגל עיצוב מינימלי לעורך המודעות (אפיון 03, סעיף 5)
// מודגש · קו תחתון · גודל (רגיל / גדול / כותרת) · יישור · תבליטים · אדום · תמונה · טבלה
// ==========================================================================
import React, { useRef, useState } from 'react';
import { Bold, Underline, AlignRight, AlignCenter, List, Image, Table, Highlighter, Braces, TextCursorInput } from 'lucide-react';
import { resizeImage, AUTO_FIELDS } from '../../utils/notices';

const exec = (cmd, value = null) => document.execCommand(cmd, false, value);

export default function EditorToolbar({ editorRef, onChange, templateMode = false, onMakeField, onInsertAuto }) {
  const fileRef = useRef(null);
  const savedRange = useRef(null);
  const [tableOpen, setTableOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(4);

  // לחיצה על הסרגל לא תוציא את הסמן מהעורך
  const keep = (e) => e.preventDefault();
  const saveRange = () => {
    const sel = window.getSelection();
    if (sel.rangeCount && editorRef.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreRange = () => {
    editorRef.current?.focus();
    if (savedRange.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };
  const run = (fn) => () => { editorRef.current?.focus(); fn(); onChange?.(); };

  const insertImage = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const data = await resizeImage(file);
    restoreRange();
    exec('insertHTML', `<p style="text-align:center"><img src="${data}" alt="" class="notice-img"></p>`);
    onChange?.();
  };

  const insertTable = () => {
    const head = `<tr>${Array.from({ length: cols }, (_, i) => `<th>עמודה ${i + 1}</th>`).join('')}</tr>`;
    const body = Array.from({ length: rows }, () => `<tr>${'<td>&nbsp;</td>'.repeat(cols)}</tr>`).join('');
    restoreRange();
    exec('insertHTML', `<table class="sign-table"><thead>${head}</thead><tbody>${body}</tbody></table><p><br></p>`);
    setTableOpen(false);
    onChange?.();
  };

  return (
    <div className="editor-toolbar no-print" onMouseDown={saveRange}>
      <button type="button" title="מודגש" onMouseDown={keep} onClick={run(() => exec('bold'))}><Bold size={16} /></button>
      <button type="button" title="קו תחתון" onMouseDown={keep} onClick={run(() => exec('underline'))}><Underline size={16} /></button>
      <button type="button" title="הדגשה באדום" className="tb-red" onMouseDown={keep} onClick={run(() => exec('foreColor', '#B3260A'))}><Highlighter size={16} /></button>
      <span className="tb-sep" />
      <select
        title="גודל"
        defaultValue=""
        onMouseDown={saveRange}
        onChange={(e) => { const v = e.target.value; e.target.value = ''; restoreRange(); exec('formatBlock', v); onChange?.(); }}
      >
        <option value="" disabled>גודל</option>
        <option value="p">רגיל</option>
        <option value="h3">גדול</option>
        <option value="h2">כותרת</option>
      </select>
      <button type="button" title="יישור לימין" onMouseDown={keep} onClick={run(() => exec('justifyRight'))}><AlignRight size={16} /></button>
      <button type="button" title="מרכוז" onMouseDown={keep} onClick={run(() => exec('justifyCenter'))}><AlignCenter size={16} /></button>
      <button type="button" title="רשימת תבליטים" onMouseDown={keep} onClick={run(() => exec('insertUnorderedList'))}><List size={16} /></button>
      <span className="tb-sep" />
      <button type="button" title="הוספת תמונה" onMouseDown={keep} onClick={() => fileRef.current?.click()}><Image size={16} /></button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={insertImage} />
      <span className="tb-pop">
        <button type="button" title="הוספת טבלה" onMouseDown={keep} onClick={() => setTableOpen(o => !o)}><Table size={16} /></button>
        {tableOpen && (
          <span className="tb-popover" onMouseDown={(e) => e.stopPropagation()}>
            <label>עמודות <input type="number" min="1" max="8" value={cols} onChange={(e) => setCols(Math.max(1, Math.min(8, +e.target.value || 1)))} /></label>
            <label>שורות <input type="number" min="1" max="30" value={rows} onChange={(e) => setRows(Math.max(1, Math.min(30, +e.target.value || 1)))} /></label>
            <button type="button" className="btn btn-primary btn-sm" onClick={insertTable}>הוספה</button>
          </span>
        )}
      </span>
      {templateMode && (
        <>
          <span className="tb-sep" />
          <button type="button" className="tb-text" title="סמנו טקסט בעורך והפכו אותו לשדה לעריכה" onMouseDown={keep} onClick={() => { saveRange(); onMakeField?.(savedRange.current); }}>
            <TextCursorInput size={16} /> הפוך לשדה
          </button>
          <span className="tb-pop">
            <button type="button" className="tb-text" title="הוספת שדה שהמערכת ממלאת לבד" onMouseDown={keep} onClick={() => setAutoOpen(o => !o)}><Braces size={16} /> שדה אוטומטי</button>
            {autoOpen && (
              <span className="tb-popover tb-list" onMouseDown={(e) => e.stopPropagation()}>
                {AUTO_FIELDS.map(f => (
                  <button key={f.name} type="button" onMouseDown={keep} onClick={() => { restoreRange(); onInsertAuto?.(f.name); setAutoOpen(false); }}>{f.label}</button>
                ))}
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
}
