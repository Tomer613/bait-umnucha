// ==========================================================================
// בית ומנוחה - יצירת מודעות ומכתבים (אפיון 03)
// בוחרים תבנית → היא נטענת לדף A4 → ממלאים את השדות הצהובים → עורכים ישירות על הדף.
// מצב "תצוגה מקדימה" מציג את הדף בדיוק כמו בהדפסה. הפקה: הדפסה / PDF, מייל, ווצאפ.
// ==========================================================================
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Search, Star, FileText, Printer, Send, MessageCircle, Save, Eye, PenLine, ChevronDown, ChevronLeft, History, Plus, AlertTriangle, Building2, Settings2 } from 'lucide-react';
import { Modal, Field, Segmented, BuildingName, FlashMessage, useFlash } from './ui';
import NoticeSheet from './notices/NoticeSheet';
import EditorToolbar from './notices/EditorToolbar';
import useFitToPage from './notices/useFitToPage';
import { formatFormattedDate } from '../utils/hebrewDate';
import { formatDateIL } from '../utils/ledger';
import { addMonths } from '../utils/levies';
import { unitLabel, unitDisplayName } from '../utils/units';
import {
  renderNotice, serializeEditor, fieldNames, fieldType, formatFieldValue, autoValues, contextNeeds, htmlToText,
  liveTemplates, addTemplate, updateTemplateContent, touchRecent, patchTemplate, uniqueName, FIELD_TYPE_LABELS, AUTO_BY_NAME
} from '../utils/notices';
import { LEGACY_TEMPLATE_IDS } from '../data/noticeTemplates';

const BLANK = { id: null, name: 'מודעה ריקה', title: '', body: '<p><b><u>לתושבי הבניין <span data-auto="שם_בניין"></span></u></b></p><p>שלום רב,</p><p><br></p>' };
const CHANNEL_LABEL = { print: 'הדפסה', email: 'מייל', whatsapp: 'ווצאפ' };

export default function NoticesView() {
  const { currentBuilding, buildings, systemSettings, currentMonth, noticeLibrary, updateNoticeLibrary, logNotice, letterPreset, setLetterPreset, setActiveTab } = useApp();
  const [flash, showFlash] = useFlash();
  const lib = noticeLibrary;
  const templates = liveTemplates(lib);

  // הקשר שהגיע ממסך אחר (למשל משימת "חוב מתמשך")
  const [preset] = useState(() => {
    if (!letterPreset) return null;
    return typeof letterPreset === 'string' ? { templateId: LEGACY_TEMPLATE_IDS[letterPreset] || letterPreset } : letterPreset;
  });
  useEffect(() => { if (letterPreset) setLetterPreset(null); }, [letterPreset, setLetterPreset]);

  const [templateId, setTemplateId] = useState(() => preset?.templateId || templates[0]?.id || null);
  const template = templateId ? templates.find(t => t.id === templateId) || BLANK : BLANK;
  const [values, setValues] = useState({});
  const [buildingIds, setBuildingIds] = useState(() => [preset?.buildingId || currentBuilding?.id].filter(Boolean));
  const [apartmentId, setApartmentId] = useState(preset?.apartmentId || '');
  const [period, setPeriod] = useState({ from: addMonths(currentMonth, -5), to: currentMonth });
  const [mode, setMode] = useState('edit');
  const [dirty, setDirty] = useState(false);
  const [presentFields, setPresentFields] = useState([]);
  const [search, setSearch] = useState('');
  const [openCats, setOpenCats] = useState(() => new Set([templates.find(t => t.id === templateId)?.categoryId].filter(Boolean)));
  const [confirmSwitch, setConfirmSwitch] = useState(null);
  const [warnUnfilled, setWarnUnfilled] = useState(null);
  const [saveAs, setSaveAs] = useState(null);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [pickBuildings, setPickBuildings] = useState(false);
  const [printJob, setPrintJob] = useState(null);
  const [previewHtml, setPreviewHtml] = useState({ title: '', body: '' });

  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const { contentRef, fit, overflow } = useFitToPage();

  const primary = buildings.find(b => b.id === buildingIds[0]) || null;
  const apartment = (primary?.apartments || []).find(a => a.id === apartmentId) || null;
  const needs = contextNeeds(template.title, template.body);
  const needsPeriod = needs.has('period');
  const auto = primary ? autoValues({ building: primary, apartment, settings: systemSettings, period: needsPeriod ? period : null }) : {};
  const autoKey = JSON.stringify(auto); // מפתח יציב: משתנה רק כשהערכים עצמם משתנים
  const [today] = useState(() => new Date());
  const dateText = formatFormattedDate(today, systemSettings.hebrewDateFormat || 'both');

  // ---------------------------------------------------------------- טעינת תבנית לעורך
  const syncFields = useCallback(() => {
    const names = fieldNames(titleRef.current?.innerHTML || '', bodyRef.current?.innerHTML || '');
    setPresentFields(names);
  }, []);

  // ערכים אוטומטיים לפי מה שהתבנית צריכה (דירה / תקופה)
  const autoFor = (tpl) => (primary
    ? autoValues({ building: primary, apartment, settings: systemSettings, period: contextNeeds(tpl.title, tpl.body).has('period') ? period : null })
    : {});

  const loadTemplate = (tpl) => {
    if (!titleRef.current || !bodyRef.current) return;
    const a = autoFor(tpl);
    titleRef.current.innerHTML = renderNotice(tpl.title, { auto: a, settings: systemSettings, mode: 'edit' });
    bodyRef.current.innerHTML = renderNotice(tpl.body, { auto: a, settings: systemSettings, mode: 'edit' });
    setValues({});
    setDirty(false);
    syncFields();
    requestAnimationFrame(fit);
  };

  // טעינה ראשונה
  const loaded = useRef(false);
  useLayoutEffect(() => {
    if (loaded.current || mode !== 'edit') return;
    loaded.current = true;
    loadTemplate(template);
  });

  // שדות אוטומטיים מתעדכנים כשמשנים בניין / דירה / תקופה
  useEffect(() => {
    [titleRef.current, bodyRef.current].forEach(root => root?.querySelectorAll('[data-auto]').forEach(el => {
      const name = el.getAttribute('data-auto');
      const v = auto[name];
      if (el.classList.contains('na-block')) el.innerHTML = v || '';
      else { el.textContent = v || `[${AUTO_BY_NAME[name]?.label || name}]`; el.classList.toggle('na-missing', !v); }
    }));
    requestAnimationFrame(fit);
  }, [autoKey, fit]); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = (name, raw) => {
    setValues(prev => ({ ...prev, [name]: raw }));
    const shown = formatFieldValue(name, raw, systemSettings);
    [titleRef.current, bodyRef.current].forEach(root => root?.querySelectorAll(`[data-field="${CSS.escape(name)}"]`).forEach(el => {
      el.textContent = shown || `‹${name}›`;
      el.classList.toggle('is-filled', !!shown);
    }));
    setDirty(true);
    requestAnimationFrame(fit);
  };

  const onEditorInput = () => {
    setDirty(true);
    syncFields();
    fit();
  };

  // לחיצה על שדה צהוב בדף → מעבר לתיבה שלו בפאנל
  const onEditorClick = (e) => {
    const chip = e.target.closest?.('[data-field]');
    if (!chip) return;
    const idx = presentFields.indexOf(chip.getAttribute('data-field'));
    document.getElementById(`nf-input-${idx}`)?.focus();
  };

  const chooseTemplate = (id) => {
    if (dirty) { setConfirmSwitch(id); return; }
    applyTemplate(id);
  };
  const applyTemplate = (id) => {
    const tpl = id ? templates.find(t => t.id === id) : BLANK;
    setTemplateId(id);
    setMode('edit');
    if (id) updateNoticeLibrary(l => touchRecent(l, id));
    requestAnimationFrame(() => loadTemplate(tpl || BLANK));
  };

  // ---------------------------------------------------------------- מצב תצוגה מקדימה
  const currentSource = () => ({
    title: serializeEditor(titleRef.current?.innerHTML || ''),
    body: serializeEditor(bodyRef.current?.innerHTML || '')
  });
  const [source, setSource] = useState(null); // המקור בזמן תצוגה מקדימה (העורך לא מוצג)
  const goPreview = () => {
    const src = currentSource();
    setSource(src);
    setPreviewHtml({
      title: renderNotice(src.title, { values, auto, settings: systemSettings, mode: 'print' }),
      body: renderNotice(src.body, { values, auto, settings: systemSettings, mode: 'print' })
    });
    setMode('preview');
  };
  const goEdit = () => {
    setMode('edit');
    requestAnimationFrame(() => {
      if (!source) return;
      titleRef.current.innerHTML = renderNotice(source.title, { values, auto, settings: systemSettings, mode: 'edit' });
      bodyRef.current.innerHTML = renderNotice(source.body, { values, auto, settings: systemSettings, mode: 'edit' });
      syncFields();
      fit();
    });
  };
  useLayoutEffect(() => { if (mode === 'preview') fit(); }, [mode, previewHtml, fit]);

  const unfilled = presentFields.filter(n => !String(values[n] || '').trim());

  // ---------------------------------------------------------------- הפקה
  const src = () => (mode === 'preview' && source ? source : currentSource());
  const renderFor = (b, s) => {
    const a = b ? autoValues({ building: b, apartment: b.id === primary?.id ? apartment : null, settings: systemSettings, period: needs.has('period') ? period : null }) : {};
    return {
      title: renderNotice(s.title, { values, auto: a, settings: systemSettings, mode: 'print' }),
      body: renderNotice(s.body, { values, auto: a, settings: systemSettings, mode: 'print' })
    };
  };

  const guard = (action) => {
    if (unfilled.length) setWarnUnfilled(() => action); // פונקציה נשמרת כערך, לא מורצת
    else action();
  };

  const doPrint = () => {
    const s = src();
    const targets = buildingIds.length ? buildingIds.map(id => buildings.find(b => b.id === id)).filter(Boolean) : [null];
    setPrintJob(targets.map(b => ({ key: b?.id || 'none', building: b, ...renderFor(b, s) })));
    logNotice(buildingIds, { templateId, title: htmlToText(renderFor(primary, s).title), html: renderFor(primary, s).body, channel: 'print' });
  };
  useEffect(() => {
    if (!printJob) return;
    document.body.classList.add('print-notice');
    const t = setTimeout(() => {
      window.print();
      document.body.classList.remove('print-notice');
      setPrintJob(null);
    }, 150);
    return () => clearTimeout(t);
  }, [printJob]);

  const emails = buildingIds.flatMap(id => (buildings.find(b => b.id === id)?.apartments || []).map(a => a.email).filter(e => e && e.includes('@')));
  const doMail = () => {
    const r = renderFor(primary, src());
    const subject = htmlToText(r.title);
    const body = htmlToText(r.body);
    logNotice(buildingIds, { templateId, title: subject, html: r.body, channel: 'email' });
    window.location.assign(`mailto:?bcc=${encodeURIComponent(emails.join(','))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };
  const doWhatsapp = async () => {
    const r = renderFor(primary, src());
    const text = `*${htmlToText(r.title)}*\n\n${htmlToText(r.body, { whatsapp: true })}`;
    try { await navigator.clipboard.writeText(text); } catch { /* העתקה אינה חובה */ }
    logNotice(buildingIds, { templateId, title: htmlToText(r.title), html: r.body, channel: 'whatsapp' });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    showFlash('הטקסט הועתק ונפתח בווצאפ.');
  };

  // ---------------------------------------------------------------- שמירה כתבנית
  const doSaveAs = (e) => {
    e.preventDefault();
    const s = mode === 'preview' && source ? source : null;
    const keepValues = saveAs.keepValues;
    const rawTitle = s ? s.title : titleRef.current.innerHTML;
    const rawBody = s ? s.body : bodyRef.current.innerHTML;
    // בתצוגה מקדימה המקור כבר נקי משדות מוצגים; ממלאים ערכים קבועים אם נבחר
    const toTemplate = (html) => (s
      ? (keepValues ? serializeEditor(renderNotice(html, { values, auto, settings: systemSettings, mode: 'edit' }), { keepValues: true }) : html)
      : serializeEditor(html, { keepValues }));
    const name = uniqueName(lib, saveAs.categoryId, saveAs.name.trim());
    let newId = null;
    updateNoticeLibrary(l => {
      const r = addTemplate(l, { categoryId: saveAs.categoryId, name, title: toTemplate(rawTitle), body: toTemplate(rawBody), addressee: template.addressee });
      newId = r.id;
      return r.lib;
    });
    setSaveAs(null);
    setDirty(false);
    requestAnimationFrame(() => { if (newId) setTemplateId(newId); });
    showFlash(`נשמרה תבנית חדשה: "${name}".`);
  };

  const doUpdate = () => {
    const s = mode === 'preview' && source ? source : currentSource();
    updateNoticeLibrary(l => updateTemplateContent(l, template.id, s));
    setConfirmUpdate(false);
    setDirty(false);
    showFlash(`התבנית "${template.name}" עודכנה. הגרסה הקודמת נשמרה בהיסטוריה.`);
  };

  // ---------------------------------------------------------------- ספרייה
  const q = search.trim();
  const matches = (t) => !q || t.name.includes(q) || htmlToText(t.body).includes(q) || htmlToText(t.title).includes(q);
  const favorites = templates.filter(t => t.isFavorite && matches(t));
  const recent = (lib.recent || []).map(id => templates.find(t => t.id === id)).filter(Boolean).filter(matches).slice(0, 3);
  const log = (primary?.noticeLog || []).slice(0, 6);

  const toggleCat = (id) => setOpenCats(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const tplRow = (t) => (
    <div key={t.id} className={`tpl-row${t.id === templateId ? ' is-active' : ''}`}>
      <button type="button" className="tpl-name" onClick={() => chooseTemplate(t.id)}>{t.name}</button>
      <button type="button" className={`tpl-star${t.isFavorite ? ' is-on' : ''}`} title={t.isFavorite ? 'הסרה מהמועדפים' : 'הוספה למועדפים'} onClick={() => updateNoticeLibrary(l => patchTemplate(l, t.id, { isFavorite: !t.isFavorite }))}><Star size={14} /></button>
    </div>
  );

  return (
    <div className="notices-split">
      <FlashMessage flash={flash} />

      {/* פאנל צד */}
      <aside className="notices-side no-print">
        <section className="card ns-panel">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 className="section-title">תבנית</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActiveTab('settings', 'notices')}><Settings2 size={14} /> ניהול תבניות</button>
          </div>
          <div className="search-box" style={{ maxWidth: 'none' }}>
            <Search size={16} />
            <input type="text" className="input input-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש בשם או בתוכן..." />
          </div>
          <div className="tpl-tree">
            <button type="button" className={`tpl-row tpl-blank${!templateId ? ' is-active' : ''}`} onClick={() => chooseTemplate(null)}><Plus size={14} /> מודעה ריקה</button>
            {favorites.length > 0 && <div className="tpl-group"><span className="tpl-group-title"><Star size={13} /> מועדפים</span>{favorites.map(tplRow)}</div>}
            {!q && recent.length > 0 && <div className="tpl-group"><span className="tpl-group-title"><History size={13} /> אחרונים</span>{recent.map(tplRow)}</div>}
            {[...lib.categories].sort((a, b) => a.order - b.order).map(c => {
              const list = templates.filter(t => t.categoryId === c.id && matches(t)).sort((a, b) => a.order - b.order);
              if (q && !list.length) return null;
              const open = q || openCats.has(c.id);
              return (
                <div key={c.id} className="tpl-group">
                  <button type="button" className="tpl-cat" onClick={() => toggleCat(c.id)}>
                    {open ? <ChevronDown size={14} /> : <ChevronLeft size={14} />} {c.name} <span className="muted">({list.length})</span>
                  </button>
                  {open && (list.length ? list.map(tplRow) : <span className="tpl-empty">אין עדיין תבניות</span>)}
                </div>
              );
            })}
          </div>
        </section>

        {presentFields.length > 0 && (
          <section className="card ns-panel">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 className="section-title">שדות למילוי</h3>
              {unfilled.length > 0
                ? <span className="badge badge-warning">נותרו {unfilled.length}</span>
                : <span className="badge badge-success">הכול מולא</span>}
            </div>
            {presentFields.map((name, i) => {
              const type = fieldType(name);
              return (
                <Field key={name} label={name} hint={type !== 'text' ? FIELD_TYPE_LABELS[type] : undefined}>
                  <input
                    id={`nf-input-${i}`}
                    className={`input input-sm${values[name] ? '' : ' is-empty-field'}`}
                    type={type === 'date' ? 'date' : type === 'time' ? 'time' : type === 'amount' ? 'number' : 'text'}
                    value={values[name] || ''}
                    onChange={(e) => setValue(name, e.target.value)}
                  />
                </Field>
              );
            })}
          </section>
        )}

        <section className="card ns-panel">
          <h3 className="section-title">למי</h3>
          <div className="row" style={{ gap: 6 }}>
            {buildingIds.map(id => { const b = buildings.find(x => x.id === id); return b ? <BuildingName key={id} name={b.name} color={b.color} /> : null; })}
            {!buildingIds.length && <span className="muted">לא נבחר בניין</span>}
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPickBuildings(true)}><Building2 size={14} /> בחירת בניינים</button>
          {needs.has('apartment') && primary && (
            <Field label="דירה (לשדות החוב)">
              <select className="select input-sm" value={apartmentId} onChange={(e) => setApartmentId(e.target.value)}>
                <option value="">— בחרו דירה —</option>
                {(primary.apartments || []).map(a => <option key={a.id} value={a.id}>{unitLabel(a)} · {unitDisplayName(a)}{a.debtMonths?.length ? ` · ${a.debtMonths.length} חודשי חוב` : ''}</option>)}
              </select>
            </Field>
          )}
          {needs.has('period') && (
            <div className="field-row">
              <Field label="מחודש"><input type="month" className="input input-sm" value={period.from} onChange={(e) => setPeriod(p => ({ ...p, from: e.target.value }))} /></Field>
              <Field label="עד חודש"><input type="month" className="input input-sm" value={period.to} onChange={(e) => setPeriod(p => ({ ...p, to: e.target.value }))} /></Field>
            </div>
          )}
        </section>

        {log.length > 0 && (
          <section className="card ns-panel">
            <h3 className="section-title">מודעות אחרונות · {primary?.name}</h3>
            {log.map(l => (
              <button key={l.id} type="button" className="log-row" title="פתיחה מחדש" onClick={() => {
                const reopen = () => {
                  setTemplateId(l.templateId || null);
                  setMode('edit');
                  requestAnimationFrame(() => { titleRef.current.innerHTML = l.title || ''; bodyRef.current.innerHTML = l.html || ''; setValues({}); syncFields(); fit(); });
                };
                if (dirty) setConfirmSwitch({ reopen }); else reopen();
              }}>
                <span>{l.title || 'ללא כותרת'}</span>
                <span className="muted">{formatDateIL(l.at.slice(0, 10))} · {CHANNEL_LABEL[l.channel] || l.channel}</span>
              </button>
            ))}
          </section>
        )}
      </aside>

      {/* הדף */}
      <main className="notices-main">
        <div className="notices-bar no-print">
          <Segmented
            value={mode}
            onChange={(m) => (m === 'preview' ? goPreview() : goEdit())}
            options={[{ id: 'edit', label: <><PenLine size={14} /> עריכה</> }, { id: 'preview', label: <><Eye size={14} /> תצוגה מקדימה</> }]}
          />
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => guard(doPrint)}><Printer size={15} /> הדפסה / PDF{buildingIds.length > 1 ? ` (${buildingIds.length} בניינים)` : ''}</button>
            <button type="button" className="btn btn-secondary btn-sm" disabled={!emails.length} title={emails.length ? `${emails.length} נמענים בעותק מוסתר` : 'אין כתובות מייל לדיירים בבניינים שנבחרו'} onClick={() => guard(doMail)}><Send size={15} /> מייל</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => guard(doWhatsapp)}><MessageCircle size={15} /> ווצאפ</button>
            <SaveMenu
              canUpdate={!!template.id}
              templateName={template.name}
              onSaveAs={() => setSaveAs({ name: template.id ? `${template.name} – עותק` : '', categoryId: template.categoryId || lib.categories[0]?.id, keepValues: false })}
              onUpdate={() => setConfirmUpdate(true)}
            />
          </div>
        </div>

        {mode === 'edit' && <EditorToolbar editorRef={bodyRef} onChange={onEditorInput} />}

        <div className="sheet-scroller">
          <NoticeSheet settings={systemSettings} dateText={dateText} contentRef={contentRef} className={mode === 'edit' ? 'is-editing' : ''}>
            {mode === 'edit' ? (
              <>
                <h1 className="ns-title" ref={titleRef} contentEditable suppressContentEditableWarning data-placeholder="כותרת המודעה" onInput={onEditorInput} onClick={onEditorClick} />
                <div className="ns-body" ref={bodyRef} contentEditable suppressContentEditableWarning onInput={onEditorInput} onClick={onEditorClick} />
              </>
            ) : (
              <>
                <h1 className="ns-title" dangerouslySetInnerHTML={{ __html: previewHtml.title }} />
                <div className="ns-body" dangerouslySetInnerHTML={{ __html: previewHtml.body }} />
              </>
            )}
          </NoticeSheet>
        </div>
        {overflow && (
          <div className="alert alert-warning no-print"><AlertTriangle size={16} /> <span>הטקסט ארוך מדף אחד גם בגופן מוקטן. כדאי לקצר.</span></div>
        )}
      </main>

      {/* הדפסה: דף לכל בניין שנבחר */}
      {printJob && createPortal(
        <div className="notice-print-root">
          <style>{'@page { size: A4; margin: 0; }'}</style>
          {printJob.map(p => (
            <PrintSheet key={p.key} settings={systemSettings} dateText={dateText} title={p.title} body={p.body} />
          ))}
        </div>,
        document.body
      )}

      {/* אישורים */}
      <Modal isOpen={!!confirmSwitch} onClose={() => setConfirmSwitch(null)} size="sm" title="להחליף את המודעה?" subtitle="השינויים שעשית במודעה הנוכחית לא יישמרו.">
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={() => { const c = confirmSwitch; setConfirmSwitch(null); setDirty(false); if (c?.reopen) c.reopen(); else applyTemplate(c); }}>החלפה</button>
          <button type="button" className="btn btn-secondary" onClick={() => setConfirmSwitch(null)}>ביטול</button>
        </div>
      </Modal>

      <Modal isOpen={!!warnUnfilled} onClose={() => setWarnUnfilled(null)} size="sm" title={`נשארו ${unfilled.length} שדות שלא עודכנו`} subtitle={unfilled.join(' · ')}>
        <p className="muted" style={{ marginTop: 0 }}>בהדפסה, שדה ריק יופיע כקו למילוי בכתב יד.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => { setWarnUnfilled(null); document.getElementById(`nf-input-${presentFields.indexOf(unfilled[0])}`)?.focus(); }}>חזרה לעריכה</button>
          <button type="button" className="btn btn-primary" onClick={() => { const a = warnUnfilled; setWarnUnfilled(null); a(); }}>להמשיך בכל זאת</button>
        </div>
      </Modal>

      <Modal isOpen={!!saveAs} onClose={() => setSaveAs(null)} title="שמירה כתבנית חדשה" subtitle="התבנית המקורית לא תשתנה.">
        {saveAs && (
          <form onSubmit={doSaveAs} className="form-stack">
            <Field label="שם התבנית *"><input type="text" required autoFocus className="input" value={saveAs.name} onChange={(e) => setSaveAs({ ...saveAs, name: e.target.value })} /></Field>
            <Field label="קטגוריה">
              <select className="select" value={saveAs.categoryId} onChange={(e) => setSaveAs({ ...saveAs, categoryId: e.target.value })}>
                {lib.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            {Object.values(values).some(v => String(v || '').trim()) && (
              <div className="field">
                <span className="field-label">מה לעשות עם הערכים שמילאת?</span>
                <label className="check-chip"><input type="radio" name="kv" checked={!saveAs.keepValues} onChange={() => setSaveAs({ ...saveAs, keepValues: false })} /> להחזיר אותם לשדות לעריכה (מומלץ)</label>
                <label className="check-chip"><input type="radio" name="kv" checked={saveAs.keepValues} onChange={() => setSaveAs({ ...saveAs, keepValues: true })} /> לשמור אותם כטקסט קבוע</label>
              </div>
            )}
            <div className="modal-actions">
              <button type="submit" className="btn btn-primary">שמירה</button>
              <button type="button" className="btn btn-secondary" onClick={() => setSaveAs(null)}>ביטול</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={confirmUpdate} onClose={() => setConfirmUpdate(false)} size="sm" title={`לעדכן את התבנית "${template.name}"?`} subtitle="מעכשיו התבנית תיטען בנוסח הנוכחי. הנוסח הקודם יישמר בהיסטוריית הגרסאות.">
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={doUpdate}>עדכון התבנית</button>
          <button type="button" className="btn btn-secondary" onClick={() => setConfirmUpdate(false)}>ביטול</button>
        </div>
      </Modal>

      <Modal isOpen={pickBuildings} onClose={() => setPickBuildings(false)} title="בחירת בניינים" subtitle="בהדפסה ייצא דף נפרד לכל בניין, עם השם והכתובת שלו.">
        <div className="stack" style={{ gap: 10 }}>
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBuildingIds(buildings.map(b => b.id))}>כל הבניינים</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBuildingIds([])}>ניקוי</button>
          </div>
          <div className="unit-checklist" style={{ maxHeight: 360 }}>
            {buildings.map(b => (
              <label key={b.id} className="check-chip">
                <input type="checkbox" checked={buildingIds.includes(b.id)} onChange={(e) => setBuildingIds(prev => (e.target.checked ? [...prev, b.id] : prev.filter(x => x !== b.id)))} />
                {b.name}
              </label>
            ))}
          </div>
          <div className="modal-actions"><button type="button" className="btn btn-primary" onClick={() => setPickBuildings(false)}>סגירה</button></div>
        </div>
      </Modal>
    </div>
  );
}

function SaveMenu({ canUpdate, templateName, onSaveAs, onUpdate }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="tb-pop">
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(o => !o)}><Save size={15} /> שמירה <ChevronDown size={14} /></button>
      {open && (
        <span className="tb-popover tb-list save-menu" onMouseLeave={() => setOpen(false)}>
          <button type="button" onClick={() => { setOpen(false); onSaveAs(); }}><FileText size={14} /> שמירה כתבנית חדשה</button>
          {canUpdate && <button type="button" onClick={() => { setOpen(false); onUpdate(); }}><Save size={14} /> עדכון התבנית "{templateName}"</button>}
        </span>
      )}
    </span>
  );
}

// דף להדפסה: אותו נייר מכתבים, עם התאמה לדף אחד
function PrintSheet({ settings, dateText, title, body }) {
  const { contentRef, fit } = useFitToPage();
  useLayoutEffect(() => { fit(); }, [fit, title, body]);
  return (
    <NoticeSheet settings={settings} dateText={dateText} contentRef={contentRef} className="is-print">
      <h1 className="ns-title" dangerouslySetInnerHTML={{ __html: title }} />
      <div className="ns-body" dangerouslySetInnerHTML={{ __html: body }} />
    </NoticeSheet>
  );
}
