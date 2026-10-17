-- ==========================================================================
-- בית ומנוחה - בסיס: חברות, משתמשים, מפתח, גישת תמיכה ופונקציות הרשאה
-- אפיון 13, נושאים 1 ו-2
-- ==========================================================================

-- --------------------------------------------------------------------------
-- כלים כלליים
-- --------------------------------------------------------------------------

-- created_by / updated_at / updated_by מתעדכנים במסד ולא בקוד המסך (אפיון 13, 1.3)
create or replace function public.set_audit_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- חברות
-- --------------------------------------------------------------------------
create table public.orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  created_by  uuid,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

create trigger orgs_audit before insert or update on public.orgs
  for each row execute function public.set_audit_fields();

-- --------------------------------------------------------------------------
-- משתמשי חברה (מנהל, נציג, איש צוות)
-- --------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  org_id       uuid not null references public.orgs (id),
  role         text not null check (role in ('manager', 'representative', 'staff')),
  full_name    text not null,
  username     text not null check (username ~ '^[a-z0-9.]+$'),
  phone        text,
  email        text,
  job_title    text,                       -- איש צוות: "מזכירה" וכו'
  building_id  uuid,                       -- FK נוסף במיגרציית הבניינים
  unit_id      uuid,                       -- FK נוסף במיגרציית היחידות
  permissions  jsonb not null default '{}'::jsonb,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  created_by   uuid,
  updated_at   timestamptz not null default now(),
  updated_by   uuid,
  -- נציג חייב בניין, ולאחרים אסור (אפיון 13, 2.2)
  constraint profiles_building_by_role check (
    (role = 'representative') = (building_id is not null)
  )
);

-- שם משתמש ייחודי בכל המערכת
create unique index profiles_username_key on public.profiles (lower(username));
-- מנהל ראשי אחד לכל חברה
create unique index profiles_one_manager_per_org on public.profiles (org_id) where role = 'manager';
create index profiles_org_idx on public.profiles (org_id);

create trigger profiles_audit before insert or update on public.profiles
  for each row execute function public.set_audit_fields();

-- --------------------------------------------------------------------------
-- המפתח (לא משתמש של אף חברה) וגישת תמיכה (אפיון 13, 2.6)
-- --------------------------------------------------------------------------
create table public.platform_admins (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  active_org_id  uuid references public.orgs (id),
  created_at     timestamptz not null default now()
);

create table public.support_grants (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs (id),
  level       text not null check (level in ('read', 'write')),
  expires_at  timestamptz,                 -- ריק = עד שהמנהל יכבה
  granted_by  uuid not null default auth.uid() references auth.users (id),
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);
create index support_grants_org_idx on public.support_grants (org_id);

create table public.support_access_log (
  id       uuid primary key default gen_random_uuid(),
  org_id   uuid not null references public.orgs (id),
  user_id  uuid not null references auth.users (id),
  at       timestamptz not null default now()
);
create index support_access_log_org_idx on public.support_access_log (org_id, at desc);

-- --------------------------------------------------------------------------
-- פונקציות הרשאה. כל מדיניות RLS נשענת עליהן (אפיון 13, 2.7)
-- --------------------------------------------------------------------------

-- הפרופיל הפעיל של המשתמש המחובר (null למפתח, למשתמש מושבת או לאורח)
create or replace function public.my_profile()
returns public.profiles
language sql
stable
security definer
set search_path = ''
as $$
  select p.* from public.profiles p
  where p.id = auth.uid() and p.active
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid())
$$;

-- אישור תמיכה תקף לחברה, אם יש
create or replace function public.active_support_level(p_org uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select g.level from public.support_grants g
  where g.org_id = p_org
    and g.revoked_at is null
    and (g.expires_at is null or g.expires_at > now())
  order by (g.level = 'write') desc
  limit 1
$$;

-- החברה שהמשתמש המחובר רשאי לראות כרגע.
-- משתמש חברה: החברה שלו. מפתח: החברה שבחר, רק אם היא דמו או שיש לה אישור תקף.
create or replace function public.current_org()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select org_id into v_org from public.profiles where id = auth.uid() and active;
  if v_org is not null then
    return v_org;
  end if;

  select pa.active_org_id into v_org
  from public.platform_admins pa
  join public.orgs o on o.id = pa.active_org_id
  where pa.user_id = auth.uid()
    and (o.is_demo or public.active_support_level(o.id) is not null);
  return v_org;
end;
$$;

-- המפתח בתוך חברה אמיתית (לא דמו)
create or replace function public.is_support_session()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin()
     and not coalesce((select is_demo from public.orgs where id = public.current_org()), true)
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((public.my_profile()).role = 'manager', false)
$$;

create or replace function public.my_building_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select (public.my_profile()).building_id
$$;

-- ליבת ההגדרות: מנהל ראשי בלבד. המפתח רק בדמו (אפיון 13, 2.5–2.6)
create or replace function public.can_core()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_manager()
      or (public.is_platform_admin() and coalesce((select is_demo from public.orgs where id = public.current_org()), false))
$$;

-- הרשאה לתחום. p_level: 'view' או 'edit'.
-- תחומים: finance, tenants, issues, notices, reports, ops_settings, users
create or replace function public.can(p_area text, p_level text default 'view')
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_org uuid;
  v_grant text;
  v_perm text;
begin
  v_org := public.current_org();
  if v_org is null then
    return false;
  end if;

  -- המפתח
  if public.is_platform_admin() and not exists (select 1 from public.profiles where id = auth.uid()) then
    if (select is_demo from public.orgs where id = v_org) then
      return true;
    end if;
    v_grant := public.active_support_level(v_org);
    return v_grant = 'write' or (v_grant = 'read' and p_level = 'view');
  end if;

  v_profile := public.my_profile();
  if v_profile.id is null then
    return false;
  end if;

  if v_profile.role = 'manager' then
    return true;
  end if;

  if v_profile.role = 'staff' then
    v_perm := v_profile.permissions ->> p_area;
    return v_perm = 'edit' or (v_perm = 'view' and p_level = 'view');
  end if;

  -- נציג: פניות (צפייה ועריכה בבניין שלו), ודוחות (צפייה בלבד)
  if v_profile.role = 'representative' then
    if p_area = 'issues' then
      return coalesce((v_profile.permissions ->> 'issues')::boolean, true);
    end if;
    if p_area = 'reports' and p_level = 'view' then
      return coalesce((v_profile.permissions ->> 'reports_view')::boolean, false);
    end if;
  end if;

  return false;
end;
$$;

-- מעבר חברה של המפתח. נרשם ביומן כשנכנסים לחברה אמיתית.
create or replace function public.switch_org(p_org uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_demo boolean;
begin
  if not public.is_platform_admin() then
    raise exception 'not allowed';
  end if;

  select is_demo into v_is_demo from public.orgs where id = p_org;
  if v_is_demo is null then
    raise exception 'org not found';
  end if;
  if not v_is_demo and public.active_support_level(p_org) is null then
    raise exception 'no support access to this org';
  end if;

  update public.platform_admins set active_org_id = p_org where user_id = auth.uid();

  if not v_is_demo then
    insert into public.support_access_log (org_id, user_id) values (p_org, auth.uid());
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.orgs enable row level security;
alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.support_grants enable row level security;
alter table public.support_access_log enable row level security;

-- חברות: החברה הנוכחית. המפתח רואה את רשימת כל החברות (לבורר החברה)
create policy orgs_select on public.orgs for select to authenticated
  using (id = public.current_org() or public.is_platform_admin());
create policy orgs_update on public.orgs for update to authenticated
  using (id = public.current_org() and public.can_core())
  with check (id = public.current_org() and public.can_core());

-- משתמשים: הכל למי שמנהל משתמשים; לשאר — עצמו, המנהל, ונציגי הבניין שלו.
-- יצירה ועדכון רק בפונקציית שרת (service role), לכן אין מדיניות כתיבה.
create policy profiles_select on public.profiles for select to authenticated
  using (
    org_id = public.current_org()
    and (
      public.can('users', 'view')
      or id = auth.uid()
      or role = 'manager'
      or (building_id is not null and building_id = public.my_building_id())
    )
  );

create policy platform_admins_select on public.platform_admins for select to authenticated
  using (user_id = auth.uid());

-- אישורי תמיכה: המנהל של החברה מנהל אותם; המפתח קורא את כולם
create policy support_grants_select on public.support_grants for select to authenticated
  using ((org_id = public.current_org() and public.is_manager()) or public.is_platform_admin());
create policy support_grants_insert on public.support_grants for insert to authenticated
  with check (org_id = public.current_org() and public.is_manager());
create policy support_grants_update on public.support_grants for update to authenticated
  using (org_id = public.current_org() and public.is_manager())
  with check (org_id = public.current_org() and public.is_manager());

create policy support_access_log_select on public.support_access_log for select to authenticated
  using (org_id = public.current_org() and public.is_manager());

-- --------------------------------------------------------------------------
-- הרשאות טבלה מפורשות (טבלאות לא נחשפות אוטומטית בפרויקט הזה)
-- --------------------------------------------------------------------------
grant select, update on public.orgs to authenticated;
grant select on public.profiles to authenticated;
grant select on public.platform_admins to authenticated;
grant select, insert, update on public.support_grants to authenticated;
grant select on public.support_access_log to authenticated;

revoke all on function public.switch_org(uuid) from public, anon;
grant execute on function public.switch_org(uuid) to authenticated;
grant execute on function public.current_org() to authenticated;
grant execute on function public.can(text, text) to authenticated;
grant execute on function public.can_core() to authenticated;
grant execute on function public.is_manager() to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_support_session() to authenticated;
grant execute on function public.my_building_id() to authenticated;
