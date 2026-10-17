-- ==========================================================================
-- בית ומנוחה - תיקונים לפי בודק האבטחה והביצועים של Supabase (db advisors)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. אורח (anon) קיבל הרשאת הרצה דרך public. שוללים מ-public ונותנים רק למחובר.
-- --------------------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.current_org()', 'public.can(text, text)', 'public.can_core()', 'public.is_manager()',
    'public.is_platform_admin()', 'public.is_support_session()', 'public.my_building_id()',
    'public.switch_org(uuid)', 'public.default_org_id()', 'public.capture_change_reason(text)',
    'public.check_transfer_group(uuid)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end;
$$;

-- פונקציית ה-"RLS אוטומטי" של Supabase מופעלת מטריגר אירועים, לא ממשתמש
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'rls_auto_enable') then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 2. ביצועים: עטיפת פונקציות ההרשאה ב-(select ...) כדי שיחושבו פעם אחת לשאילתה
--    ולא פעם לכל שורה. נעשה על כל המדיניות הקיימות ב-public וב-storage.
-- --------------------------------------------------------------------------
create or replace function pg_temp.wrap_rls(expr text)
returns text
language plpgsql
as $$
begin
  if expr is null then
    return null;
  end if;
  expr := regexp_replace(expr, '(?<!SELECT )(public\.)?current_org\(\)', '(SELECT public.current_org())', 'g');
  expr := regexp_replace(expr, '(?<!SELECT )(public\.)?can_core\(\)', '(SELECT public.can_core())', 'g');
  expr := regexp_replace(expr, '(?<!SELECT )(public\.)?is_manager\(\)', '(SELECT public.is_manager())', 'g');
  expr := regexp_replace(expr, '(?<!SELECT )(public\.)?is_platform_admin\(\)', '(SELECT public.is_platform_admin())', 'g');
  expr := regexp_replace(expr, '(?<!SELECT )(public\.)?my_building_id\(\)', '(SELECT public.my_building_id())', 'g');
  expr := regexp_replace(expr, '(?<!SELECT )auth\.uid\(\)', '(SELECT auth.uid())', 'g');
  expr := regexp_replace(expr, '(?<![_a-z]|SELECT public\.)(public\.)?can\(([^()]*)\)', '(SELECT public.can(\2))', 'g');
  return expr;
end;
$$;

do $$
declare
  p record;
  v_using text;
  v_check text;
  v_sql text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
       or (schemaname = 'storage' and policyname like 'imports_%')
  loop
    v_using := pg_temp.wrap_rls(p.qual);
    v_check := pg_temp.wrap_rls(p.with_check);
    if v_using is distinct from p.qual or v_check is distinct from p.with_check then
      v_sql := format('alter policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
      if v_using is not null then
        v_sql := v_sql || format(' using (%s)', v_using);
      end if;
      if v_check is not null then
        v_sql := v_sql || format(' with check (%s)', v_check);
      end if;
      execute v_sql;
    end if;
  end loop;
end;
$$;
