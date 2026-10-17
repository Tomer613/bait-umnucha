-- ==========================================================================
-- בית ומנוחה - גביות מיוחדות ופריסות חוב
-- אפיון 13, נושא 5 (מתרגם את אפיונים 05 ו-07)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- גביות מיוחדות
-- --------------------------------------------------------------------------
create table public.special_levies (
  id                          uuid primary key default gen_random_uuid(),
  org_id                      uuid not null default public.default_org_id(),
  building_id                 uuid not null,
  name                        text not null,
  purpose                     text,
  mode                        text not null check (mode in ('one_time', 'monthly')),
  amount_per_unit             numeric(12,2) not null check (amount_per_unit >= 0),
  amount_per_commercial_unit  numeric(12,2) check (amount_per_commercial_unit >= 0),
  start_month                 date not null check (start_month = date_trunc('month', start_month)::date),
  installments                integer check (installments > 0),     -- ריק = גבייה פתוחה
  includes_commercial         boolean not null default false,
  status                      text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  origin                      text not null default 'manual' check (origin in ('manual', 'auto_detected')),
  deleted_at                  timestamptz,
  deleted_by                  uuid,
  delete_reason               text,
  created_at                  timestamptz not null default now(),
  created_by                  uuid,
  updated_at                  timestamptz not null default now(),
  updated_by                  uuid,
  unique (id, org_id),
  foreign key (building_id, org_id) references public.buildings (id, org_id),
  constraint special_levies_one_time_single check (mode = 'monthly' or installments is null or installments = 1)
);
create index special_levies_building_idx on public.special_levies (building_id, status);
create trigger special_levies_audit before insert or update on public.special_levies
  for each row execute function public.set_audit_fields();

-- יחידות שלא משתתפות בגבייה
create table public.levy_exclusions (
  org_id      uuid not null default public.default_org_id(),
  levy_id     uuid not null,
  unit_id     uuid not null,
  created_at  timestamptz not null default now(),
  created_by  uuid default auth.uid(),
  primary key (levy_id, unit_id),
  foreign key (levy_id, org_id) references public.special_levies (id, org_id) on delete cascade,
  foreign key (unit_id, org_id) references public.units (id, org_id)
);

-- --------------------------------------------------------------------------
-- פריסות חוב
-- receivable: דייר חייב לבניין (unit_id חובה). payable: הבניין חייב לספק (counterparty_name חובה).
-- --------------------------------------------------------------------------
create table public.payment_plans (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null default public.default_org_id(),
  building_id        uuid not null,
  direction          text not null check (direction in ('receivable', 'payable')),
  unit_id            uuid,
  occupancy_id       uuid,
  counterparty_name  text,
  purpose            text,
  total_amount       numeric(12,2) not null check (total_amount > 0),
  method             text check (method in ('checks', 'standing_order', 'transfer', 'cash', 'hiyuvit')),
  category_id        uuid,
  status             text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  notes              text,
  deleted_at         timestamptz,
  deleted_by         uuid,
  delete_reason      text,
  created_at         timestamptz not null default now(),
  created_by         uuid,
  updated_at         timestamptz not null default now(),
  updated_by         uuid,
  unique (id, org_id),
  foreign key (building_id, org_id) references public.buildings (id, org_id),
  foreign key (unit_id, org_id) references public.units (id, org_id),
  foreign key (occupancy_id, org_id) references public.occupancies (id, org_id),
  foreign key (category_id, org_id) references public.categories (id, org_id),
  constraint payment_plans_counterparty check (
    (direction = 'receivable' and unit_id is not null) or
    (direction = 'payable' and nullif(trim(counterparty_name), '') is not null)
  )
);
create index payment_plans_building_idx on public.payment_plans (building_id, status);
create trigger payment_plans_audit before insert or update on public.payment_plans
  for each row execute function public.set_audit_fields();

create table public.plan_installments (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null default public.default_org_id(),
  plan_id         uuid not null,
  n               integer not null check (n > 0),
  due_date        date not null,
  amount          numeric(12,2) not null check (amount > 0),
  check_number    text,
  status          text not null default 'pending' check (status in ('pending', 'paid', 'late', 'cancelled')),
  transaction_id  uuid,
  created_at      timestamptz not null default now(),
  created_by      uuid,
  updated_at      timestamptz not null default now(),
  updated_by      uuid,
  unique (plan_id, n),
  foreign key (plan_id, org_id) references public.payment_plans (id, org_id),
  foreign key (transaction_id, org_id) references public.transactions (id, org_id)
);
create index plan_installments_due_idx on public.plan_installments (due_date) where status = 'pending';
create trigger plan_installments_audit before insert or update on public.plan_installments
  for each row execute function public.set_audit_fields();

-- --------------------------------------------------------------------------
-- מפתחות זרים שהושארו פתוחים במיגרציות 2–3
-- --------------------------------------------------------------------------
alter table public.unit_charges
  add constraint unit_charges_levy_fk foreign key (levy_id, org_id) references public.special_levies (id, org_id),
  add constraint unit_charges_plan_fk foreign key (payment_plan_id, org_id) references public.payment_plans (id, org_id),
  add constraint unit_charges_rescheduled_fk foreign key (rescheduled_to_plan_id, org_id) references public.payment_plans (id, org_id);

alter table public.transactions
  add constraint transactions_levy_fk foreign key (levy_id, org_id) references public.special_levies (id, org_id),
  add constraint transactions_plan_fk foreign key (payment_plan_id, org_id) references public.payment_plans (id, org_id);

alter table public.hiyuvit_items
  add constraint hiyuvit_items_levy_fk foreign key (levy_id, org_id) references public.special_levies (id, org_id);

-- --------------------------------------------------------------------------
-- יומן שינויים
-- --------------------------------------------------------------------------
create trigger special_levies_audit_log after insert or update or delete on public.special_levies
  for each row execute function public.write_audit_log();
create trigger payment_plans_audit_log after insert or update or delete on public.payment_plans
  for each row execute function public.write_audit_log();
create trigger plan_installments_audit_log after insert or update or delete on public.plan_installments
  for each row execute function public.write_audit_log();

-- --------------------------------------------------------------------------
-- RLS: תחום "כספים"
-- --------------------------------------------------------------------------
alter table public.special_levies enable row level security;
alter table public.levy_exclusions enable row level security;
alter table public.payment_plans enable row level security;
alter table public.plan_installments enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['special_levies', 'levy_exclusions', 'payment_plans', 'plan_installments']
  loop
    execute format(
      'create policy %1$s_select on public.%1$s for select to authenticated using (org_id = (select public.current_org()) and (select public.can(''finance'', ''view'')))', t);
    execute format(
      'create policy %1$s_insert on public.%1$s for insert to authenticated with check (org_id = (select public.current_org()) and (select public.can(''finance'', ''edit'')))', t);
    execute format(
      'create policy %1$s_update on public.%1$s for update to authenticated using (org_id = (select public.current_org()) and (select public.can(''finance'', ''edit''))) with check (org_id = (select public.current_org()) and (select public.can(''finance'', ''edit'')))', t);
    execute format('grant select, insert, update on public.%I to authenticated', t);
  end loop;
end;
$$;

-- החרגת יחידה מגבייה היא רשימה פשוטה: מותר להסיר
create policy levy_exclusions_delete on public.levy_exclusions for delete to authenticated
  using (org_id = (select public.current_org()) and (select public.can('finance', 'edit')));
grant delete on public.levy_exclusions to authenticated;
