-- ==========================================================================
-- בית ומנוחה - פניות: קטגוריות, פניות, הודעות, תמונות וקריאה
-- אפיון 13, נושא 6 (מתרגם את אפיון 02)
-- ==========================================================================

-- מונה מספרי פניות לכל חברה (#47). נקבע בשרת, בלי כפילויות גם במקביל.
alter table public.orgs add column issue_seq integer not null default 0;

create table public.issue_categories (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.default_org_id() references public.orgs (id),
  name        text not null,
  sort_order  integer not null default 0,
  deleted_at  timestamptz,
  deleted_by  uuid,
  created_at  timestamptz not null default now(),
  created_by  uuid,
  updated_at  timestamptz not null default now(),
  updated_by  uuid,
  unique (id, org_id)
);
create unique index issue_categories_name_unique on public.issue_categories (org_id, lower(name)) where deleted_at is null;
create trigger issue_categories_audit before insert or update on public.issue_categories
  for each row execute function public.set_audit_fields();

create table public.issues (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null default public.default_org_id(),
  number                  integer not null default 0,
  building_id             uuid not null,
  title                   text not null check (nullif(trim(title), '') is not null),
  status                  text not null default 'open' check (status in ('open', 'closed')),
  in_progress             boolean not null default false,
  urgent                  boolean not null default false,
  category_id             uuid,
  source                  text check (source in ('manager', 'phone', 'whatsapp', 'email', 'verbal')),
  reported_by_profile_id  uuid references public.profiles (id),
  reported_by_unit_id     uuid,
  reported_by_text        text,
  follow_up_of            uuid,
  expense_tx_id           uuid,
  closed_at               timestamptz,
  closed_by               uuid,
  last_activity_at        timestamptz not null default now(),
  created_at              timestamptz not null default now(),
  created_by              uuid,
  updated_at              timestamptz not null default now(),
  updated_by              uuid,
  unique (id, org_id),
  unique (org_id, number),
  foreign key (building_id, org_id) references public.buildings (id, org_id),
  foreign key (category_id, org_id) references public.issue_categories (id, org_id),
  foreign key (reported_by_unit_id, org_id) references public.units (id, org_id),
  foreign key (follow_up_of, org_id) references public.issues (id, org_id),
  foreign key (expense_tx_id, org_id) references public.transactions (id, org_id),
  constraint issues_closed_consistent check ((status = 'closed') = (closed_at is not null))
);
create index issues_building_idx on public.issues (building_id, status, last_activity_at desc);
create trigger issues_audit before insert or update on public.issues
  for each row execute function public.set_audit_fields();

-- מספר רץ לכל חברה
create or replace function public.assign_issue_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orgs set issue_seq = issue_seq + 1 where id = new.org_id returning issue_seq into new.number;
  return new;
end;
$$;
revoke execute on function public.assign_issue_number() from public, anon, authenticated;
create trigger issues_number before insert on public.issues
  for each row execute function public.assign_issue_number();

-- תנועה מקושרת לפנייה (מיגרציה 3 השאירה את העמודה בלי מפתח זר)
alter table public.transactions
  add constraint transactions_issue_fk foreign key (issue_id, org_id) references public.issues (id, org_id);

-- --------------------------------------------------------------------------
-- הודעות בפנייה: הודעה / אירוע / הערה פנימית
-- --------------------------------------------------------------------------
create table public.issue_messages (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.default_org_id(),
  issue_id    uuid not null,
  author_id   uuid not null default auth.uid() references auth.users (id),
  kind        text not null default 'message' check (kind in ('message', 'event', 'internal_note')),
  text        text not null,
  edited_at   timestamptz,
  created_at  timestamptz not null default now(),
  created_by  uuid,
  updated_at  timestamptz not null default now(),
  updated_by  uuid,
  unique (id, org_id),
  foreign key (issue_id, org_id) references public.issues (id, org_id) on delete cascade
);
create index issue_messages_issue_idx on public.issue_messages (issue_id, created_at);
create trigger issue_messages_audit before insert or update on public.issue_messages
  for each row execute function public.set_audit_fields();

-- עריכת הודעה: רק הטקסט, רק הכותב, ועד 15 דקות. edited_at מתעדכן לבד.
create or replace function public.guard_issue_message_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.issue_id <> old.issue_id or new.author_id <> old.author_id or new.kind <> old.kind or new.created_at <> old.created_at then
    raise exception 'only the message text can be edited' using errcode = '42501';
  end if;
  if old.author_id <> auth.uid() then
    raise exception 'only the author can edit a message' using errcode = '42501';
  end if;
  if old.created_at < now() - interval '15 minutes' then
    raise exception 'a message can be edited only within 15 minutes' using errcode = '42501';
  end if;
  if new.text is distinct from old.text then
    new.edited_at := now();
  end if;
  return new;
end;
$$;
create trigger issue_messages_edit_guard before update on public.issue_messages
  for each row execute function public.guard_issue_message_edit();

-- הודעה חדשה מעדכנת את "פעילות אחרונה" של הפנייה
create or replace function public.touch_issue_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.issues set last_activity_at = new.created_at where id = new.issue_id;
  return null;
end;
$$;
revoke execute on function public.touch_issue_activity() from public, anon, authenticated;
create trigger issue_messages_touch after insert on public.issue_messages
  for each row execute function public.touch_issue_activity();

-- --------------------------------------------------------------------------
-- תמונות (עד 5 להודעה) וקריאה
-- --------------------------------------------------------------------------
create table public.issue_attachments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.default_org_id(),
  message_id  uuid not null,
  file_path   text not null,          -- bucket: issues, נתיב <org>/<building>/<issue>/<file>
  size_bytes  integer,
  purged_at   timestamptz,            -- נמחקה לפי מדיניות השמירה
  created_at  timestamptz not null default now(),
  created_by  uuid default auth.uid(),
  foreign key (message_id, org_id) references public.issue_messages (id, org_id) on delete cascade
);
create index issue_attachments_message_idx on public.issue_attachments (message_id);

create or replace function public.limit_issue_attachments()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.issue_attachments where message_id = new.message_id) >= 5 then
    raise exception 'up to 5 images per message' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger issue_attachments_limit before insert on public.issue_attachments
  for each row execute function public.limit_issue_attachments();

create table public.issue_reads (
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  issue_id      uuid not null references public.issues (id) on delete cascade,
  last_read_at  timestamptz not null default now(),
  primary key (user_id, issue_id)
);

-- --------------------------------------------------------------------------
-- RLS
-- נציג: רק הבניין שלו, ורק עם הרשאת פניות. לא רואה ולא כותב הערות פנימיות או אירועים.
-- --------------------------------------------------------------------------
alter table public.issue_categories enable row level security;
alter table public.issues enable row level security;
alter table public.issue_messages enable row level security;
alter table public.issue_attachments enable row level security;
alter table public.issue_reads enable row level security;

create or replace function public.can_see_issue(p_issue uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.issues i
    where i.id = p_issue
      and i.org_id = public.current_org()
      and public.can('issues', 'view')
      and (public.my_building_id() is null or i.building_id = public.my_building_id())
  )
$$;
revoke execute on function public.can_see_issue(uuid) from public, anon;
grant execute on function public.can_see_issue(uuid) to authenticated;

create policy issue_categories_select on public.issue_categories for select to authenticated
  using (org_id = (select public.current_org()) and (select public.can('issues', 'view')));
create policy issue_categories_insert on public.issue_categories for insert to authenticated
  with check (org_id = (select public.current_org()) and (select public.can('ops_settings', 'edit')));
create policy issue_categories_update on public.issue_categories for update to authenticated
  using (org_id = (select public.current_org()) and (select public.can('ops_settings', 'edit')))
  with check (org_id = (select public.current_org()) and (select public.can('ops_settings', 'edit')));

create policy issues_select on public.issues for select to authenticated
  using (
    org_id = (select public.current_org())
    and (select public.can('issues', 'view'))
    and ((select public.my_building_id()) is null or building_id = (select public.my_building_id()))
  );
create policy issues_insert on public.issues for insert to authenticated
  with check (
    org_id = (select public.current_org())
    and (select public.can('issues', 'edit'))
    and ((select public.my_building_id()) is null or building_id = (select public.my_building_id()))
  );
-- עדכון פנייה (סטטוס, דחיפות, קטגוריה...): המנהל והצוות בלבד. נציג מגיב בהודעות.
create policy issues_update on public.issues for update to authenticated
  using (org_id = (select public.current_org()) and (select public.can('issues', 'edit')) and (select public.my_building_id()) is null)
  with check (org_id = (select public.current_org()) and (select public.can('issues', 'edit')) and (select public.my_building_id()) is null);

create policy issue_messages_select on public.issue_messages for select to authenticated
  using (
    public.can_see_issue(issue_id)
    and (kind = 'message' or (select public.my_building_id()) is null)
  );
create policy issue_messages_insert on public.issue_messages for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.can_see_issue(issue_id)
    and (select public.can('issues', 'edit'))
    and (kind = 'message' or (select public.my_building_id()) is null)
  );
create policy issue_messages_update on public.issue_messages for update to authenticated
  using (author_id = (select auth.uid()) and public.can_see_issue(issue_id))
  with check (author_id = (select auth.uid()) and public.can_see_issue(issue_id));

create policy issue_attachments_select on public.issue_attachments for select to authenticated
  using (exists (select 1 from public.issue_messages m where m.id = message_id));
create policy issue_attachments_insert on public.issue_attachments for insert to authenticated
  with check (exists (select 1 from public.issue_messages m where m.id = message_id and m.author_id = (select auth.uid())));

create policy issue_reads_select on public.issue_reads for select to authenticated
  using (user_id = (select auth.uid()));
create policy issue_reads_insert on public.issue_reads for insert to authenticated
  with check (user_id = (select auth.uid()) and public.can_see_issue(issue_id));
create policy issue_reads_update on public.issue_reads for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.issue_categories to authenticated;
grant select, insert, update on public.issues to authenticated;
grant select, insert, update on public.issue_messages to authenticated;
grant select, insert on public.issue_attachments to authenticated;
grant select, insert, update on public.issue_reads to authenticated;

-- --------------------------------------------------------------------------
-- Storage: תמונות פניות. נתיב <org_id>/<building_id>/<issue_id>/<file>
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('issues', 'issues', false, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy issues_files_read on storage.objects for select to authenticated
  using (
    bucket_id = 'issues'
    and (storage.foldername(name))[1] = (select public.current_org())::text
    and (select public.can('issues', 'view'))
    and ((select public.my_building_id()) is null or (storage.foldername(name))[2] = (select public.my_building_id())::text)
  );
create policy issues_files_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'issues'
    and (storage.foldername(name))[1] = (select public.current_org())::text
    and (select public.can('issues', 'edit'))
    and ((select public.my_building_id()) is null or (storage.foldername(name))[2] = (select public.my_building_id())::text)
  );
