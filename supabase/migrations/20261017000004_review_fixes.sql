-- ==========================================================================
-- בית ומנוחה - תיקונים אחרי סקירה של מיגרציות 1–3
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. מנהל יכל לשנות את is_demo של החברה שלו, ובכך לפתוח למפתח גישה בלי אישור
--    ולחסום שליחות. מעכשיו מותר לעדכן רק את שם החברה.
-- --------------------------------------------------------------------------
revoke update on public.orgs from authenticated;
grant update (name) on public.orgs to authenticated;

-- --------------------------------------------------------------------------
-- 2. פונקציות פנימיות לא צריכות להיות זמינות מבחוץ (כברירת מחדל Postgres נותן EXECUTE לכולם).
--    active_support_level חשפה לכל משתמש את רמת הגישה של כל חברה.
-- --------------------------------------------------------------------------
revoke execute on function public.active_support_level(uuid) from public, anon, authenticated;
revoke execute on function public.my_profile() from public, anon;
revoke execute on function public.default_org_id() from public, anon;
revoke execute on function public.set_audit_fields() from public, anon, authenticated;
revoke execute on function public.write_audit_log() from public, anon, authenticated;
revoke execute on function public.check_charge_not_overpaid() from public, anon, authenticated;
revoke execute on function public.check_transfer_pair() from public, anon, authenticated;
revoke execute on function public.guard_month_reopen() from public, anon, authenticated;
revoke execute on function public.guard_closed_month_tx() from public, anon, authenticated;
revoke execute on function public.current_org() from anon;
revoke execute on function public.can(text, text) from anon;
revoke execute on function public.can_core() from anon;
revoke execute on function public.is_manager() from anon;
revoke execute on function public.is_platform_admin() from anon;
revoke execute on function public.is_support_session() from anon;
revoke execute on function public.my_building_id() from anon;
revoke execute on function public.switch_org(uuid) from anon;
revoke execute on function public.dues_rate_for(uuid, date) from public, anon;
revoke execute on function public.balance_as_of(uuid, date, text) from public, anon;
revoke execute on function public.is_month_closed(uuid, date) from public, anon;

-- --------------------------------------------------------------------------
-- 3. בדיקת "לא שולם יותר מהחיוב": הפונקציה פנתה ל-new.charge_id גם כשהופעלה
--    על unit_charges, שאין בה העמודה הזו, ולכן נכשלה בכל עדכון סכום חיוב.
-- --------------------------------------------------------------------------
create or replace function public.check_charge_not_overpaid()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_row jsonb := to_jsonb(new);
  v_charge uuid;
  v_due numeric;
  v_paid numeric;
begin
  v_charge := case when tg_table_name = 'unit_charges' then (v_row ->> 'id')::uuid
                   else (v_row ->> 'charge_id')::uuid end;
  select amount_due into v_due from public.unit_charges where id = v_charge;
  select coalesce(sum(amount), 0) into v_paid from public.charge_payments
    where charge_id = v_charge and deleted_at is null;
  if v_paid > v_due then
    raise exception 'charge % overpaid: paid % > due %', v_charge, v_paid, v_due using errcode = '23514';
  end if;
  return null;
end;
$$;
revoke execute on function public.check_charge_not_overpaid() from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- 4. סיבת שינוי: היא נשמרה בשורה, ולכן עדכון שני עם אותו נוסח ("תיקון") נדחה,
--    וסיבה ישנה יכלה להיראות כאילו ניתנה שוב. מעכשיו הסיבה עוברת ליומן ולא נשמרת
--    בשורה: כל שינוי בחודש סגור דורש סיבה משלו.
-- --------------------------------------------------------------------------
create or replace function public.capture_change_reason(p_reason text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_reason text := nullif(trim(p_reason), '');
begin
  perform set_config('app.change_reason', coalesce(v_reason, ''), true);
  return v_reason;
end;
$$;
revoke execute on function public.capture_change_reason(text) from public, anon, authenticated;

create or replace function public.guard_closed_month_tx()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_reason text;
  v_closed boolean;
begin
  v_reason := public.capture_change_reason(new.change_reason);
  new.change_reason := null;

  if tg_op = 'INSERT' then
    v_closed := public.is_month_closed(new.building_id, new.date);
  else
    v_closed := public.is_month_closed(old.building_id, old.date) or public.is_month_closed(new.building_id, new.date);
    -- מחיקה רכה: סיבת המחיקה היא הסיבה
    if new.deleted_at is not null and old.deleted_at is null then
      v_reason := coalesce(v_reason, nullif(trim(new.delete_reason), ''));
    end if;
  end if;

  if v_closed and v_reason is null then
    raise exception 'month % is closed: a reason is required', to_char(coalesce(old.date, new.date), 'YYYY-MM')
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.guard_month_reopen()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_reason text;
begin
  v_reason := public.capture_change_reason(new.change_reason);
  new.change_reason := null;
  if old.closed_at is not null and new.closed_at is null then
    if not public.can_core() then
      raise exception 'reopening a closed month requires the main manager' using errcode = '42501';
    end if;
    if v_reason is null then
      raise exception 'reopening a closed month requires a reason' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.capture_row_change_reason()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.capture_change_reason(new.change_reason);
  new.change_reason := null;
  return new;
end;
$$;
revoke execute on function public.capture_row_change_reason() from public, anon, authenticated;

create trigger opening_balances_capture_reason before insert or update on public.opening_balances
  for each row execute function public.capture_row_change_reason();

-- היומן לוקח את הסיבה מהטריגר שתפס אותה (רק בטבלאות שיש להן טריגר כזה, כדי
-- שסיבה של שורה אחת לא תידבק לשורה אחרת באותה פעולה)
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
    case when tg_table_name in ('transactions', 'month_closes', 'opening_balances')
         then nullif(current_setting('app.change_reason', true), '') end,
    case when v_action = 'soft_delete' then nullif(v_after ->> 'delete_reason', '') end,
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
revoke execute on function public.write_audit_log() from public, anon, authenticated;

-- --------------------------------------------------------------------------
-- 5. העברה: כשמעבירים תנועה מקבוצת העברה אחת לאחרת, נבדקה רק הקבוצה החדשה.
--    עכשיו נבדקות שתיהן.
-- --------------------------------------------------------------------------
create or replace function public.check_transfer_group(p_group uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_live integer; v_out integer; v_in integer; v_amounts integer; v_accounts integer;
begin
  if p_group is null then
    return;
  end if;
  select count(*), count(*) filter (where direction = 'out'), count(*) filter (where direction = 'in'),
         count(distinct amount), count(distinct account)
    into v_live, v_out, v_in, v_amounts, v_accounts
  from public.transactions
  where transfer_group_id = p_group and deleted_at is null;

  if v_live > 0 and not (v_live = 2 and v_out = 1 and v_in = 1 and v_amounts = 1 and v_accounts = 2) then
    raise exception 'transfer % must be exactly one out and one in, same amount, different accounts', p_group
      using errcode = '23514';
  end if;
end;
$$;
revoke execute on function public.check_transfer_group(uuid) from public, anon, authenticated;

create or replace function public.check_transfer_pair()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.check_transfer_group(new.transfer_group_id);
  if tg_op = 'UPDATE' and old.transfer_group_id is distinct from new.transfer_group_id then
    perform public.check_transfer_group(old.transfer_group_id);
  end if;
  return null;
end;
$$;

-- --------------------------------------------------------------------------
-- 6. יתרת פתיחה: היתרה בתחילת יום הפתיחה. תנועות לפני תאריך הפתיחה כבר כלולות
--    בה, ולכן לא נספרות שוב (אחרת קליטה של היסטוריה ישנה הייתה מכפילה אותן).
--    חשבון בלי יתרת פתיחה: כל התנועות נספרות.
-- --------------------------------------------------------------------------
create or replace function public.balance_as_of(p_building uuid, p_date date default null, p_account text default null)
returns numeric
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(acc.balance), 0)::numeric(12,2)
  from (
    select
      coalesce(case when p_date is null or ob.date <= p_date then ob.amount end, 0)
      + coalesce((
          select sum(case when t.direction = 'in' then t.amount else -t.amount end)
          from public.transactions t
          where t.building_id = p_building
            and t.account = a.account
            and t.deleted_at is null
            and (ob.date is null or t.date >= ob.date)
            and (p_date is null or t.date <= p_date)
        ), 0) as balance
    from (values ('bank'), ('cash')) as a(account)
    left join public.opening_balances ob on ob.building_id = p_building and ob.account = a.account
    where p_account is null or a.account = p_account
  ) acc
$$;
revoke execute on function public.balance_as_of(uuid, date, text) from public, anon;
grant execute on function public.balance_as_of(uuid, date, text) to authenticated;

-- --------------------------------------------------------------------------
-- 7. נציגים ראו את קטגוריות ההוצאה/הכנסה דרך הרשאת הפניות. אין להם צורך בהן.
-- --------------------------------------------------------------------------
drop policy categories_select on public.categories;
create policy categories_select on public.categories for select to authenticated
  using (org_id = public.current_org() and (public.can('finance', 'view') or public.can('ops_settings', 'view')));
