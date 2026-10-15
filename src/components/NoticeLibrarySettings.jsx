// ==========================================================================
// בית ומנוחה - ניהול תבניות מודעות (אפיון 03, סעיף 8.6) — במסך ההגדרות בלבד
// קטגוריות (הוספה, שינוי שם, סדר, מחיקה של ריקה), תבניות (עריכה במחולל, שם, קטגוריה,
// שכפול, מחיקה לסל מחזור ל-30 יום), היסטוריית 5 גרסאות.
// ==========================================================================
import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, FolderPlus, Pencil, Trash2, Copy, ArrowUp, ArrowDown, History, RotateCcw, Plus, ChevronDown, ChevronLeft } from 'lucide-react';
import { Modal, Field } from './ui';
import ConfirmModal from './ConfirmModal';
import NoticeSheet from './notices/NoticeSheet';
import EditorToolbar from './notices/EditorToolbar';
import useFitToPage from './notices/useFitToPage';
import { formatDateIL } from '../utils/ledger';
import {
  liveTemplates, addTemplate, updateTemplateContent, patchTemplate, restoreVersion, uniqueName,
  renderNotice, serializeEditor, fieldNames, fieldType, FIELD_TYPE_LABELS, RECYCLE_DAYS
} from '../utils/notices';
import { F, A } from '../data/noticeTemplates';

export default function NoticeLibrarySettings() {
  const { noticeLibrary: lib, updateNoticeLibrary } = useApp();
  const [open, setOpen] = useState(() => new Set(lib.categories.map(c => c.id)));
  const [newCat, setNewCat] = useState('');
  const [renameCat, setRenameCat] = useState(null);
  const [tplMeta, setTplMeta] = useState(null); // { id, name, categoryId }
  const [editing, setEditing] = useState(null); // תבנית בעריכת תוכן (או חדשה)
  const [toDelete, setToDelete] = useState(null);
  const [versionsOf, setVersionsOf] = useState(null);
  const [showBin, setShowBin] = useState(false);

  const cats = [...lib.categories].sort((a, b) => a.order - b.order);
  const live = liveTemplates(lib);
  const bin = lib.templates.filter(t => t.deletedAt);

  const moveCat = (id, dir) => updateNoticeLibrary(l => {
    const list = [...l.categories].sort((a, b) => a.order - b.order);
    const i = list.findIndex(c => c.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return l;
    [list[i], list[j]] = [list[j], list[i]];
    return { ...l, categories: list.map((c, k) => ({ ...c, order: k })) };
  });

  const moveTpl = (t, dir) => updateNoticeLibrary(l => {
    const list = liveTemplates(l).filter(x => x.categoryId === t.categoryId).sort((a, b) => a.order - b.order);
    const i = list.findIndex(x => x.id === t.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return l;
    const a = list[i], b = list[j];
    return { ...l, templates: l.templates.map(x => (x.id === a.id ? { ...x, order: b.order } : x.id === b.id ? { ...x, order: a.order } : x)) };
  });

  const addCategory = (e) => {
    e.preventDefault();
    const name = newCat.trim();
    if (!name || lib.categories.some(c => c.name === name)) return;
    const id = `cat-${Date.now()}`;
    updateNoticeLibrary(l => ({ ...l, categories: [...l.categories, { id, name, order: l.categories.length }] }));
    setOpen(prev => new Set([...prev, id]));
    setNewCat('');
  };

  const duplicate = (t) => updateNoticeLibrary(l => addTemplate(l, { ...t, name: uniqueName(l, t.categoryId, `${t.name} – עותק`) }).lib);

  return (
    <div className="stack" style={{ gap: 18, maxWidth: 900 }}>
      <div className="card stack" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
          <span className="kpi-icon"><FileText size={18} /></span>
          <div>
            <h3 className="section-title">תבניות מודעות</h3>
            <p className="section-sub">הספרייה שממנה בוחרים במסך "מודעות ומכתבים". כאן עורכים את נוסח התבניות, משנים שם וקטגוריה, ומוחקים. מודעה חדשה אפשר לשמור כתבנית גם ממסך המודעות.</p>
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <form onSubmit={addCategory} className="row" style={{ gap: 6, flexWrap: 'nowrap', flex: 1 }}>
            <input type="text" className="input" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="קטגוריה חדשה, למשל: הדברה" aria-label="קטגוריה חדשה" />
            <button type="submit" className="btn btn-secondary" disabled={!newCat.trim()}><FolderPlus size={16} /> הוספת קטגוריה</button>
          </form>
          <button type="button" className="btn btn-primary" onClick={() => setEditing({ id: null, name: '', categoryId: cats[0]?.id, title: '', body: '<p><b><u>לתושבי הבניין <span data-auto="שם_בניין"></span></u></b></p><p>שלום רב,</p><p><br></p>' })}>
            <Plus size={16} /> תבנית חדשה
          </button>
        </div>
      </div>

      {cats.map((c, ci) => {
        const list = live.filter(t => t.categoryId === c.id).sort((a, b) => a.order - b.order);
        const isOpen = open.has(c.id);
        return (
          <div key={c.id} className="card stack" style={{ gap: 8 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="tpl-cat" onClick={() => setOpen(prev => { const n = new Set(prev); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })}>
                {isOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />} {c.name} <span className="muted">({list.length})</span>
              </button>
              <div className="row" style={{ gap: 4 }}>
                <button type="button" className="btn btn-ghost btn-sm btn-icon" title="למעלה" disabled={ci === 0} onClick={() => moveCat(c.id, -1)}><ArrowUp size={14} /></button>
                <button type="button" className="btn btn-ghost btn-sm btn-icon" title="למטה" disabled={ci === cats.length - 1} onClick={() => moveCat(c.id, 1)}><ArrowDown size={14} /></button>
                <button type="button" className="btn btn-secondary btn-sm btn-icon" title="שינוי שם" onClick={() => setRenameCat({ id: c.id, name: c.name })}><Pencil size={14} /></button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm btn-icon"
                  title={list.length ? 'אפשר למחוק רק קטגוריה ריקה. העבירו קודם את התבניות.' : 'מחיקת הקטגוריה'}
                  disabled={list.length > 0}
                  onClick={() => setToDelete({ kind: 'category', item: c })}
                ><Trash2 size={14} /></button>
              </div>
            </div>
            {isOpen && (list.length === 0 ? <span className="tpl-empty">אין עדיין תבניות בקטגוריה הזו.</span> : list.map((t, ti) => (
              <div key={t.id} className="preset-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cell-strong">{t.name}</div>
                  <div className="muted" style={{ fontSize: '0.84rem' }}>
                    {fieldNames(t.title, t.body).length} שדות לעריכה
                    {t.updatedAt ? ` · עודכנה ${formatDateIL(t.updatedAt.slice(0, 10))}` : ''}
                    {t.versions?.length ? ` · ${t.versions.length === 1 ? 'גרסה קודמת אחת' : `${t.versions.length} גרסאות קודמות`}` : ''}
                  </div>
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon" title="למעלה" disabled={ti === 0} onClick={() => moveTpl(t, -1)}><ArrowUp size={14} /></button>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon" title="למטה" disabled={ti === list.length - 1} onClick={() => moveTpl(t, 1)}><ArrowDown size={14} /></button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing(t)}><Pencil size={14} /> עריכת נוסח</button>
                  <button type="button" className="btn btn-secondary btn-sm btn-icon" title="שם וקטגוריה" onClick={() => setTplMeta({ id: t.id, name: t.name, categoryId: t.categoryId })}><FileText size={14} /></button>
                  <button type="button" className="btn btn-secondary btn-sm btn-icon" title="שכפול" onClick={() => duplicate(t)}><Copy size={14} /></button>
                  {t.versions?.length > 0 && <button type="button" className="btn btn-secondary btn-sm btn-icon" title="גרסאות קודמות" onClick={() => setVersionsOf(t)}><History size={14} /></button>}
                  <button type="button" className="btn btn-danger btn-sm btn-icon" title="מחיקה" onClick={() => setToDelete({ kind: 'template', item: t })}><Trash2 size={14} /></button>
                </div>
              </div>
            )))}
          </div>
        );
      })}

      {bin.length > 0 && (
        <div className="card stack" style={{ gap: 8 }}>
          <button type="button" className="tpl-cat" onClick={() => setShowBin(s => !s)}>
            {showBin ? <ChevronDown size={16} /> : <ChevronLeft size={16} />} סל מחזור <span className="muted">({bin.length} · נמחקות לצמיתות אחרי {RECYCLE_DAYS} יום)</span>
          </button>
          {showBin && bin.map(t => (
            <div key={t.id} className="preset-row">
              <div style={{ flex: 1 }}>
                <div className="cell-strong">{t.name}</div>
                <div className="muted" style={{ fontSize: '0.84rem' }}>נמחקה {formatDateIL(t.deletedAt.slice(0, 10))}</div>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateNoticeLibrary(l => patchTemplate(l, t.id, {
                deletedAt: null,
                categoryId: l.categories.some(c => c.id === t.categoryId) ? t.categoryId : l.categories[0]?.id
              }))}><RotateCcw size={14} /> שחזור</button>
            </div>
          ))}
        </div>
      )}

      {/* שינוי שם קטגוריה */}
      <Modal isOpen={!!renameCat} onClose={() => setRenameCat(null)} size="sm" title="שינוי שם קטגוריה">
        {renameCat && (
          <form className="form-stack" onSubmit={(e) => { e.preventDefault(); if (!renameCat.name.trim()) return; updateNoticeLibrary(l => ({ ...l, categories: l.categories.map(c => (c.id === renameCat.id ? { ...c, name: renameCat.name.trim() } : c)) })); setRenameCat(null); }}>
            <Field label="שם"><input type="text" autoFocus className="input" value={renameCat.name} onChange={(e) => setRenameCat({ ...renameCat, name: e.target.value })} /></Field>
            <div className="modal-actions"><button type="submit" className="btn btn-primary">שמירה</button><button type="button" className="btn btn-secondary" onClick={() => setRenameCat(null)}>ביטול</button></div>
          </form>
        )}
      </Modal>

      {/* שם וקטגוריה של תבנית */}
      <Modal isOpen={!!tplMeta} onClose={() => setTplMeta(null)} size="sm" title="שם וקטגוריה">
        {tplMeta && (
          <form className="form-stack" onSubmit={(e) => {
            e.preventDefault();
            if (!tplMeta.name.trim()) return;
            updateNoticeLibrary(l => patchTemplate(l, tplMeta.id, { name: uniqueName(l, tplMeta.categoryId, tplMeta.name.trim(), tplMeta.id), categoryId: tplMeta.categoryId }));
            setTplMeta(null);
          }}>
            <Field label="שם התבנית"><input type="text" autoFocus className="input" value={tplMeta.name} onChange={(e) => setTplMeta({ ...tplMeta, name: e.target.value })} /></Field>
            <Field label="קטגוריה">
              <select className="select" value={tplMeta.categoryId} onChange={(e) => setTplMeta({ ...tplMeta, categoryId: e.target.value })}>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div className="modal-actions"><button type="submit" className="btn btn-primary">שמירה</button><button type="button" className="btn btn-secondary" onClick={() => setTplMeta(null)}>ביטול</button></div>
          </form>
        )}
      </Modal>

      {/* גרסאות קודמות */}
      <Modal isOpen={!!versionsOf} onClose={() => setVersionsOf(null)} title={versionsOf ? `גרסאות קודמות · ${versionsOf.name}` : ''} subtitle="שחזור גרסה מחליף את הנוסח הנוכחי. הנוסח הנוכחי יישמר בעצמו כגרסה.">
        {versionsOf && (
          <div className="stack" style={{ gap: 8 }}>
            {versionsOf.versions.map((v, i) => (
              <div key={i} className="preset-row">
                <div style={{ flex: 1 }}>
                  <div className="cell-strong">{v.title ? v.title.replace(/<[^>]+>/g, '') : 'ללא כותרת'}</div>
                  <div className="muted" style={{ fontSize: '0.84rem' }}>נשמרה {formatDateIL((v.savedAt || '').slice(0, 10))}</div>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { updateNoticeLibrary(l => restoreVersion(l, versionsOf.id, i)); setVersionsOf(null); }}><RotateCcw size={14} /> שחזור</button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete.kind === 'category') updateNoticeLibrary(l => ({ ...l, categories: l.categories.filter(c => c.id !== toDelete.item.id) }));
          else updateNoticeLibrary(l => patchTemplate(l, toDelete.item.id, { deletedAt: new Date().toISOString() }));
          setToDelete(null);
        }}
        title={toDelete?.kind === 'category' ? 'מחיקת קטגוריה' : 'מחיקת תבנית'}
        question={`למחוק את "${toDelete?.item.name || ''}"?`}
        subDescription={toDelete?.kind === 'template' ? `התבנית תעבור לסל המחזור, ואפשר יהיה לשחזר אותה במשך ${RECYCLE_DAYS} יום.` : 'הקטגוריה ריקה ותימחק.'}
        confirmText="מחיקה"
      />

      {editing && (
        <TemplateEditor
          template={editing}
          categories={cats}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing.id) updateNoticeLibrary(l => updateTemplateContent(l, editing.id, data));
            else updateNoticeLibrary(l => addTemplate(l, { ...data, name: uniqueName(l, data.categoryId, data.name) }).lib);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

// מחולל התבניות (סעיף 8.4): עריכת הנוסח על הדף, הפיכת טקסט מסומן לשדה, הוספת שדה אוטומטי
function TemplateEditor({ template, categories, onClose, onSave }) {
  const { systemSettings } = useApp();
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const { contentRef, fit } = useFitToPage();
  const [name, setName] = useState(template.name || '');
  const [categoryId, setCategoryId] = useState(template.categoryId || categories[0]?.id);
  const [fields, setFields] = useState(() => fieldNames(template.title, template.body));
  const [makeField, setMakeField] = useState(null); // { range, text, name }
  const initialized = useRef(false);

  const init = (el, html) => {
    if (!el || el.dataset.ready) return;
    el.innerHTML = renderNotice(html, { settings: systemSettings, mode: 'edit' });
    el.dataset.ready = '1';
    if (!initialized.current) { initialized.current = true; requestAnimationFrame(fit); }
  };
  const refresh = () => { setFields(fieldNames(titleRef.current?.innerHTML, bodyRef.current?.innerHTML)); fit(); };

  const insertChip = (html, range) => {
    bodyRef.current?.focus();
    if (range) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
    document.execCommand('insertHTML', false, renderNotice(html, { settings: systemSettings, mode: 'edit' }) + '&nbsp;');
    refresh();
  };

  const save = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      categoryId,
      title: serializeEditor(titleRef.current.innerHTML),
      body: serializeEditor(bodyRef.current.innerHTML)
    });
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" title={template.id ? `עריכת תבנית · ${template.name}` : 'תבנית חדשה'} subtitle="עורכים ישירות על הדף. שדות צהובים ימולאו בכל שימוש; שדות כחולים ממולאים אוטומטית.">
      <div className="stack" style={{ gap: 10 }}>
        <div className="field-row">
          <Field label="שם התבנית *"><input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: הדברה בבניין" /></Field>
          {!template.id && (
            <Field label="קטגוריה">
              <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}
        </div>
        <EditorToolbar
          editorRef={bodyRef}
          onChange={refresh}
          templateMode
          onMakeField={(range) => {
            const text = range ? range.toString().trim() : '';
            setMakeField({ range, text, name: '' });
          }}
          onInsertAuto={(n) => insertChip(A(n))}
        />
        {fields.length > 0 && (
          <div className="row" style={{ gap: 6 }}>
            <span className="muted" style={{ fontSize: '0.85rem' }}>שדות לעריכה:</span>
            {fields.map(f => <span key={f} className="badge badge-warning">{f} · {FIELD_TYPE_LABELS[fieldType(f)]}</span>)}
          </div>
        )}
        <div className="sheet-scroller template-editor-sheet">
          <NoticeSheet settings={systemSettings} dateText="[תאריך]" contentRef={contentRef} className="is-editing">
            <h1 className="ns-title" ref={(el) => { titleRef.current = el; init(el, template.title); }} contentEditable suppressContentEditableWarning data-placeholder="כותרת המודעה" onInput={refresh} />
            <div className="ns-body" ref={(el) => { bodyRef.current = el; init(el, template.body); }} contentEditable suppressContentEditableWarning onInput={refresh} />
          </NoticeSheet>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" disabled={!name.trim()} onClick={save}>{template.id ? 'שמירת הנוסח' : 'יצירת התבנית'}</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>ביטול</button>
        </div>
        {template.id && <p className="muted" style={{ fontSize: '0.84rem', margin: 0 }}>הנוסח הקודם יישמר בהיסטוריית הגרסאות (5 אחרונות).</p>}
      </div>

      {/* הפוך לשדה: הטקסט שסומן הופך לשדה לעריכה */}
      <Modal isOpen={!!makeField} onClose={() => setMakeField(null)} size="sm" title="שדה לעריכה" subtitle={makeField?.text ? `הטקסט "${makeField.text}" יוחלף בשדה.` : 'השדה ייכנס במקום הסמן.'}>
        {makeField && (
          <form className="form-stack" onSubmit={(e) => {
            e.preventDefault();
            const n = makeField.name.trim();
            if (!n) return;
            const r = makeField.range;
            setMakeField(null);
            requestAnimationFrame(() => insertChip(F(n), r));
          }}>
            <Field label="שם השדה" hint="המילה הראשונה קובעת את הסוג: תאריך… → לוח שנה, שעה… → שעה, סכום… / עלות… → סכום. אחרת: טקסט.">
              <input type="text" autoFocus className="input" value={makeField.name} onChange={(e) => setMakeField({ ...makeField, name: e.target.value })} placeholder="למשל: תאריך הפינוי" />
            </Field>
            {makeField.name.trim() && <span className="badge badge-warning" style={{ alignSelf: 'flex-start' }}>סוג: {FIELD_TYPE_LABELS[fieldType(makeField.name)]}</span>}
            <div className="modal-actions"><button type="submit" className="btn btn-primary">הוספת השדה</button><button type="button" className="btn btn-secondary" onClick={() => setMakeField(null)}>ביטול</button></div>
          </form>
        )}
      </Modal>
    </Modal>
  );
}

