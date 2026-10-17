-- ==========================================================================
-- בית ומנוחה - הגדרות, דמי ניהול, תבניות מודעות, יומן תקשורת, יומן דוחות,
-- העדפות אישיות, חיבורים חיצוניים ויומן משימות שרת
-- אפיון 13, נושאים 7–9
-- ==========================================================================

-- --------------------------------------------------------------------------
-- הגדרות מערכת: שורה אחת לכל חברה (שם החברה עצמו נמצא ב-orgs)
-- --------------------------------------------------------------------------
create table public.system_settings (
  org_id                       uuid primary key references public.orgs (id),
  manager_name                 text,
  logo_path                    text,               -- bucket: branding
  notice_header_prefix         text,
  notice_signoff               text,
  low_balance_threshold        numeric(12,2) not null default 7000,
  chronic_debt_months          integer not null default 3 check (chronic_debt_months between 1 and 24),
  default_monthly_dues         numeric(12,2),
  default_expense_category_id  uuid,
  levy_detect_threshold        numeric(4,3) not null default 0.3 check (levy_detect_threshold between 0 and 1),
  levy_confirm                 text not null default 'first_time' check (levy_confirm in ('first_time', 'always')),
  charge_generation            text not null default 'manual' check (charge_generation in ('manual', 'automatic')),
  issue_archive_retention      text not null default 'forever' check (issue_archive_retention in ('forever', '5y', '3y', '1y')),
  attachment_retention         text not null default '1y' check (attachment_retention in ('forever', '2y', '1y', '6m')),
  issue_reminder_days          integer default 3 check (issue_reminder_days is null or issue_reminder_days between 1 and 30),
  backup                       jsonb not null default
    '{"enabled": true, "frequency": "weekly", "keep": 20, "include_images": true, "include_imports": true}'::jsonb,
  created_at                   timestamptz not null default now(),
  created_by                   uuid,
  updated_at                   timestamptz not null default now(),
  updated_by                   uuid,
  foreign key (default_expense_category_id, org_id) references public.categories (id, org_id)
);
create trigger system_settings_audit before insert or update on public.system_settings
  for each row execute function public.set_audit_fields();

-- קטגוריית ברירת המחדל לא נמחקת (אפיון 11, נושא 2)
create or replace function public.guard_default_category_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null
     and exists (select 1 from public.system_settings where default_expense_category_id = new.id) then
    raise exception 'this is the default expense category; choose another default first' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger categories_default_guard before update on public.categories
  for each row execute function public.guard_default_category_delete();

-- טלפונים ומיילים של החברה
create table public.company_contacts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.default_org_id() references public.orgs (id),
  kind        text not null check (kind in ('phone', 'email')),
  label       text,
  value       text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  created_by  uuid,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);
create trigger company_contacts_audit before insert or update on public.company_contacts
  for each row execute function public.set_audit_fields();

-- כללי סיווג אוטומטי בקליטת עו"ש
create table public.classification_rules (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null default public.default_org_id() references public.orgs (id),
  contains     text not null check (nullif(trim(contains), '') is not null),
  direction    text check (direction in ('in', 'out')),
  category_id  uuid not null,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  created_by   uuid,
  updated_at   timestamptz not null default now(),
  updated_by   uuid,
  foreign key (category_id, org_id) references public.categories (id, org_id)
);
create trigger classification_rules_audit before insert or update on public.classification_rules
  for each row execute function public.set_audit_fields();

-- השמות שבהם חיובית והמנהל מופיעים בעו"ש
create table public.bank_name_aliases (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.default_org_id() references public.orgs (id),
  kind        text not null check (kind in ('hiyuvit_deposit', 'manager')),
  text        text not null check (nullif(trim(text), '') is not null),
  created_at  timestamptz not null default now(),
  created_by  uuid default auth.uid()
);

-- כללי פיצול של תשלום בחיובית בין קופות (אפיון 05)
create table public.split_rules (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.default_org_id(),
  unit_id     uuid not null,
  amount      numeric(12,2) not null check (amount > 0),
  parts       jsonb not null,          -- [{"fund": "current" | "<levy_id>", "amount": 270}, ...]
  created_at  timestamptz not null default now(),
  created_by  uuid,
  updated_at  timestamptz not null default now(),
  updated_by  uuid,
  unique (unit_id, amount),
  foreign key (unit_id, org_id) references public.units (id, org_id)
);
create trigger split_rules_audit before insert or update on public.split_rules
  for each row execute function public.set_audit_fields();

-- דמי ניהול: ברירת מחדל (building_id ריק) ודריסה לבניין, "החל מחודש" (אפיון 04, 7.3א)
create table public.management_fee_settings (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null default public.default_org_id(),
  building_id      uuid,
  effective_month  date not null check (effective_month = date_trunc('month', effective_month)::date),
  method           text not null check (method in ('per_unit', 'percent')),
  per_unit_amount  numeric(12,2) check (per_unit_amount >= 0),
  units_count      integer check (units_count >= 0),     -- ריק = כל דירות המגורים
  percent          numeric(5,2) check (percent between 0 and 100),
  percent_base     text check (percent_base in ('dues', 'all')),
  payment_mode     text not null default 'bank' check (payment_mode in ('bank', 'hiyuvit_deduct')),
  created_at       timestamptz not null default now(),
  created_by       uuid,
  updated_at       timestamptz not null default now(),
  updated_by       uuid,
  foreign key (building_id, org_id) references public.buildings (id, org_id),
  constraint management_fee_method_fields check (
    (method = 'per_unit' and per_unit_amount is not null) or
    (method = 'percent' and percent is not null and percent_base is not null)
  )
);
create unique index management_fee_settings_once on public.management_fee_settings (org_id, building_id, effective_month) nulls not distinct;
create trigger management_fee_settings_audit before insert or update on public.management_fee_settings
  for each row execute function public.set_audit_fields();

-- --------------------------------------------------------------------------
-- תבניות מודעות (אפיון 03) ונוסחי הודעות חוב קצרות (אפיון 11, 4.5)
-- --------------------------------------------------------------------------
create table public.notice_categories (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.default_org_id() references public.orgs (id),
  name        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  created_by  uuid,
  updated_at  timestamptz not null default now(),
  updated_by  uuid,
  unique (id, org_id)
);
create trigger notice_categories_audit before insert or update on public.notice_categories
  for each row execute function public.set_audit_fields();

create table public.notice_templates (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null default public.default_org_id(),
  category_id  uuid,
  name         text not null,
  sort_order   integer not null default 0,
  title        text not null default '',
  body         text not null default '',
  is_favorite  boolean not null default false,
  system_key   text,                          -- 'debt_warning', 'dues_reminder' וכו' (לפעולות המהירות)
  deleted_at   timestamptz,
  deleted_by   uuid,
  created_at   timestamptz not null default now(),
  created_by   uuid,
  updated_at   timestamptz not null default now(),
  updated_by   uuid,
  unique (id, org_id),
  foreign key (category_id, org_id) references public.notice_categories (id, org_id)
);
create unique index notice_templates_system_key on public.notice_templates (org_id, system_key) where system_key is not null;
create trigger notice_templates_audit before insert or update on public.notice_templates
  for each row execute function public.set_audit_fields();

-- 5 הגרסאות האחרונות של כל תבנית נשמרות אוטומטית בכל שינוי נוסח
create table public.notice_template_versions (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null,
  template_id  uuid not null,
  title        text not null,
  body         text not null,
  saved_at     timestamptz not null default now(),
  saved_by     uuid,
  foreign key (template_id, org_id) references public.notice_templates (id, org_id) on delete cascade
);
create index notice_template_versions_idx on public.notice_template_versions (template_id, saved_at desc);

create or replace function public.keep_notice_template_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.title is distinct from old.title or new.body is distinct from old.body then
    insert into public.notice_template_versions (org_id, template_id, title, body, saved_by)
    values (old.org_id, old.id, old.title, old.body, auth.uid());
    delete from public.notice_template_versions
    where template_id = old.id
      and id not in (select id from public.notice_template_versions where template_id = old.id order by saved_at desc limit 5);
  end if;
  return null;
end;
$$;
revoke execute on function public.keep_notice_template_version() from public, anon, authenticated;
create trigger notice_templates_versions after update on public.notice_templates
  for each row execute function public.keep_notice_template_version();

create table public.short_messages (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null default public.default_org_id() references public.orgs (id),
  tone           text not null check (tone in ('soft', 'harsh')),
  body           text not null,
  email_subject  text,
  created_at     timestamptz not null default now(),
  created_by     uuid,
  updated_at     timestamptz not null default now(),
  updated_by     uuid,
  unique (org_id, tone)
);
create trigger short_messages_audit before insert or update on public.short_messages
  for each row execute function public.set_audit_fields();

create table public.report_presets (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.default_org_id() references public.orgs (id),
  name        text not null,
  config      jsonb not null default '{}'::jsonb,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  created_by  uuid,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);
create trigger report_presets_audit before insert or update on public.report_presets
  for each row execute function public.set_audit_fields();

-- --------------------------------------------------------------------------
-- יומן תקשורת אחד (אפיון 13, 7.2) ויומן דוחות (7.3)
-- --------------------------------------------------------------------------
create table public.communications (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null default public.default_org_id(),
  building_id   uuid not null,
  occupancy_id  uuid,
  template_id   uuid,
  tone          text check (tone in ('soft', 'harsh')),
  channel       text not null check (channel in ('print', 'pdf', 'email', 'whatsapp')),
  final_title   text,
  final_body    text,
  recipient     text,
  status        text not null default 'sent' check (status in ('sent', 'opened_unconfirmed', 'failed', 'demo_blocked')),
  error         text,
  created_at    timestamptz not null default now(),
  created_by    uuid,
  updated_at    timestamptz not null default now(),
  updated_by    uuid,
  foreign key (building_id, org_id) references public.buildings (id, org_id),
  foreign key (occupancy_id, org_id) references public.occupancies (id, org_id),
  foreign key (template_id, org_id) references public.notice_templates (id, org_id)
);
create index communications_building_idx on public.communications (building_id, created_at desc);
create index communications_occupancy_idx on public.communications (occupancy_id, created_at desc) where occupancy_id is not null;
create trigger communications_audit before insert or update on public.communications
  for each row execute function public.set_audit_fields();

-- אחרי שליחה מותר לעדכן רק את המצב (אישור "שלחתי" / "לא נשלח"), לא את התוכן
create or replace function public.guard_communication_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (to_jsonb(new) - array['status', 'error', 'updated_at', 'updated_by'])
     is distinct from (to_jsonb(old) - array['status', 'error', 'updated_at', 'updated_by']) then
    raise exception 'a sent communication cannot be changed, only its status' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger communications_edit_guard before update on public.communications
  for each row execute function public.guard_communication_edit();

create table public.report_log (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null default public.default_org_id(),
  building_id  uuid,
  report_type  text not null,
  period_from  date,
  period_to    date,
  channel      text not null,
  is_draft     boolean not null default false,
  snapshot     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  created_by   uuid default auth.uid(),
  foreign key (building_id, org_id) references public.buildings (id, org_id)
);
create index report_log_building_idx on public.report_log (building_id, created_at desc);

-- --------------------------------------------------------------------------
-- העדפות אישיות: לכל משתמש ולכל סוג מכשיר (אפיון 13, 8.3)
-- --------------------------------------------------------------------------
create table public.user_preferences (
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  device_class  text not null check (device_class in ('desktop', 'tablet', 'phone')),
  display       jsonb not null default '{}'::jsonb,
  table_sorts   jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now(),
  primary key (user_id, device_class)
);

-- --------------------------------------------------------------------------
-- חיבורים חיצוניים (בלי סודות; הסודות ב-Vault) ויומן משימות שרת (אפיון 13, 9)
-- נכתבים רק מפונקציות שרת (service role)
-- --------------------------------------------------------------------------
create table public.integrations (
  org_id         uuid not null references public.orgs (id),
  kind           text not null check (kind in ('google_drive', 'gmail')),
  account_email  text,
  status         text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  connected_at   timestamptz,
  last_ok_at     timestamptz,
  last_error     text,
  details        jsonb not null default '{}'::jsonb,   -- למשל מזהה תיקיית הדרייב
  primary key (org_id, kind)
);

create table public.job_runs (
  id           bigint generated always as identity primary key,
  org_id       uuid references public.orgs (id),
  job          text not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'running' check (status in ('running', 'ok', 'failed', 'skipped')),
  details      jsonb not null default '{}'::jsonb,
  error        text
);
create index job_runs_org_idx on public.job_runs (org_id, started_at desc);

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.system_settings enable row level security;
alter table public.company_contacts enable row level security;
alter table public.classification_rules enable row level security;
alter table public.bank_name_aliases enable row level security;
alter table public.split_rules enable row level security;
alter table public.management_fee_settings enable row level security;
alter table public.notice_categories enable row level security;
alter table public.notice_templates enable row level security;
alter table public.notice_template_versions enable row level security;
alter table public.short_messages enable row level security;
alter table public.report_presets enable row level security;
alter table public.communications enable row level security;
alter table public.report_log enable row level security;
alter table public.user_preferences enable row level security;
alter table public.integrations enable row level security;
alter table public.job_runs enable row level security;

-- הגדרות מערכת ופרטי קשר: כל משתמש בחברה קורא (מיתוג, שם, לוגו); ליבה — מנהל בלבד
create policy system_settings_select on public.system_settings for select to authenticated
  using (org_id = (select public.current_org()));
create policy system_settings_insert on public.system_settings for insert to authenticated
  with check (org_id = (select public.current_org()) and (select public.can_core()));
create policy system_settings_update on public.system_settings for update to authenticated
  using (org_id = (select public.current_org()) and (select public.can_core()))
  with check (org_id = (select public.current_org()) and (select public.can_core()));

create policy company_contacts_select on public.company_contacts for select to authenticated
  using (org_id = (select public.current_org()));

-- טבלאות ליבה (מנהל בלבד לכתיבה; קריאה לפי תחום)
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('company_contacts',        null::text, 'core'),
      ('bank_name_aliases',       'finance',  'core'),
      ('split_rules',             'finance',  'core'),
      ('management_fee_settings', 'finance',  'core'),
      ('classification_rules',    'finance',  'ops'),
      ('notice_categories',       'notices',  'ops'),
      ('notice_templates',        'notices',  'ops'),
      ('short_messages',          'notices',  'ops'),
      ('report_presets',          'reports',  'ops')
    ) as v(tbl, read_area, write_kind)
  loop
    if t.read_area is not null then
      execute format(
        'create policy %1$s_select on public.%1$s for select to authenticated using (org_id = (select public.current_org()) and ((select public.can(%2$L, ''view'')) or (select public.can(''ops_settings'', ''view''))))',
        t.tbl, t.read_area);
    end if;
    execute format(
      'create policy %1$s_insert on public.%1$s for insert to authenticated with check (org_id = (select public.current_org()) and %2$s)',
      t.tbl, case when t.write_kind = 'core' then '(select public.can_core())' else '(select public.can(''ops_settings'', ''edit''))' end);
    execute format(
      'create policy %1$s_update on public.%1$s for update to authenticated using (org_id = (select public.current_org()) and %2$s) with check (org_id = (select public.current_org()) and %2$s)',
      t.tbl, case when t.write_kind = 'core' then '(select public.can_core())' else '(select public.can(''ops_settings'', ''edit''))' end);
    -- רשימות פשוטות: מותר למחוק פריט (תבניות נמחקות רכות דרך עדכון)
    if t.tbl <> 'notice_templates' then
      execute format(
        'create policy %1$s_delete on public.%1$s for delete to authenticated using (org_id = (select public.current_org()) and %2$s)',
        t.tbl, case when t.write_kind = 'core' then '(select public.can_core())' else '(select public.can(''ops_settings'', ''edit''))' end);
      execute format('grant select, insert, update, delete on public.%I to authenticated', t.tbl);
    else
      execute format('grant select, insert, update on public.%I to authenticated', t.tbl);
    end if;
  end loop;
end;
$$;

-- גרסאות תבנית: קריאה בלבד (נוצרות בטריגר)
create policy notice_template_versions_select on public.notice_template_versions for select to authenticated
  using (org_id = (select public.current_org()) and ((select public.can('notices', 'view')) or (select public.can('ops_settings', 'view'))));
grant select on public.notice_template_versions to authenticated;

-- יומן תקשורת: מודעות ומכתבים. נציגים לא רואים.
create policy communications_select on public.communications for select to authenticated
  using (org_id = (select public.current_org()) and (select public.can('notices', 'view')) and (select public.my_building_id()) is null);
create policy communications_insert on public.communications for insert to authenticated
  with check (org_id = (select public.current_org()) and (select public.can('notices', 'edit')) and (select public.my_building_id()) is null);
create policy communications_update on public.communications for update to authenticated
  using (org_id = (select public.current_org()) and (select public.can('notices', 'edit')) and (select public.my_building_id()) is null)
  with check (org_id = (select public.current_org()) and (select public.can('notices', 'edit')) and (select public.my_building_id()) is null);
grant select, insert, update on public.communications to authenticated;

-- יומן דוחות: לא לנציגים (הדוח שלהם מחושב בשרת)
create policy report_log_select on public.report_log for select to authenticated
  using (org_id = (select public.current_org()) and (select public.can('reports', 'view')) and (select public.my_building_id()) is null);
create policy report_log_insert on public.report_log for insert to authenticated
  with check (org_id = (select public.current_org()) and (select public.can('reports', 'edit')) and (select public.my_building_id()) is null);
grant select, insert on public.report_log to authenticated;

-- העדפות אישיות: כל משתמש לעצמו (כולל נציג ומפתח)
create policy user_preferences_all on public.user_preferences for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.user_preferences to authenticated;

-- חיבורים ויומן משימות: קריאה למנהל (ולמפתח); כתיבה רק מהשרת
create policy integrations_select on public.integrations for select to authenticated
  using (org_id = (select public.current_org()) and (select public.can_core()));
grant select on public.integrations to authenticated;

create policy job_runs_select on public.job_runs for select to authenticated
  using ((org_id = (select public.current_org()) and (select public.can_core())) or (select public.is_platform_admin()));
grant select on public.job_runs to authenticated;

-- --------------------------------------------------------------------------
-- Storage: לוגו החברה. נתיב <org_id>/<file>. קריאה לכל משתמש בחברה.
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('branding', 'branding', false, 1048576, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy branding_read on storage.objects for select to authenticated
  using (bucket_id = 'branding' and (storage.foldername(name))[1] = (select public.current_org())::text);
create policy branding_write on storage.objects for insert to authenticated
  with check (bucket_id = 'branding' and (storage.foldername(name))[1] = (select public.current_org())::text and (select public.can_core()));
create policy branding_update on storage.objects for update to authenticated
  using (bucket_id = 'branding' and (storage.foldername(name))[1] = (select public.current_org())::text and (select public.can_core()));
