-- ==========================================================================
-- בדיקת עשן לכללים שמסד הנתונים אוכף (docs/specs/14-db-rules.md)
-- הרצה: npx supabase db query --linked -f supabase/tests/smoke_rules.sql
-- הכל רץ בבלוק אחד שמסתיים בשגיאה מכוונת, ולכן שום נתון לא נשמר.
-- התוצאות מופיעות בהודעת השגיאה: PASS / FAIL לכל בדיקה.
-- ==========================================================================
do $test$
declare
  r text := '';
  v_org_a uuid := gen_random_uuid();
  v_org_d uuid := gen_random_uuid();
  v_mgr uuid := gen_random_uuid();
  v_rep uuid := gen_random_uuid();
  v_dev uuid := gen_random_uuid();
  v_b1 uuid := gen_random_uuid();
  v_bd uuid := gen_random_uuid();
  v_u1 uuid := gen_random_uuid();
  v_occ uuid := gen_random_uuid();
  v_charge uuid := gen_random_uuid();
  v_tx uuid := gen_random_uuid();
  v_grp uuid := gen_random_uuid();
  v_issue uuid := gen_random_uuid();
  v_msg uuid := gen_random_uuid();
  v_msg2 uuid := gen_random_uuid();
  v_cat uuid := gen_random_uuid();
  v_tpl uuid := gen_random_uuid();
  v_comm uuid := gen_random_uuid();
  i integer;
  v_n integer;
  v_num numeric;
  v_ok boolean;
begin
  -- ---------------- הכנה (כבעלים) ----------------
  insert into auth.users (id, email) values (v_mgr, 'mgr@test.local'), (v_rep, 'rep@test.local'), (v_dev, 'dev@test.local');
  insert into public.orgs (id, name, is_demo) values (v_org_a, 'Test Real', false), (v_org_d, 'Test Demo', true);
  insert into public.buildings (id, org_id, name) values (v_b1, v_org_a, 'B1'), (v_bd, v_org_d, 'Demo B');
  insert into public.profiles (id, org_id, role, full_name, username) values (v_mgr, v_org_a, 'manager', 'Mgr', 'zz.test.mgr');
  insert into public.profiles (id, org_id, role, full_name, username, building_id) values (v_rep, v_org_a, 'representative', 'Rep', 'zz.test.rep', v_b1);
  insert into public.platform_admins (user_id) values (v_dev);
  insert into public.units (id, org_id, building_id, number) values (v_u1, v_org_a, v_b1, '6');
  insert into public.occupancies (id, org_id, unit_id, tenant_name, start_date) values (v_occ, v_org_a, v_u1, 'Tenant', '2026-01-01');
  insert into public.unit_charges (id, org_id, unit_id, month, kind, amount_due, occupancy_id) values (v_charge, v_org_a, v_u1, '2026-07-01', 'dues', 370, v_occ);

  -- ---------------- מנהל ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', v_mgr, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_n from public.buildings;
  r := r || E'\n' || E'\n' || format('1.1 manager sees only own org buildings (1): %s', case when v_n = 1 then 'PASS' else 'FAIL ' || v_n end);

  begin
    update public.orgs set is_demo = true where id = v_org_a;
    r := r || E'\n' || E'\n' || 'fix#1 manager cannot flip is_demo: FAIL';
  exception when others then
    r := r || E'\n' || E'\n' || 'fix#1 manager cannot flip is_demo: PASS';
  end;

  insert into public.transactions (id, building_id, account, date, direction, amount, source, description)
  values (v_tx, v_b1, 'bank', '2026-07-10', 'out', 100, 'manual', 'test');
  r := r || E'\n' || E'\n' || '3.x manager inserts transaction (org_id auto-filled): PASS';

  insert into public.month_closes (building_id, month, closed_at) values (v_b1, '2026-07-01', now());
  begin
    update public.transactions set amount = 150 where id = v_tx;
    r := r || E'\n' || E'\n' || '3.8 closed month edit without reason rejected: FAIL';
  exception when others then
    r := r || E'\n' || E'\n' || '3.8 closed month edit without reason rejected: PASS';
  end;
  begin
    update public.transactions set amount = 150, change_reason = 'תיקון' where id = v_tx;
    update public.transactions set amount = 160, change_reason = 'תיקון' where id = v_tx;
    r := r || E'\n' || E'\n' || 'fix#4 closed month edit with same reason twice allowed: PASS';
  exception when others then
    r := r || E'\n' || E'\n' || 'fix#4 closed month edit with same reason twice allowed: FAIL ' || sqlerrm;
  end;

  select count(*) into v_n from public.audit_log where record_id = v_tx and reason = 'תיקון';
  r := r || E'\n' || E'\n' || format('3.16 audit log recorded both edits with reason (2): %s', case when v_n = 2 then 'PASS' else 'FAIL ' || v_n end);

  begin
    delete from public.audit_log where record_id = v_tx;
    get diagnostics v_n = row_count;
    r := r || E'\n' || E'\n' || format('3.17 audit log cannot be deleted: %s', case when v_n = 0 then 'PASS' else 'FAIL' end);
  exception when others then
    r := r || E'\n' || E'\n' || '3.17 audit log cannot be deleted: PASS';
  end;

  begin
    update public.transactions set deleted_at = now() where id = v_tx;
    r := r || E'\n' || E'\n' || '3.7 soft delete without reason rejected: FAIL';
  exception when others then
    r := r || E'\n' || E'\n' || '3.7 soft delete without reason rejected: PASS';
  end;

  -- תשלום יתר
  begin
    set constraints all immediate;
    insert into public.charge_payments (charge_id, amount) values (v_charge, 400);
    r := r || E'\n' || E'\n' || '2.15 overpayment rejected: FAIL';
  exception when others then
    r := r || E'\n' || E'\n' || '2.15 overpayment rejected: PASS';
  end;
  begin
    set constraints all immediate;
    insert into public.charge_payments (charge_id, amount) values (v_charge, 200);
    update public.unit_charges set amount_due = 150 where id = v_charge;
    r := r || E'\n' || E'\n' || 'fix#3 lowering due below paid rejected: FAIL';
  exception when others then
    r := r || E'\n' || E'\n' || format('fix#3 lowering due below paid rejected: %s', case when sqlerrm like '%overpaid%' then 'PASS' else 'FAIL ' || sqlerrm end);
  end;

  select remaining into v_num from public.unit_charge_balances where id = v_charge;
  r := r || E'\n' || E'\n' || format('2.16 remaining debt computed (370): %s', case when v_num = 370 then 'PASS' else 'FAIL ' || v_num end);

  -- העברה עם רגל אחת
  begin
    set constraints all immediate;
    insert into public.transactions (building_id, account, date, direction, amount, source, transfer_group_id)
    values (v_b1, 'cash', '2026-08-05', 'out', 500, 'manual', v_grp);
    r := r || E'\n' || E'\n' || '3.10 single-leg transfer rejected: FAIL';
  exception when others then
    r := r || E'\n' || E'\n' || '3.10 single-leg transfer rejected: PASS';
  end;
  begin
    set constraints all immediate;
    insert into public.transactions (building_id, account, date, direction, amount, source, transfer_group_id) values
      (v_b1, 'cash', '2026-08-05', 'out', 500, 'manual', v_grp),
      (v_b1, 'bank', '2026-08-05', 'in', 500, 'manual', v_grp);
    r := r || E'\n' || E'\n' || '3.10 two-leg transfer accepted: PASS';
  exception when others then
    r := r || E'\n' || E'\n' || '3.10 two-leg transfer accepted: FAIL ' || sqlerrm;
  end;

  -- חפיפת דיירים
  begin
    insert into public.occupancies (unit_id, tenant_name, start_date) values (v_u1, 'Second', '2026-05-01');
    r := r || E'\n' || E'\n' || '2.7 overlapping occupancy rejected: FAIL';
  exception when others then
    r := r || E'\n' || E'\n' || '2.7 overlapping occupancy rejected: PASS';
  end;

  -- יתרה: פתיחה 1000 ב-1.8. תנועת יולי (160-) לפניה לא נספרת. ההעברה (500) נטו 0.
  insert into public.opening_balances (building_id, account, date, amount) values (v_b1, 'bank', '2026-08-01', 1000);
  select public.balance_as_of(v_b1) into v_num;
  r := r || E'\n' || E'\n' || format('fix#6 balance ignores tx before opening date (1000): %s', case when v_num = 1000 then 'PASS' else 'FAIL ' || v_num end);

  -- פריסת חוב לספק בלי שם ספק
  begin
    insert into public.payment_plans (building_id, direction, total_amount) values (v_b1, 'payable', 3900);
    r := r || E'\n' || '5.x payable plan without counterparty rejected: FAIL';
  exception when others then
    r := r || E'\n' || '5.x payable plan without counterparty rejected: PASS';
  end;

  -- פניות: מספר רץ, הערה פנימית ואירוע
  insert into public.issues (id, building_id, title) values (v_issue, v_b1, 'נזילה');
  insert into public.issues (building_id, title) values (v_b1, 'מעלית');
  select max(number) into v_n from public.issues where org_id = v_org_a;
  r := r || E'\n' || format('6.x issue numbers run per org (2): %s', case when v_n = 2 then 'PASS' else 'FAIL ' || v_n end);
  insert into public.issue_messages (issue_id, kind, text) values
    (v_issue, 'message', 'שלום'), (v_issue, 'internal_note', 'פנימי'), (v_issue, 'event', 'הפנייה בטיפול');

  -- הגדרות, תבניות ותקשורת
  insert into public.categories (id, direction, name) values (v_cat, 'out', 'תחזוקה שוטפת');
  insert into public.system_settings (org_id, default_expense_category_id) values (v_org_a, v_cat);
  begin
    update public.categories set deleted_at = now() where id = v_cat;
    r := r || E'\n' || '7.x default expense category cannot be deleted: FAIL';
  exception when others then
    r := r || E'\n' || '7.x default expense category cannot be deleted: PASS';
  end;
  insert into public.notice_templates (id, name, title, body) values (v_tpl, 'התראה', 't', 'v0');
  for i in 1..7 loop
    update public.notice_templates set body = 'v' || i where id = v_tpl;
  end loop;
  select count(*) into v_n from public.notice_template_versions where template_id = v_tpl;
  r := r || E'\n' || format('7.x template keeps last 5 versions (5): %s', case when v_n = 5 then 'PASS' else 'FAIL ' || v_n end);
  insert into public.communications (id, building_id, occupancy_id, channel, final_body, status)
  values (v_comm, v_b1, v_occ, 'whatsapp', 'שלום', 'opened_unconfirmed');
  update public.communications set status = 'sent' where id = v_comm;
  r := r || E'\n' || '7.x communication status can be confirmed: PASS';
  begin
    update public.communications set final_body = 'אחר' where id = v_comm;
    r := r || E'\n' || '7.x sent communication content cannot change: FAIL';
  exception when others then
    r := r || E'\n' || '7.x sent communication content cannot change: PASS';
  end;

  -- אישור תמיכה לקריאה
  insert into public.support_grants (org_id, level, expires_at) values (v_org_a, 'read', now() + interval '1 day');

  -- ---------------- נציג ----------------
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', v_rep, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_n from public.buildings;
  r := r || E'\n' || E'\n' || format('2.1 rep sees only own building (1): %s', case when v_n = 1 then 'PASS' else 'FAIL ' || v_n end);
  select count(*) into v_n from public.units;
  r := r || E'\n' || E'\n' || format('2.2 rep sees no units (0): %s', case when v_n = 0 then 'PASS' else 'FAIL ' || v_n end);
  select count(*) into v_n from public.transactions;
  r := r || E'\n' || E'\n' || format('3.1 rep sees no transactions (0): %s', case when v_n = 0 then 'PASS' else 'FAIL ' || v_n end);
  select count(*) into v_n from public.audit_log;
  r := r || E'\n' || E'\n' || format('3.1 rep sees no audit log (0): %s', case when v_n = 0 then 'PASS' else 'FAIL ' || v_n end);

  select count(*) into v_n from public.communications;
  r := r || E'\n' || format('7.x rep sees no communications (0): %s', case when v_n = 0 then 'PASS' else 'FAIL ' || v_n end);
  select count(*) into v_n from public.system_settings;
  r := r || E'\n' || format('8.x rep reads company settings for branding (1): %s', case when v_n = 1 then 'PASS' else 'FAIL ' || v_n end);
  begin
    update public.system_settings set low_balance_threshold = 1 where org_id = v_org_a;
    get diagnostics v_n = row_count;
    r := r || E'\n' || format('8.x rep cannot change settings: %s', case when v_n = 0 then 'PASS' else 'FAIL' end);
  exception when others then
    r := r || E'\n' || '8.x rep cannot change settings: PASS';
  end;
  select count(*) into v_n from public.issue_messages where issue_id = v_issue;
  r := r || E'\n' || format('6.2 rep sees message + event, not internal note (2): %s', case when v_n = 2 then 'PASS' else 'FAIL ' || v_n end);
  begin
    insert into public.issue_messages (issue_id, kind, text) values (v_issue, 'internal_note', 'x');
    r := r || E'\n' || '6.2 rep cannot write internal note: FAIL';
  exception when others then
    r := r || E'\n' || '6.2 rep cannot write internal note: PASS';
  end;
  insert into public.issue_messages (id, issue_id, text) values (v_msg, v_issue, 'תודה');
  r := r || E'\n' || '6.x rep replies in own building issue: PASS';
  begin
    insert into public.issues (building_id, title) values (v_bd, 'x');
    r := r || E'\n' || '6.2 rep cannot open issue in another building: FAIL';
  exception when others then
    r := r || E'\n' || '6.2 rep cannot open issue in another building: PASS';
  end;
  begin
    update public.issues set status = 'closed', closed_at = now() where id = v_issue;
    get diagnostics v_n = row_count;
    r := r || E'\n' || format('6.x rep cannot change issue status: %s', case when v_n = 0 then 'PASS' else 'FAIL' end);
  exception when others then
    r := r || E'\n' || '6.x rep cannot change issue status: PASS';
  end;
  reset role;
  insert into public.issue_messages (id, org_id, issue_id, author_id, text, created_at) values (v_msg2, v_org_a, v_issue, v_rep, 'ישנה', now() - interval '20 minutes');
  set local role authenticated;
  begin
    update public.issue_messages set text = 'תודה רבה' where id = v_msg2;
    r := r || E'\n' || '6.2 message edit after 15 minutes rejected: FAIL';
  exception when others then
    r := r || E'\n' || '6.2 message edit after 15 minutes rejected: PASS';
  end;

  -- ---------------- מפתח ----------------
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', v_dev, 'role', 'authenticated')::text, true);
  set local role authenticated;

  perform public.switch_org(v_org_d);
  select count(*) into v_n from public.buildings;
  r := r || E'\n' || E'\n' || format('1.2 dev in demo sees demo buildings only (1): %s', case when v_n = 1 then 'PASS' else 'FAIL ' || v_n end);

  perform public.switch_org(v_org_a);
  select count(*) into v_n from public.transactions where building_id = v_b1;
  r := r || E'\n' || E'\n' || format('1.2 dev with read grant sees real org data: %s', case when v_n > 0 then 'PASS' else 'FAIL ' || v_n end);
  begin
    insert into public.transactions (building_id, account, date, direction, amount, source) values (v_b1, 'bank', '2026-09-01', 'in', 10, 'manual');
    r := r || E'\n' || E'\n' || '1.3 dev read-only cannot write: FAIL';
  exception when others then
    r := r || E'\n' || E'\n' || '1.3 dev read-only cannot write: PASS';
  end;
  reset role;
  select count(*) into v_n from public.support_access_log where org_id = v_org_a and user_id = v_dev;
  r := r || E'\n' || E'\n' || format('1.11 dev access to real org logged (1): %s', case when v_n = 1 then 'PASS' else 'FAIL ' || v_n end);

  -- אישור פג
  update public.support_grants set expires_at = now() - interval '1 minute' where org_id = v_org_a;
  perform set_config('request.jwt.claims', json_build_object('sub', v_dev, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from public.buildings;
  r := r || E'\n' || E'\n' || format('1.2 expired grant blocks dev (0): %s', case when v_n = 0 then 'PASS' else 'FAIL ' || v_n end);
  reset role;

  raise exception 'SMOKE RESULTS (rolled back):%', r;
end;
$test$;
