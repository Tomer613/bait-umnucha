// ==========================================================================
// בית ומנוחה - מחולל SQL לתוכן ההתחלתי ולנתוני הדמו (אפיון 13, נושא 10)
// מקור הנתונים: src/data (אותם קבצים שהאתר משתמש בהם היום).
//
// הרצה:  node supabase/scripts/build-seeds.mjs
// פלט:
//   supabase/migrations/20261017000014_starter_content.sql  - פונקציה seed_starter_content(org)
//   supabase/seeds/demo.sql                                  - איפוס ומילוי חברת הדמו בלבד
// ==========================================================================
import { writeFileSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INITIAL_BUILDINGS, EXPENSE_CATEGORIES, OTHER_CATEGORY } from '../../src/data/initialData.js';
import { NOTICE_CATEGORIES, NOTICE_TEMPLATES } from '../../src/data/noticeTemplates.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// --------------------------------------------------------------------------
// ערכי ברירת מחדל שמוגדרים היום בקוד (src/utils/importPlan.js, issues.js, paymentPlans.js, ledger.js)
// --------------------------------------------------------------------------
const DEFAULT_CATEGORY_RULES = [
  ['חשמל', 'חשבון חשמל'], ['שינדלר', 'ביטוח מעליות'], ['ישראליפט', 'ביטוח מעליות'], ['אוטיס', 'ביטוח מעליות'],
  ['מהנדס', 'מהנדס מעליות'], ['ניקיון', 'ניקיון'], ['נקיון', 'ניקיון'], ['ריח', 'מפיץ ריח'],
  ['עמלת', 'עמלות סליקה'], ['גינון', 'הוצאות גינון'], ['ניהול', 'דמי ניהול']
];
const HIYUVIT_DEPOSIT_NAMES = ['חיובית', 'אוקס פינטק'];
const ISSUE_CATEGORIES = ['מעלית', 'חשמל', 'אינסטלציה', 'ניקיון', 'כספים', 'אחר'];
const DEFAULT_EXPENSE_CATEGORY = 'תחזוקה שוטפת והוצאות חריגות';
// קטגוריות מערכת: קבועות, עם מפתח שהקוד מזהה אותן לפיו
const SYSTEM_CATEGORIES = [
  { direction: 'out', name: OTHER_CATEGORY, key: 'other' },
  { direction: 'out', name: 'העברה למנהל (החזר הוצאות)', key: 'manager_transfer' },
  { direction: 'out', name: 'החזר הוצאות למנהל (ללא פירוט)', key: 'manager_undetailed' },
  { direction: 'in', name: 'גבייה מחיובית', key: 'hiyuvit_income' },
  { direction: 'in', name: 'הכנסה / העברה ישירה', key: 'direct_income' },
  { direction: 'in', name: 'הסדר חוב', key: 'receivable' },
  { direction: 'in', name: 'הכנסות אחרות', key: 'other_income' }
];
const TEMPLATE_SYSTEM_KEYS = { 'tpl-dues-reminder': 'dues_reminder', 'tpl-debt-warning': 'debt_warning' };
// נוסחי הודעות חוב קצרות (אפיון 11, 4.5). שם החברה מגיע מההגדרות, לא מהקוד (אפיון 13, 1.1א)
const SHORT_MESSAGES = {
  soft: {
    subject: 'תזכורת: חוב דמי ועד',
    body: 'שלום {שם}, לפי הרישומים שלנו קיים חוב בסך {סכום} ({פירוט חוב}). נשמח להסדרה. לפרטים: {טלפון החברה}. {שם החברה}.'
  },
  harsh: {
    subject: 'התראה: חוב דמי ועד',
    body: 'שלום {שם}, למרות פניות קודמות, טרם הוסדר חוב בסך {סכום} ({פירוט חוב}). נבקש להסדיר את התשלום בהקדם, כדי שלא נאלץ להעביר את הטיפול לגורם משפטי. לפרטים: {טלפון החברה}. {שם החברה}.'
  }
};
const LEGACY_SOURCE = { 'בנק': 'bank_import', 'חיובית': 'hiyuvit_import', 'מזומן': 'manual', 'העברה': 'manual', 'קבוע': 'recurring' };

// --------------------------------------------------------------------------
// עזרים
// --------------------------------------------------------------------------
const q = (v) => (v === null || v === undefined || v === '') ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) ? 'null' : String(Number(v));
const arr = (a) => `array[${(a || []).map(q).join(', ')}]::text[]`;
const round2 = (n) => Math.round(n * 100) / 100;
const monthStart = (m) => `${m.slice(0, 7)}-01`;
// "25/09/2026 14:30" או "2026-09-25 14:30" → ISO
function toTimestamp(s) {
  if (!s) return null;
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (m) return `${m[3]}-${m[2]}-${m[1]} ${m[4] || '12'}:${m[5] || '00'}:00+03`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
  if (m) return `${m[1]}-${m[2]}-${m[3]} ${m[4] || '12'}:${m[5] || '00'}:00+03`;
  return null;
}
function write(rel, content) {
  const path = resolve(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.replace(/\r?\n/g, '\n'), 'utf8');
  console.log(`wrote ${rel} (${content.length.toLocaleString()} chars)`);
}

// ==========================================================================
// 1. תוכן התחלתי: פונקציה שממלאת חברה חדשה (נקראת מסקריפט ההקמה ומאיפוס הדמו)
// ==========================================================================
function buildStarterMigration() {
  const out = [];
  const outCats = EXPENSE_CATEGORIES.filter(c => c !== OTHER_CATEGORY);
  out.push(`-- ==========================================================================
-- בית ומנוחה - תוכן התחלתי לחברה: קטגוריות, כללי סיווג, קטגוריות פניות,
-- תבניות מודעות ונוסחי הודעות חוב (אפיון 13, 10.2)
-- נוצר אוטומטית מ-supabase/scripts/build-seeds.mjs. לא לערוך ידנית.
-- ==========================================================================

-- תבנית שנכתבת לאדם אחד (מכתב חוב) ולא לכל הבניין
alter table public.notice_templates add column if not exists addressee text not null default 'building'
  check (addressee in ('building', 'person'));

create or replace function public.seed_starter_content(p_org uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if exists (select 1 from public.categories where org_id = p_org) then
    raise exception 'org % already has starter content', p_org;
  end if;

  -- קטגוריות הוצאה (רגילות, לפי הסדר הקיים)
  insert into public.categories (org_id, direction, name, sort_order) values`);
  out.push(outCats.map((c, i) => `    (p_org, 'out', ${q(c)}, ${i + 1})`).join(',\n') + ';');
  out.push(`
  -- קטגוריות מערכת (קבועות)
  insert into public.categories (org_id, direction, name, sort_order, system_key, is_fixed) values`);
  out.push(SYSTEM_CATEGORIES.map((c, i) => `    (p_org, ${q(c.direction)}, ${q(c.name)}, ${100 + i}, ${q(c.key)}, true)`).join(',\n') + ';');
  out.push(`
  -- הגדרות מערכת עם קטגוריית ברירת המחדל להוצאה שלא זוהתה
  insert into public.system_settings (org_id, default_expense_category_id, default_monthly_dues)
  select p_org, id, 300 from public.categories where org_id = p_org and direction = 'out' and name = ${q(DEFAULT_EXPENSE_CATEGORY)}
  on conflict (org_id) do update set default_expense_category_id = excluded.default_expense_category_id;

  -- כללי סיווג אוטומטי
  insert into public.classification_rules (org_id, contains, direction, category_id, sort_order)
  select p_org, r.contains, 'out', c.id, r.ord
  from (values
${DEFAULT_CATEGORY_RULES.map(([k, c], i) => `    (${q(k)}, ${q(c)}, ${i + 1})`).join(',\n')}
  ) as r(contains, category, ord)
  join public.categories c on c.org_id = p_org and c.direction = 'out' and c.name = r.category;

  -- השמות שבהם הפקדת חיובית מופיעה בעו"ש
  insert into public.bank_name_aliases (org_id, kind, text) values
${HIYUVIT_DEPOSIT_NAMES.map(n => `    (p_org, 'hiyuvit_deposit', ${q(n)})`).join(',\n')};

  -- קטגוריות פניות
  insert into public.issue_categories (org_id, name, sort_order) values
${ISSUE_CATEGORIES.map((n, i) => `    (p_org, ${q(n)}, ${i + 1})`).join(',\n')};

  -- קטגוריות מודעות
  insert into public.notice_categories (org_id, name, sort_order) values
${NOTICE_CATEGORIES.map((c, i) => `    (p_org, ${q(c.name)}, ${i + 1})`).join(',\n')};

  -- תבניות מודעות (הומרו מקובצי הוורד של בית ומנוחה, אפיון 03)
  insert into public.notice_templates (org_id, category_id, name, sort_order, title, body, addressee, system_key)
  select p_org, nc.id, t.name, t.ord, t.title, t.body, t.addressee, t.system_key
  from (values`);
  const catName = Object.fromEntries(NOTICE_CATEGORIES.map(c => [c.id, c.name]));
  out.push(NOTICE_TEMPLATES.map((t, i) =>
    `    (${q(catName[t.categoryId])}, ${q(t.name)}, ${i + 1}, ${q(t.title)}, ${q(t.body)}, ${q(t.addressee || 'building')}, ${q(TEMPLATE_SYSTEM_KEYS[t.id] || null)})`
  ).join(',\n'));
  out.push(`  ) as t(category, name, ord, title, body, addressee, system_key)
  left join public.notice_categories nc on nc.org_id = p_org and nc.name = t.category;

  -- נוסחי הודעות חוב קצרות
  insert into public.short_messages (org_id, tone, body, email_subject) values
    (p_org, 'soft', ${q(SHORT_MESSAGES.soft.body)}, ${q(SHORT_MESSAGES.soft.subject)}),
    (p_org, 'harsh', ${q(SHORT_MESSAGES.harsh.body)}, ${q(SHORT_MESSAGES.harsh.subject)});
end;
$fn$;

revoke execute on function public.seed_starter_content(uuid) from public, anon, authenticated;
`);
  return out.join('\n');
}

// ==========================================================================
// 2. נתוני דמו: מוחק את נתוני חברת הדמו בלבד וטוען אותם מחדש (אפיון 13, 10.1)
// ==========================================================================
function buildDemoSeed() {
  const L = [];
  const ids = new Map();
  const id = (key) => { if (!ids.has(key)) ids.set(key, randomUUID()); return ids.get(key); };

  L.push(`-- ==========================================================================
-- בית ומנוחה - איפוס ומילוי חברת הדמו בלבד (אפיון 13, 10.1)
-- נוצר אוטומטית מ-supabase/scripts/build-seeds.mjs. לא לערוך ידנית.
-- הרצה: npx supabase db query --linked -f supabase/seeds/demo.sql
--
-- בטיחות: הסקריפט פועל רק על חברה שמסומנת is_demo, ונעצר אם יש יותר מאחת
-- או אם אין. הוא לא נוגע בשום שורה של חברה אחרת.
-- ==========================================================================
do $demo$
declare
  v_org uuid;
  v_author uuid;
  v_n integer;
begin
  select count(*) into v_n from public.orgs where is_demo;
  if v_n <> 1 then
    raise exception 'expected exactly one demo org, found %', v_n;
  end if;
  select id into v_org from public.orgs where is_demo;
  select user_id into v_author from public.platform_admins order by created_at limit 1;
  if v_author is null then
    raise exception 'create the developer user (platform_admins) before loading demo data';
  end if;

  -- ---------------- מחיקת נתוני הדמו בלבד ----------------
  delete from public.charge_payments where org_id = v_org;
  delete from public.unit_charges where org_id = v_org;
  delete from public.plan_installments where org_id = v_org;
  delete from public.payment_plans where org_id = v_org;
  delete from public.levy_exclusions where org_id = v_org;
  delete from public.hiyuvit_items where org_id = v_org;
  delete from public.manager_reimbursements where org_id = v_org;
  delete from public.communications where org_id = v_org;
  delete from public.issue_reads where issue_id in (select id from public.issues where org_id = v_org);
  delete from public.issue_attachments where org_id = v_org;
  delete from public.issue_messages where org_id = v_org;
  update public.transactions set issue_id = null where org_id = v_org and issue_id is not null;
  update public.issues set follow_up_of = null, expense_tx_id = null where org_id = v_org;
  delete from public.issues where org_id = v_org;
  delete from public.transactions where org_id = v_org;
  delete from public.special_levies where org_id = v_org;
  delete from public.report_log where org_id = v_org;
  delete from public.occupant_contacts where org_id = v_org;
  delete from public.occupancies where org_id = v_org;
  delete from public.unit_dues_rates where org_id = v_org;
  delete from public.split_rules where org_id = v_org;
  delete from public.recurring_expenses where org_id = v_org;
  delete from public.month_closes where org_id = v_org;
  delete from public.opening_balances where org_id = v_org;
  delete from public.import_batches where org_id = v_org;
  delete from public.management_fee_settings where org_id = v_org;
  delete from public.profiles where org_id = v_org;
  delete from public.units where org_id = v_org;
  delete from public.buildings where org_id = v_org;
  delete from public.system_settings where org_id = v_org;
  delete from public.classification_rules where org_id = v_org;
  delete from public.categories where org_id = v_org;
  delete from public.notice_templates where org_id = v_org;
  delete from public.notice_categories where org_id = v_org;
  delete from public.short_messages where org_id = v_org;
  delete from public.report_presets where org_id = v_org;
  delete from public.issue_categories where org_id = v_org;
  delete from public.bank_name_aliases where org_id = v_org;
  delete from public.company_contacts where org_id = v_org;
  delete from public.integrations where org_id = v_org;
  delete from public.job_runs where org_id = v_org;
  update public.orgs set issue_seq = 0 where id = v_org;

  -- ---------------- תוכן התחלתי ----------------
  perform public.seed_starter_content(v_org);
  update public.system_settings set manager_name = 'מנהל לדוגמה' where org_id = v_org;
  insert into public.company_contacts (org_id, kind, label, value, sort_order) values
    (v_org, 'phone', 'משרד', '050-0000000', 1),
    (v_org, 'email', null, 'demo@example.com', 1);
`);

  const cat = (name, direction) =>
    `(select id from public.categories where org_id = v_org and direction = ${q(direction)} and name = ${q(name)} and deleted_at is null)`;
  const otherCat = (direction) =>
    `(select id from public.categories where org_id = v_org and system_key = ${q(direction === 'out' ? 'other' : 'other_income')})`;

  const closes = [];
  INITIAL_BUILDINGS.forEach((b, bi) => {
    const bid = id(`b:${b.id}`);
    L.push(`  -- ---------------- ${b.name} ----------------`);
    L.push(`  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values (${q(bid)}, v_org, ${q(b.name)}, ${q(b.address)}, ${q(b.color?.id)}, ${q(b.bankAccount)}, ${q(b.hiyuvitCode)}, ${bi + 1});`);

    (b.apartments || []).forEach((a, ai) => {
      const uid = id(`u:${b.id}:${a.id}`);
      const oid = id(`o:${b.id}:${a.id}`);
      const commercial = a.unitType === 'commercial';
      L.push(`  insert into public.units (id, org_id, building_id, unit_type, commercial_label, number, entrance, floor, sort_order) values (${q(uid)}, v_org, ${q(bid)}, ${q(commercial ? 'commercial' : 'residential')}, ${q(commercial ? (a.commercialLabel || 'shop') : null)}, ${q(String(a.aptNum ?? ''))}, ${q(a.entrance)}, ${q(a.floor)}, ${ai + 1});`);
      L.push(`  insert into public.occupancies (id, org_id, unit_id, tenant_name, business_name, occupant_type, payment_method, bank_payer_names, hiyuvit_client_number, start_date) values (${q(oid)}, v_org, ${q(uid)}, ${q(a.tenantName)}, ${q(a.businessName)}, ${q(a.occupantType)}, ${q(a.paymentMethod)}, ${arr(a.bankPayerNames)}, ${q(a.hiyuvitClientNumber)}, '2024-01-01');`);
      if (a.phone) L.push(`  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, ${q(oid)}, 'phone', ${q(a.phone)}, true);`);
      if (a.email) L.push(`  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, ${q(oid)}, 'email', ${q(a.email)}, true);`);
      if (a.monthlyDues) L.push(`  insert into public.unit_dues_rates (org_id, unit_id, amount, effective_month) values (v_org, ${q(uid)}, ${num(a.monthlyDues)}, '2024-01-01');`);
      (a.debtMonths || []).forEach(m => {
        L.push(`  insert into public.unit_charges (org_id, unit_id, month, kind, occupancy_id, amount_due) values (v_org, ${q(uid)}, ${q(monthStart(m))}, 'dues', ${q(oid)}, ${num(a.monthlyDues || 0)});`);
      });
    });

    // תנועות: מהוצאות הישנות (סכום שלילי = הכנסה), כמו legacyExpenseToTx
    const txs = (b.expenses || []).map(e => {
      const income = (e.amount || 0) < 0;
      const source = LEGACY_SOURCE[e.source] || 'bank_import';
      return {
        date: e.date || monthStart(e.month),
        direction: income ? 'in' : 'out',
        amount: round2(Math.abs(e.amount || 0)),
        account: source === 'manual' ? 'cash' : 'bank',
        category: e.category,
        description: e.description,
        source
      };
    }).filter(t => t.amount > 0);
    txs.forEach(t => {
      L.push(`  insert into public.transactions (org_id, building_id, account, date, direction, amount, category_id, source, description) values (v_org, ${q(bid)}, ${q(t.account)}, ${q(t.date)}, ${q(t.direction)}, ${num(t.amount)}, coalesce(${cat(t.category, t.direction)}, ${otherCat(t.direction)}), ${q(t.source)}, ${q(t.description)});`);
    });
    (b.settings?.recurringExpenses || []).forEach(r => {
      L.push(`  insert into public.recurring_expenses (org_id, building_id, name, category_id, amount) values (v_org, ${q(bid)}, ${q(r.name)}, ${cat(r.category, 'out')}, ${num(r.amount)});`);
    });

    // גביות מיוחדות: חיוב לכל דירה, ותשלום לדירות ששילמו
    (b.specialLevies || []).forEach(l => {
      const lid = id(`l:${b.id}:${l.id}`);
      const start = monthStart(l.createdAt || '2026-09-01');
      const status = l.status === 'פעיל' ? 'active' : (l.status === 'הושלם' ? 'completed' : 'active');
      L.push(`  insert into public.special_levies (id, org_id, building_id, name, mode, amount_per_unit, start_month, installments, status) values (${q(lid)}, v_org, ${q(bid)}, ${q(l.title)}, 'one_time', ${num(l.amountPerApt)}, ${q(start)}, 1, ${q(status)});`);
      (b.apartments || []).forEach(a => {
        const uid = id(`u:${b.id}:${a.id}`);
        const oid = id(`o:${b.id}:${a.id}`);
        const chid = id(`lc:${b.id}:${l.id}:${a.id}`);
        L.push(`  insert into public.unit_charges (id, org_id, unit_id, month, kind, levy_id, occupancy_id, amount_due) values (${q(chid)}, v_org, ${q(uid)}, ${q(start)}, 'levy', ${q(lid)}, ${q(oid)}, ${num(l.amountPerApt)});`);
        if ((l.paidApartmentIds || []).includes(a.id)) {
          const txid = id(`lt:${b.id}:${l.id}:${a.id}`);
          L.push(`  insert into public.transactions (id, org_id, building_id, account, date, direction, amount, category_id, levy_id, source, unit_id, description) values (${q(txid)}, v_org, ${q(bid)}, 'cash', ${q(l.createdAt || start)}, 'in', ${num(l.amountPerApt)}, ${otherCat('in')}, ${q(lid)}, 'manual', ${q(uid)}, ${q(`תשלום ${l.title} · דירה ${a.aptNum}`)});`);
          L.push(`  insert into public.charge_payments (org_id, charge_id, transaction_id, amount) values (v_org, ${q(chid)}, ${q(txid)}, ${num(l.amountPerApt)});`);
        }
      });
    });

    // יתרת פתיחה: כך שהיתרה המחושבת (כולל תשלומי הגביות) תשווה ל-currentBalance (אפיון 04, 4.2)
    const bankSum = round2(txs.filter(t => t.account === 'bank').reduce((s, t) => s + (t.direction === 'in' ? t.amount : -t.amount), 0));
    const levyPaid = (b.specialLevies || []).reduce((s, l) => s + (l.paidApartmentIds || []).length * (l.amountPerApt || 0), 0);
    const cashSum = round2(txs.filter(t => t.account === 'cash').reduce((s, t) => s + (t.direction === 'in' ? t.amount : -t.amount), 0) + levyPaid);
    const earliest = txs.map(t => t.date).sort()[0] || '2026-01-01';
    L.push(`  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, ${q(bid)}, 'bank', ${q(earliest)}, ${num(round2((b.currentBalance || 0) - bankSum - cashSum))});`);

    // פניות
    (b.issues || []).forEach(iss => {
      const iid = id(`i:${b.id}:${iss.id}`);
      const created = toTimestamp(iss.createdAt) || '2026-09-01 12:00:00+03';
      const closed = iss.status === 'closed';
      L.push(`  insert into public.issues (id, org_id, building_id, title, status, closed_at, reported_by_text, created_at) values (${q(iid)}, v_org, ${q(bid)}, ${q(iss.title)}, ${q(closed ? 'closed' : 'open')}, ${closed ? q(created) : 'null'}, ${q(iss.author)}, ${q(created)});`);
      (iss.comments || []).forEach(c => {
        L.push(`  insert into public.issue_messages (org_id, issue_id, author_id, kind, text, created_at) values (v_org, ${q(iid)}, v_author, 'message', ${q(`${c.author}: ${c.text}`)}, ${q(toTimestamp(c.time) || created)});`);
      });
    });

    if (b.statusMonthUpdated) closes.push(bid);
  });

  // סגירת חודש — אחרי כל התנועות (תנועה בחודש סגור דורשת סיבה)
  L.push('\n  -- ---------------- סגירת ספטמבר בבניינים שעודכנו ----------------');
  closes.forEach(bid => {
    L.push(`  insert into public.month_closes (org_id, building_id, month, steps, closed_at) values (v_org, ${q(bid)}, '2026-09-01', '{"bank": {"done": true}, "hiyuvit": {"done": true}, "receipts": {"done": true}, "expenses": {"done": true}}'::jsonb, now());`);
  });

  L.push(`
  -- יומן השינויים של הדמו מתחיל נקי (הטעינה עצמה לא נחשבת "שינוי")
  delete from public.audit_log where org_id = v_org;
end;
$demo$;
`);
  return L.join('\n');
}

write('supabase/migrations/20261017000014_starter_content.sql', buildStarterMigration());
write('supabase/seeds/demo.sql', buildDemoSeed());
