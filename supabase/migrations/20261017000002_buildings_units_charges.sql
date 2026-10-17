-- ==========================================================================
-- בית ומנוחה - בניינים, יחידות, דיירים לפי תקופה, דמי ועד, חיובים ותשלומים
-- אפיון 13, נושא 3 (וחלק מנושא 5: טבלת החיובים המאוחדת)
-- ==========================================================================

create extension if not exists btree_gist with schema extensions;

-- --------------------------------------------------------------------------
-- כלים
-- --------------------------------------------------------------------------

-- כל טבלת-בת מקבלת את החברה מההורה דרך מפתח זר כפול (id, org_id),
-- כך שאי אפשר לקשר רשומה לרשומה של חברה אחרת. org_id ממולא אוטומטית.
create or replace function public.default_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_org()
$$;

-- --------------------------------------------------------------------------
-- בניינים
-- --------------------------------------------------------------------------
create table public.buildings (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null default public.default_org_id() references public.orgs (id),
  name               text not null,
  address            text,
  color_id           text,
  bank_account       text,
  hiyuvit_code       text,
  sort_order         integer not null default 0,
  rep_report_detail  text not null default 'summary' check (rep_report_detail in ('summary', 'debts', 'per_rep')),
  deleted_at         timestamptz,
  deleted_by         uuid,
  delete_reason      text,
  created_at         timestamptz not null default now(),
  created_by         uuid,
  updated_at         timestamptz not null default now(),
  updated_by         uuid,
  unique (id, org_id)
);
create index buildings_org_idx on public.buildings (org_id, sort_order);
create trigger buildings_audit before insert or update on public.buildings
  for each row execute function public.set_audit_fields();

-- הנציג ויחידת הנציג (מיגרציה 1 השאירה את העמודות בלי מפתח זר)
alter table public.profiles
  add constraint profiles_building_fk foreign key (building_id, org_id) references public.buildings (id, org_id);

-- --------------------------------------------------------------------------
-- יחידות (דירה / חנות / מחסן)
-- --------------------------------------------------------------------------
create table public.units (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null default public.default_org_id(),
  building_id       uuid not null,
  unit_type         text not null default 'residential' check (unit_type in ('residential', 'commercial')),
  commercial_label  text check (commercial_label in ('shop', 'storage')),
  number            text not null,
  entrance          text,
  floor             text,
  sort_order        integer not null default 0,
  deleted_at        timestamptz,
  deleted_by        uuid,
  delete_reason     text,
  created_at        timestamptz not null default now(),
  created_by        uuid,
  updated_at        timestamptz not null default now(),
  updated_by        uuid,
  unique (id, org_id),
  foreign key (building_id, org_id) references public.buildings (id, org_id),
  constraint units_commercial_label check ((unit_type = 'commercial') or commercial_label is null)
);
create index units_building_idx on public.units (building_id);
create trigger units_audit before insert or update on public.units
  for each row execute function public.set_audit_fields();

alter table public.profiles
  add constraint profiles_unit_fk foreign key (unit_id, org_id) references public.units (id, org_id);

-- --------------------------------------------------------------------------
-- דייר בתקופה (אפיון 13, 3.5)
-- --------------------------------------------------------------------------
create table public.occupancies (
  id                     uuid primary key default gen_random_uuid(),
  org_id                 uuid not null default public.default_org_id(),
  unit_id                uuid not null,
  tenant_name            text,
  business_name          text,
  occupant_type          text,                 -- בעלים / שוכר
  payment_method         text,
  bank_payer_names       text[] not null default '{}',
  hiyuvit_client_number  text,
  start_date             date not null default current_date,
  end_date               date,
  notes                  text,
  deleted_at             timestamptz,
  deleted_by             uuid,
  delete_reason          text,
  created_at             timestamptz not null default now(),
  created_by             uuid,
  updated_at             timestamptz not null default now(),
  updated_by             uuid,
  unique (id, org_id),
  foreign key (unit_id, org_id) references public.units (id, org_id),
  constraint occupancies_dates check (end_date is null or end_date >= start_date),
  -- דייר פעיל אחד לכל היותר ביחידה בכל רגע נתון
  constraint occupancies_no_overlap exclude using gist (
    unit_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (deleted_at is null)
);
create index occupancies_unit_idx on public.occupancies (unit_id, start_date desc);
create index occupancies_hiyuvit_idx on public.occupancies (org_id, hiyuvit_client_number) where hiyuvit_client_number is not null;
create trigger occupancies_audit before insert or update on public.occupancies
  for each row execute function public.set_audit_fields();

-- טלפונים ומיילים של דייר: רשימה עם תווית ופריט ראשי
create table public.occupant_contacts (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null default public.default_org_id(),
  occupancy_id  uuid not null,
  kind          text not null check (kind in ('phone', 'email')),
  label         text,
  value         text not null,
  is_primary    boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  created_by    uuid,
  updated_at    timestamptz not null default now(),
  updated_by    uuid,
  foreign key (occupancy_id, org_id) references public.occupancies (id, org_id) on delete cascade
);
create index occupant_contacts_occ_idx on public.occupant_contacts (occupancy_id);
create unique index occupant_contacts_one_primary on public.occupant_contacts (occupancy_id, kind) where is_primary;
create trigger occupant_contacts_audit before insert or update on public.occupant_contacts
  for each row execute function public.set_audit_fields();

-- --------------------------------------------------------------------------
-- היסטוריית דמי ועד (אפיון 13, 3.6)
-- --------------------------------------------------------------------------
create table public.unit_dues_rates (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null default public.default_org_id(),
  unit_id          uuid not null,
  amount           numeric(12,2) not null check (amount >= 0),
  effective_month  date not null check (effective_month = date_trunc('month', effective_month)::date),
  created_at       timestamptz not null default now(),
  created_by       uuid,
  updated_at       timestamptz not null default now(),
  updated_by       uuid,
  unique (unit_id, effective_month),
  foreign key (unit_id, org_id) references public.units (id, org_id)
);
create trigger unit_dues_rates_audit before insert or update on public.unit_dues_rates
  for each row execute function public.set_audit_fields();

-- דמי הוועד של יחידה בחודש מסוים
create or replace function public.dues_rate_for(p_unit uuid, p_month date)
returns numeric
language sql
stable
set search_path = ''
as $$
  select r.amount from public.unit_dues_rates r
  where r.unit_id = p_unit and r.effective_month <= date_trunc('month', p_month)::date
  order by r.effective_month desc
  limit 1
$$;

-- --------------------------------------------------------------------------
-- חיובים ותשלומים (אפיון 13, 3.7 ו-5.1)
-- levy_id / payment_plan_id / transaction_id מקבלים מפתח זר במיגרציות הבאות
-- --------------------------------------------------------------------------
create table public.unit_charges (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null default public.default_org_id(),
  unit_id                 uuid not null,
  month                   date not null check (month = date_trunc('month', month)::date),
  kind                    text not null check (kind in ('dues', 'levy', 'plan')),
  levy_id                 uuid,
  payment_plan_id         uuid,
  installment_no          integer,
  occupancy_id            uuid,
  amount_due              numeric(12,2) not null check (amount_due >= 0),
  waived                  boolean not null default false,
  waive_reason            text,
  rescheduled_to_plan_id  uuid,
  deleted_at              timestamptz,
  deleted_by              uuid,
  delete_reason           text,
  created_at              timestamptz not null default now(),
  created_by              uuid,
  updated_at              timestamptz not null default now(),
  updated_by              uuid,
  unique (id, org_id),
  foreign key (unit_id, org_id) references public.units (id, org_id),
  foreign key (occupancy_id, org_id) references public.occupancies (id, org_id),
  constraint unit_charges_kind_refs check (
    (kind = 'dues'  and levy_id is null and payment_plan_id is null) or
    (kind = 'levy'  and levy_id is not null and payment_plan_id is null) or
    (kind = 'plan'  and payment_plan_id is not null and installment_no is not null and levy_id is null)
  ),
  constraint unit_charges_waive_reason check (not waived or waive_reason is not null)
);
create unique index unit_charges_dues_once on public.unit_charges (unit_id, month)
  where kind = 'dues' and deleted_at is null;
create unique index unit_charges_levy_once on public.unit_charges (unit_id, month, levy_id)
  where kind = 'levy' and deleted_at is null;
create unique index unit_charges_plan_once on public.unit_charges (payment_plan_id, installment_no)
  where kind = 'plan' and deleted_at is null;
create index unit_charges_unit_idx on public.unit_charges (unit_id, month);
create index unit_charges_occ_idx on public.unit_charges (occupancy_id);
create trigger unit_charges_audit before insert or update on public.unit_charges
  for each row execute function public.set_audit_fields();

create table public.charge_payments (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null default public.default_org_id(),
  charge_id       uuid not null,
  transaction_id  uuid,
  amount          numeric(12,2) not null check (amount > 0),
  deleted_at      timestamptz,
  deleted_by      uuid,
  created_at      timestamptz not null default now(),
  created_by      uuid,
  updated_at      timestamptz not null default now(),
  updated_by      uuid,
  foreign key (charge_id, org_id) references public.unit_charges (id, org_id)
);
create index charge_payments_charge_idx on public.charge_payments (charge_id);
create index charge_payments_tx_idx on public.charge_payments (transaction_id);
create trigger charge_payments_audit before insert or update on public.charge_payments
  for each row execute function public.set_audit_fields();

-- סך התשלומים על חיוב לא עולה על הסכום לחיוב
create or replace function public.check_charge_not_overpaid()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_charge uuid;
  v_due numeric;
  v_paid numeric;
begin
  v_charge := case when tg_table_name = 'unit_charges' then new.id else new.charge_id end;
  select amount_due into v_due from public.unit_charges where id = v_charge;
  select coalesce(sum(amount), 0) into v_paid from public.charge_payments
    where charge_id = v_charge and deleted_at is null;
  if v_paid > v_due then
    raise exception 'charge % overpaid: paid % > due %', v_charge, v_paid, v_due;
  end if;
  return new;
end;
$$;

create constraint trigger charge_payments_not_overpaid
  after insert or update on public.charge_payments
  deferrable initially deferred
  for each row execute function public.check_charge_not_overpaid();
create constraint trigger unit_charges_not_overpaid
  after update of amount_due on public.unit_charges
  deferrable initially deferred
  for each row execute function public.check_charge_not_overpaid();

-- --------------------------------------------------------------------------
-- חוב מחושב (אפיון 13, 3.7 ו-3.9). security_invoker: ה-RLS של הטבלאות חל
-- --------------------------------------------------------------------------
create view public.unit_charge_balances with (security_invoker = true) as
select
  c.id, c.org_id, c.unit_id, c.month, c.kind, c.levy_id, c.payment_plan_id, c.installment_no,
  c.occupancy_id, c.amount_due, c.waived, c.rescheduled_to_plan_id,
  coalesce(p.paid, 0)::numeric(12,2) as paid,
  case when c.waived or c.rescheduled_to_plan_id is not null then 0
       else greatest(c.amount_due - coalesce(p.paid, 0), 0)
  end::numeric(12,2) as remaining
from public.unit_charges c
left join lateral (
  select sum(cp.amount) as paid from public.charge_payments cp
  where cp.charge_id = c.id and cp.deleted_at is null
) p on true
where c.deleted_at is null;

create view public.unit_debt with (security_invoker = true) as
select
  u.org_id, u.building_id, b.unit_id,
  sum(b.remaining)::numeric(12,2) as total,
  coalesce(sum(b.remaining) filter (where b.kind = 'dues'), 0)::numeric(12,2) as dues,
  coalesce(sum(b.remaining) filter (where b.kind = 'levy'), 0)::numeric(12,2) as levies,
  coalesce(sum(b.remaining) filter (where b.kind = 'plan'), 0)::numeric(12,2) as plans,
  count(*) filter (where b.kind = 'dues' and b.remaining > 0) as dues_months
from public.unit_charge_balances b
join public.units u on u.id = b.unit_id
where b.remaining > 0
group by u.org_id, u.building_id, b.unit_id;

-- --------------------------------------------------------------------------
-- RLS
-- נציג לא ניגש לטבלאות הדיירים והכספים (אפיון 13, 2.3); רואה רק את שם הבניין שלו.
-- אין מחיקה ממשית מהממשק: מחיקה רכה היא update.
-- --------------------------------------------------------------------------
alter table public.buildings enable row level security;
alter table public.units enable row level security;
alter table public.occupancies enable row level security;
alter table public.occupant_contacts enable row level security;
alter table public.unit_dues_rates enable row level security;
alter table public.unit_charges enable row level security;
alter table public.charge_payments enable row level security;

-- בניינים: כל משתמש בחברה רואה (נציג — רק את שלו). הוספה ועדכון — ליבת ההגדרות.
create policy buildings_select on public.buildings for select to authenticated
  using (
    org_id = public.current_org()
    and (public.my_building_id() is null or id = public.my_building_id())
  );
create policy buildings_insert on public.buildings for insert to authenticated
  with check (org_id = public.current_org() and public.can_core());
create policy buildings_update on public.buildings for update to authenticated
  using (org_id = public.current_org() and public.can_core())
  with check (org_id = public.current_org() and public.can_core());

-- יחידות, דיירים, פרטי קשר, דמי ועד: תחום "דירות ודיירים"
create policy units_select on public.units for select to authenticated
  using (org_id = public.current_org() and public.can('tenants', 'view'));
create policy units_insert on public.units for insert to authenticated
  with check (org_id = public.current_org() and public.can('tenants', 'edit'));
create policy units_update on public.units for update to authenticated
  using (org_id = public.current_org() and public.can('tenants', 'edit'))
  with check (org_id = public.current_org() and public.can('tenants', 'edit'));

create policy occupancies_select on public.occupancies for select to authenticated
  using (org_id = public.current_org() and public.can('tenants', 'view'));
create policy occupancies_insert on public.occupancies for insert to authenticated
  with check (org_id = public.current_org() and public.can('tenants', 'edit'));
create policy occupancies_update on public.occupancies for update to authenticated
  using (org_id = public.current_org() and public.can('tenants', 'edit'))
  with check (org_id = public.current_org() and public.can('tenants', 'edit'));

create policy occupant_contacts_select on public.occupant_contacts for select to authenticated
  using (org_id = public.current_org() and public.can('tenants', 'view'));
create policy occupant_contacts_insert on public.occupant_contacts for insert to authenticated
  with check (org_id = public.current_org() and public.can('tenants', 'edit'));
create policy occupant_contacts_update on public.occupant_contacts for update to authenticated
  using (org_id = public.current_org() and public.can('tenants', 'edit'))
  with check (org_id = public.current_org() and public.can('tenants', 'edit'));
-- פרט קשר הוא רשימה פשוטה: מותר למחוק פריט (אין לו היסטוריה כספית)
create policy occupant_contacts_delete on public.occupant_contacts for delete to authenticated
  using (org_id = public.current_org() and public.can('tenants', 'edit'));

create policy unit_dues_rates_select on public.unit_dues_rates for select to authenticated
  using (org_id = public.current_org() and (public.can('tenants', 'view') or public.can('finance', 'view')));
create policy unit_dues_rates_insert on public.unit_dues_rates for insert to authenticated
  with check (org_id = public.current_org() and public.can('tenants', 'edit'));
create policy unit_dues_rates_update on public.unit_dues_rates for update to authenticated
  using (org_id = public.current_org() and public.can('tenants', 'edit'))
  with check (org_id = public.current_org() and public.can('tenants', 'edit'));

-- חיובים ותשלומים: תחום "כספים" (צפייה גם למי שרואה דיירים, לחוב בחלונית הדירה)
create policy unit_charges_select on public.unit_charges for select to authenticated
  using (org_id = public.current_org() and (public.can('finance', 'view') or public.can('tenants', 'view')));
create policy unit_charges_insert on public.unit_charges for insert to authenticated
  with check (org_id = public.current_org() and public.can('finance', 'edit'));
create policy unit_charges_update on public.unit_charges for update to authenticated
  using (org_id = public.current_org() and public.can('finance', 'edit'))
  with check (org_id = public.current_org() and public.can('finance', 'edit'));

create policy charge_payments_select on public.charge_payments for select to authenticated
  using (org_id = public.current_org() and (public.can('finance', 'view') or public.can('tenants', 'view')));
create policy charge_payments_insert on public.charge_payments for insert to authenticated
  with check (org_id = public.current_org() and public.can('finance', 'edit'));
create policy charge_payments_update on public.charge_payments for update to authenticated
  using (org_id = public.current_org() and public.can('finance', 'edit'))
  with check (org_id = public.current_org() and public.can('finance', 'edit'));

-- --------------------------------------------------------------------------
-- הרשאות טבלה מפורשות
-- --------------------------------------------------------------------------
grant select, insert, update on public.buildings to authenticated;
grant select, insert, update on public.units to authenticated;
grant select, insert, update on public.occupancies to authenticated;
grant select, insert, update, delete on public.occupant_contacts to authenticated;
grant select, insert, update on public.unit_dues_rates to authenticated;
grant select, insert, update on public.unit_charges to authenticated;
grant select, insert, update on public.charge_payments to authenticated;
grant select on public.unit_charge_balances to authenticated;
grant select on public.unit_debt to authenticated;
grant execute on function public.dues_rate_for(uuid, date) to authenticated;
