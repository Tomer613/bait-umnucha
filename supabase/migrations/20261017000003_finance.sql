-- ==========================================================================
-- בית ומנוחה - כספים: קטגוריות, תנועות, יתרות, קליטות, חיובית, החזרי מנהל,
-- הוצאות קבועות, סגירת חודש ויומן שינויים
-- אפיון 13, נושא 4 (מתרגם את אפיון 04)
-- ==========================================================================

create extension if not exists pg_trgm with schema extensions;

-- --------------------------------------------------------------------------
-- קטגוריות (הוצאה והכנסה). קטגוריות מערכת (system_key) קבועות ולא נמחקות.
-- --------------------------------------------------------------------------
create table public.categories (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null default public.default_org_id() references public.orgs (id),
  direction      text not null check (direction in ('in', 'out')),
  name           text not null,
  sort_order     integer not null default 0,
  system_key     text,          -- 'other', 'hiyuvit_income', 'direct_income', 'manager_transfer' וכו'
  is_fixed       boolean not null default false,
  deleted_at     timestamptz,
  deleted_by     uuid,
  created_at     timestamptz not null default now(),
  created_by     uuid,
  updated_at     timestamptz not null default now(),
  updated_by     uuid,
  unique (id, org_id),
  constraint categories_fixed_not_deleted check (not (is_fixed and deleted_at is not null))
);
create unique index categories_name_unique on public.categories (org_id, direction, lower(name)) where deleted_at is null;
create unique index categories_system_key_unique on public.categories (org_id, system_key) where system_key is not null;
create trigger categories_audit before insert or update on public.categories
  for each row execute function public.set_audit_fields();

-- --------------------------------------------------------------------------
-- קליטות קבצים
-- --------------------------------------------------------------------------
create table public.import_batches (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null default public.default_org_id(),
  building_id     uuid not null,
  kind            text not null check (kind in ('bank', 'hiyuvit')),
  file_path       text,          -- הקובץ המקורי ב-Storage (bucket: imports)
  file_name       text,
  period_from     date,
  period_to       date,
  rows_new        integer not null default 0,
  rows_existing   integer not null default 0,
  undone_at       timestamptz,
  undone_by       uuid,
  undo_reason     text,
  created_at      timestamptz not null default now(),
  created_by      uuid,
  updated_at      timestamptz not null default now(),
  updated_by      uuid,
  unique (id, org_id),
  foreign key (building_id, org_id) references public.buildings (id, org_id),
  constraint import_batches_undo_reason check (undone_at is null or undo_reason is not null)
);
create index import_batches_building_idx on public.import_batches (building_id, created_at desc);
create trigger import_batches_audit before insert or update on public.import_batches
  for each row execute function public.set_audit_fields();

-- --------------------------------------------------------------------------
-- ספר התנועות
-- levy_id / issue_id / payment_plan_id מקבלים מפתח זר במיגרציות הבאות
-- --------------------------------------------------------------------------
create table public.transactions (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null default public.default_org_id(),
  building_id        uuid not null,
  account            text not null check (account in ('bank', 'cash', 'manager')),
  date               date not null,
  month              date generated always as ((date_trunc('month', date::timestamp))::date) stored,
  direction          text not null check (direction in ('in', 'out')),
  amount             numeric(12,2) not null check (amount > 0),
  category_id        uuid,
  levy_id            uuid,          -- קופה: ריק = שוטפת
  source             text not null check (source in ('bank_import', 'hiyuvit_import', 'manual', 'recurring')),
  import_batch_id    uuid,
  fingerprint        text,
  unit_id            uuid,
  issue_id           uuid,
  payment_plan_id    uuid,
  description        text,
  reference          text,
  transfer_group_id  uuid,
  change_reason      text,          -- הסיבה לשינוי האחרון (חובה בחודש סגור)
  deleted_at         timestamptz,
  deleted_by         uuid,
  delete_reason      text,
  created_at         timestamptz not null default now(),
  created_by         uuid,
  updated_at         timestamptz not null default now(),
  updated_by         uuid,
  unique (id, org_id),
  foreign key (building_id, org_id) references public.buildings (id, org_id),
  foreign key (category_id, org_id) references public.categories (id, org_id),
  foreign key (import_batch_id, org_id) references public.import_batches (id, org_id),
  foreign key (unit_id, org_id) references public.units (id, org_id),
  constraint transactions_delete_reason check (deleted_at is null or nullif(trim(delete_reason), '') is not null)
);
create index transactions_building_date_idx on public.transactions (building_id, date);
create index transactions_month_idx on public.transactions (building_id, month);
create index transactions_fingerprint_idx on public.transactions (building_id, fingerprint) where fingerprint is not null;
create index transactions_transfer_idx on public.transactions (transfer_group_id) where transfer_group_id is not null;
create index transactions_batch_idx on public.transactions (import_batch_id) where import_batch_id is not null;
create index transactions_description_trgm on public.transactions using gin (description extensions.gin_trgm_ops);
create trigger transactions_audit before insert or update on public.transactions
  for each row execute function public.set_audit_fields();

-- תשלום על חיוב מקושר לתנועה (מיגרציה 2 השאירה את העמודה בלי מפתח זר)
alter table public.charge_payments
  add constraint charge_payments_tx_fk foreign key (transaction_id, org_id) references public.transactions (id, org_id);

-- --------------------------------------------------------------------------
-- יתרות פתיחה
-- --------------------------------------------------------------------------
create table public.opening_balances (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null default public.default_org_id(),
  building_id  uuid not null,
  account      text not null check (account in ('bank', 'cash')),
  date         date not null,
  amount       numeric(12,2) not null,
  change_reason text,
  created_at   timestamptz not null default now(),
  created_by   uuid,
  updated_at   timestamptz not null default now(),
  updated_by   uuid,
  unique (building_id, account),
  foreign key (building_id, org_id) references public.buildings (id, org_id)
);
create trigger opening_balances_audit before insert or update on public.opening_balances
  for each row execute function public.set_audit_fields();

-- --------------------------------------------------------------------------
-- שורות פירוט מדו"ח חיובית
-- --------------------------------------------------------------------------
create table public.hiyuvit_items (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null default public.default_org_id(),
  import_batch_id  uuid not null,
  building_id      uuid not null,
  client_number    text,
  client_name      text,
  occupancy_id     uuid,
  unit_id          uuid,
  month            date not null check (month = date_trunc('month', month)::date),
  amount           numeric(12,2) not null,
  status           text not null check (status in ('paid', 'failed')),
  levy_id          uuid,
  created_at       timestamptz not null default now(),
  created_by       uuid,
  updated_at       timestamptz not null default now(),
  updated_by       uuid,
  foreign key (import_batch_id, org_id) references public.import_batches (id, org_id),
  foreign key (building_id, org_id) references public.buildings (id, org_id),
  foreign key (occupancy_id, org_id) references public.occupancies (id, org_id),
  foreign key (unit_id, org_id) references public.units (id, org_id)
);
create index hiyuvit_items_batch_idx on public.hiyuvit_items (import_batch_id);
create trigger hiyuvit_items_audit before insert or update on public.hiyuvit_items
  for each row execute function public.set_audit_fields();

-- --------------------------------------------------------------------------
-- החזרי מנהל: איזו העברה סוגרת אילו הוצאות (אפיון 04, 7.5)
-- --------------------------------------------------------------------------
create table public.manager_reimbursements (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null default public.default_org_id(),
  transfer_tx_id  uuid not null,
  expense_tx_id   uuid not null,
  amount          numeric(12,2) not null check (amount > 0),
  created_at      timestamptz not null default now(),
  created_by      uuid,
  updated_at      timestamptz not null default now(),
  updated_by      uuid,
  unique (transfer_tx_id, expense_tx_id),
  foreign key (transfer_tx_id, org_id) references public.transactions (id, org_id),
  foreign key (expense_tx_id, org_id) references public.transactions (id, org_id)
);
create trigger manager_reimbursements_audit before insert or update on public.manager_reimbursements
  for each row execute function public.set_audit_fields();

-- --------------------------------------------------------------------------
-- הוצאות קבועות
-- --------------------------------------------------------------------------
create table public.recurring_expenses (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null default public.default_org_id(),
  building_id  uuid not null,
  name         text not null,
  category_id  uuid,
  amount       numeric(12,2) not null check (amount > 0),
  active       boolean not null default true,
  deleted_at   timestamptz,
  deleted_by   uuid,
  created_at   timestamptz not null default now(),
  created_by   uuid,
  updated_at   timestamptz not null default now(),
  updated_by   uuid,
  foreign key (building_id, org_id) references public.buildings (id, org_id),
  foreign key (category_id, org_id) references public.categories (id, org_id)
);
create trigger recurring_expenses_audit before insert or update on public.recurring_expenses
  for each row execute function public.set_audit_fields();

-- --------------------------------------------------------------------------
-- סגירת חודש
-- steps: {"bank": {"done": true, "by": "...", "at": "...", "manual": false}, ...}
-- --------------------------------------------------------------------------
create table public.month_closes (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null default public.default_org_id(),
  building_id  uuid not null,
  month        date not null check (month = date_trunc('month', month)::date),
  steps        jsonb not null default '{}'::jsonb,
  closed_at    timestamptz,
  closed_by    uuid,
  change_reason text,              -- חובה בפתיחה מחדש של חודש סגור
  created_at   timestamptz not null default now(),
  created_by   uuid,
  updated_at   timestamptz not null default now(),
  updated_by   uuid,
  unique (building_id, month),
  foreign key (building_id, org_id) references public.buildings (id, org_id)
);
create trigger month_closes_audit before insert or update on public.month_closes
  for each row execute function public.set_audit_fields();

create or replace function public.is_month_closed(p_building uuid, p_month date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.month_closes
    where building_id = p_building and month = date_trunc('month', p_month)::date and closed_at is not null
  )
$$;

-- פתיחה מחדש של חודש סגור: ליבת הגדרות, ודורשת סיבה (אפיון 13, 2.5)
create or replace function public.guard_month_reopen()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.closed_at is not null and new.closed_at is null then
    if not public.can_core() then
      raise exception 'reopening a closed month requires the main manager' using errcode = '42501';
    end if;
    if new.change_reason is not distinct from old.change_reason or nullif(trim(new.change_reason), '') is null then
      raise exception 'reopening a closed month requires a reason' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
create trigger month_closes_reopen_guard before update on public.month_closes
  for each row execute function public.guard_month_reopen();

-- --------------------------------------------------------------------------
-- שינוי בחודש סגור דורש סיבה (אפיון 04, 6.4)
-- change_reason שלא השתנה מהעדכון הקודם לא נחשב סיבה חדשה
-- --------------------------------------------------------------------------
create or replace function public.guard_closed_month_tx()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_reason_given boolean;
begin
  if tg_op = 'INSERT' then
    v_reason_given := nullif(trim(new.change_reason), '') is not null;
    if public.is_month_closed(new.building_id, new.date) and not v_reason_given then
      raise exception 'month % is closed: a reason is required', to_char(new.date, 'YYYY-MM') using errcode = '23514';
    end if;
  else
    v_reason_given := nullif(trim(new.change_reason), '') is not null
                      and new.change_reason is distinct from old.change_reason;
    -- מחיקה רכה עם סיבת מחיקה נחשבת סיבה
    if new.deleted_at is not null and old.deleted_at is null then
      v_reason_given := true;
    end if;
    if (public.is_month_closed(old.building_id, old.date) or public.is_month_closed(new.building_id, new.date))
       and not v_reason_given then
      raise exception 'month % is closed: a reason is required', to_char(old.date, 'YYYY-MM') using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
create trigger transactions_closed_month_guard before insert or update on public.transactions
  for each row execute function public.guard_closed_month_tx();

-- --------------------------------------------------------------------------
-- העברה = שתי רגליים עם אותו transfer_group_id: יציאה וכניסה באותו סכום,
-- בחשבונות שונים. נבדק בסוף הפעולה (deferred).
-- --------------------------------------------------------------------------
create or replace function public.check_transfer_pair()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_group uuid := coalesce(new.transfer_group_id, old.transfer_group_id);
  v_live integer;
  v_out integer;
  v_in integer;
  v_amounts integer;
  v_accounts integer;
begin
  if v_group is null then
    return null;
  end if;
  select count(*),
         count(*) filter (where direction = 'out'),
         count(*) filter (where direction = 'in'),
         count(distinct amount),
         count(distinct account)
    into v_live, v_out, v_in, v_amounts, v_accounts
  from public.transactions
  where transfer_group_id = v_group and deleted_at is null;

  if v_live = 0 then
    return null;   -- העברה שנמחקה כולה
  end if;
  if not (v_live = 2 and v_out = 1 and v_in = 1 and v_amounts = 1 and v_accounts = 2) then
    raise exception 'transfer % must be exactly one out and one in, same amount, different accounts', v_group
      using errcode = '23514';
  end if;
  return null;
end;
$$;
create constraint trigger transactions_transfer_pair
  after insert or update on public.transactions
  deferrable initially deferred
  for each row execute function public.check_transfer_pair();

-- --------------------------------------------------------------------------
-- יומן שינויים (אפיון 13, 4.3): נכתב רק בטריגר. אין עדכון ואין מחיקה, לאף אחד.
-- --------------------------------------------------------------------------
create table public.audit_log (
  id           bigint generated always as identity primary key,
  org_id       uuid not null,
  at           timestamptz not null default now(),
  user_id      uuid,
  building_id  uuid,
  table_name   text not null,
  record_id    uuid not null,
  action       text not null,       -- insert / update / delete / restore / soft_delete
  before       jsonb,
  after        jsonb,
  reason       text
);
create index audit_log_org_at_idx on public.audit_log (org_id, at desc);
create index audit_log_record_idx on public.audit_log (table_name, record_id);
create index audit_log_building_idx on public.audit_log (building_id, at desc);

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_after  jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row    jsonb := coalesce(v_after, v_before);
  v_action text := lower(tg_op);
  v_reason text;
begin
  if tg_op = 'UPDATE' then
    -- רק שינוי של עמודות תיעוד לא נרשם
    if (v_before - array['updated_at', 'updated_by']) = (v_after - array['updated_at', 'updated_by']) then
      return null;
    end if;
    if (v_before ->> 'deleted_at') is null and (v_after ->> 'deleted_at') is not null then
      v_action := 'soft_delete';
    elsif (v_before ->> 'deleted_at') is not null and (v_after ->> 'deleted_at') is null then
      v_action := 'restore';
    end if;
  end if;

  v_reason := coalesce(
    nullif(v_after ->> 'delete_reason', ''),
    case when tg_op = 'INSERT' or (v_after ->> 'change_reason') is distinct from (v_before ->> 'change_reason')
         then nullif(v_after ->> 'change_reason', '') end,
    nullif(v_after ->> 'undo_reason', ''),
    nullif(v_after ->> 'waive_reason', '')
  );

  insert into public.audit_log (org_id, user_id, building_id, table_name, record_id, action, before, after, reason)
  values (
    (v_row ->> 'org_id')::uuid,
    auth.uid(),
    nullif(v_row ->> 'building_id', '')::uuid,
    tg_table_name,
    (v_row ->> 'id')::uuid,
    v_action,
    v_before,
    v_after,
    v_reason
  );
  return null;
end;
$$;

create trigger transactions_audit_log after insert or update or delete on public.transactions
  for each row execute function public.write_audit_log();
create trigger opening_balances_audit_log after insert or update or delete on public.opening_balances
  for each row execute function public.write_audit_log();
create trigger import_batches_audit_log after insert or update or delete on public.import_batches
  for each row execute function public.write_audit_log();
create trigger month_closes_audit_log after insert or update or delete on public.month_closes
  for each row execute function public.write_audit_log();
create trigger manager_reimbursements_audit_log after insert or update or delete on public.manager_reimbursements
  for each row execute function public.write_audit_log();
create trigger unit_charges_audit_log after insert or update or delete on public.unit_charges
  for each row execute function public.write_audit_log();
create trigger charge_payments_audit_log after insert or update or delete on public.charge_payments
  for each row execute function public.write_audit_log();

-- --------------------------------------------------------------------------
-- יתרות מחושבות (אפיון 13, 4.6). חשבון "מנהל" לא נכלל ביתרת הקופה.
-- --------------------------------------------------------------------------
create or replace function public.balance_as_of(p_building uuid, p_date date default null, p_account text default null)
returns numeric
language sql
stable
set search_path = ''
as $$
  select (
    coalesce((
      select sum(ob.amount) from public.opening_balances ob
      where ob.building_id = p_building
        and (p_account is null or ob.account = p_account)
        and (p_date is null or ob.date <= p_date)
    ), 0)
    +
    coalesce((
      select sum(case when t.direction = 'in' then t.amount else -t.amount end)
      from public.transactions t
      where t.building_id = p_building
        and t.deleted_at is null
        and (case when p_account is null then t.account in ('bank', 'cash') else t.account = p_account end)
        and (p_date is null or t.date <= p_date)
    ), 0)
  )::numeric(12,2)
$$;

create view public.building_balances with (security_invoker = true) as
select
  b.org_id,
  b.id as building_id,
  public.balance_as_of(b.id, null, 'bank') as bank,
  public.balance_as_of(b.id, null, 'cash') as cash,
  public.balance_as_of(b.id, null, null) as total,
  -- כמה הבניין חייב למנהל: הוצאות בחשבון מנהל שלא הוחזרו
  coalesce((
    select sum(case when t.direction = 'out' then t.amount else -t.amount end)
    from public.transactions t
    where t.building_id = b.id and t.account = 'manager' and t.deleted_at is null
  ), 0)::numeric(12,2) as owed_to_manager
from public.buildings b
where b.deleted_at is null;

-- --------------------------------------------------------------------------
-- RLS: תחום "כספים". קטגוריות: צפייה לכל מי שרואה כספים או פניות; עריכה — הגדרות תפעוליות.
-- --------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.import_batches enable row level security;
alter table public.transactions enable row level security;
alter table public.opening_balances enable row level security;
alter table public.hiyuvit_items enable row level security;
alter table public.manager_reimbursements enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.month_closes enable row level security;
alter table public.audit_log enable row level security;

create policy categories_select on public.categories for select to authenticated
  using (org_id = public.current_org() and (public.can('finance', 'view') or public.can('issues', 'view')));
create policy categories_insert on public.categories for insert to authenticated
  with check (org_id = public.current_org() and public.can('ops_settings', 'edit'));
create policy categories_update on public.categories for update to authenticated
  using (org_id = public.current_org() and public.can('ops_settings', 'edit') and not is_fixed)
  with check (org_id = public.current_org() and public.can('ops_settings', 'edit'));

-- טבלאות כספים רגילות: צפייה / עריכה לפי "כספים"
do $$
declare
  t text;
begin
  foreach t in array array['import_batches', 'transactions', 'hiyuvit_items', 'manager_reimbursements', 'recurring_expenses', 'month_closes']
  loop
    execute format(
      'create policy %1$s_select on public.%1$s for select to authenticated using (org_id = public.current_org() and public.can(''finance'', ''view''))', t);
    execute format(
      'create policy %1$s_insert on public.%1$s for insert to authenticated with check (org_id = public.current_org() and public.can(''finance'', ''edit''))', t);
    execute format(
      'create policy %1$s_update on public.%1$s for update to authenticated using (org_id = public.current_org() and public.can(''finance'', ''edit'')) with check (org_id = public.current_org() and public.can(''finance'', ''edit''))', t);
    execute format('grant select, insert, update on public.%I to authenticated', t);
  end loop;
end;
$$;

-- יתרות פתיחה: ליבת הגדרות
create policy opening_balances_select on public.opening_balances for select to authenticated
  using (org_id = public.current_org() and public.can('finance', 'view'));
create policy opening_balances_insert on public.opening_balances for insert to authenticated
  with check (org_id = public.current_org() and public.can_core());
create policy opening_balances_update on public.opening_balances for update to authenticated
  using (org_id = public.current_org() and public.can_core())
  with check (org_id = public.current_org() and public.can_core());

-- יומן שינויים: קריאה בלבד
create policy audit_log_select on public.audit_log for select to authenticated
  using (org_id = public.current_org() and public.can('finance', 'view'));

grant select, insert, update on public.categories to authenticated;
grant select, insert, update on public.opening_balances to authenticated;
grant select on public.audit_log to authenticated;
revoke insert, update, delete, truncate on public.audit_log from authenticated, anon;
grant select on public.building_balances to authenticated;
grant execute on function public.balance_as_of(uuid, date, text) to authenticated;
grant execute on function public.is_month_closed(uuid, date) to authenticated;

-- --------------------------------------------------------------------------
-- Storage: קבצים מקוריים של דו"חות. נתיב: <org_id>/<building_id>/<year>/<file>
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('imports', 'imports', false)
on conflict (id) do nothing;

create policy imports_read on storage.objects for select to authenticated
  using (
    bucket_id = 'imports'
    and (storage.foldername(name))[1] = public.current_org()::text
    and public.can('finance', 'view')
  );
create policy imports_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'imports'
    and (storage.foldername(name))[1] = public.current_org()::text
    and public.can('finance', 'edit')
  );
