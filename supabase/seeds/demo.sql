-- ==========================================================================
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

  -- ---------------- בבלי 43 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('fa99fd4f-ae09-4a27-8304-f0539f045296', v_org, 'בבלי 43', 'רחוב בבלי 43, ירושלים', 'sapphire', 'בנק הפועלים 12-740-438910', '643', 1);
  insert into public.units (id, org_id, building_id, unit_type, commercial_label, number, entrance, floor, sort_order) values ('4edf95cd-6bbd-4f07-97ff-51a602d74644', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'residential', null, '1', null, null, 1);
  insert into public.occupancies (id, org_id, unit_id, tenant_name, business_name, occupant_type, payment_method, bank_payer_names, hiyuvit_client_number, start_date) values ('ce982c21-c899-47d6-9320-eecb9c00a7ef', v_org, '4edf95cd-6bbd-4f07-97ff-51a602d74644', 'משפחת כהן', null, null, 'חיובית', array[]::text[], null, '2024-01-01');
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, 'ce982c21-c899-47d6-9320-eecb9c00a7ef', 'phone', '050-1234567', true);
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, 'ce982c21-c899-47d6-9320-eecb9c00a7ef', 'email', 'cohen.bavli43@gmail.com', true);
  insert into public.unit_dues_rates (org_id, unit_id, amount, effective_month) values (v_org, '4edf95cd-6bbd-4f07-97ff-51a602d74644', 250, '2024-01-01');
  insert into public.units (id, org_id, building_id, unit_type, commercial_label, number, entrance, floor, sort_order) values ('02ad5677-2c01-4e4c-b719-b567a731e7a6', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'residential', null, '2', null, null, 2);
  insert into public.occupancies (id, org_id, unit_id, tenant_name, business_name, occupant_type, payment_method, bank_payer_names, hiyuvit_client_number, start_date) values ('e71866f7-fad0-448a-9f28-ae12a34db588', v_org, '02ad5677-2c01-4e4c-b719-b567a731e7a6', 'אליעזר קרפמן', null, null, 'חיובית', array[]::text[], null, '2024-01-01');
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, 'e71866f7-fad0-448a-9f28-ae12a34db588', 'phone', '052-7654321', true);
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, 'e71866f7-fad0-448a-9f28-ae12a34db588', 'email', 'karpman43@gmail.com', true);
  insert into public.unit_dues_rates (org_id, unit_id, amount, effective_month) values (v_org, '02ad5677-2c01-4e4c-b719-b567a731e7a6', 270, '2024-01-01');
  insert into public.units (id, org_id, building_id, unit_type, commercial_label, number, entrance, floor, sort_order) values ('21d72dd4-9e57-4afc-8d46-8826f5202be4', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'residential', null, '3', null, null, 3);
  insert into public.occupancies (id, org_id, unit_id, tenant_name, business_name, occupant_type, payment_method, bank_payer_names, hiyuvit_client_number, start_date) values ('780b816a-0285-4ca4-bff9-83a917824304', v_org, '21d72dd4-9e57-4afc-8d46-8826f5202be4', 'משה יעקובי', null, null, 'העברה בנקאית', array[]::text[], null, '2024-01-01');
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, '780b816a-0285-4ca4-bff9-83a917824304', 'phone', '054-8889900', true);
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, '780b816a-0285-4ca4-bff9-83a917824304', 'email', 'm.yaacobi@gmail.com', true);
  insert into public.unit_dues_rates (org_id, unit_id, amount, effective_month) values (v_org, '21d72dd4-9e57-4afc-8d46-8826f5202be4', 350, '2024-01-01');
  insert into public.unit_charges (org_id, unit_id, month, kind, occupancy_id, amount_due) values (v_org, '21d72dd4-9e57-4afc-8d46-8826f5202be4', '2026-08-01', 'dues', '780b816a-0285-4ca4-bff9-83a917824304', 350);
  insert into public.unit_charges (org_id, unit_id, month, kind, occupancy_id, amount_due) values (v_org, '21d72dd4-9e57-4afc-8d46-8826f5202be4', '2026-09-01', 'dues', '780b816a-0285-4ca4-bff9-83a917824304', 350);
  insert into public.units (id, org_id, building_id, unit_type, commercial_label, number, entrance, floor, sort_order) values ('7870e558-ea65-4971-b381-b63401b41c41', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'residential', null, '4', null, null, 4);
  insert into public.occupancies (id, org_id, unit_id, tenant_name, business_name, occupant_type, payment_method, bank_payer_names, hiyuvit_client_number, start_date) values ('c8f610aa-d528-4e6a-9ad3-1ee6d6ef0a17', v_org, '7870e558-ea65-4971-b381-b63401b41c41', 'מרים הלטובסקי', null, null, 'העברה בנקאית', array[]::text[], null, '2024-01-01');
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, 'c8f610aa-d528-4e6a-9ad3-1ee6d6ef0a17', 'phone', '053-3334455', true);
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, 'c8f610aa-d528-4e6a-9ad3-1ee6d6ef0a17', 'email', 'haltovsky.m@gmail.com', true);
  insert into public.unit_dues_rates (org_id, unit_id, amount, effective_month) values (v_org, '7870e558-ea65-4971-b381-b63401b41c41', 200, '2024-01-01');
  insert into public.units (id, org_id, building_id, unit_type, commercial_label, number, entrance, floor, sort_order) values ('a5adce6a-f4f1-4d28-93c5-fa8f5eca33a9', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'residential', null, '5', null, null, 5);
  insert into public.occupancies (id, org_id, unit_id, tenant_name, business_name, occupant_type, payment_method, bank_payer_names, hiyuvit_client_number, start_date) values ('eef22cce-abe4-4e7a-824d-aafd9a139b51', v_org, 'a5adce6a-f4f1-4d28-93c5-fa8f5eca33a9', 'שלום וובר', null, null, 'חיובית', array[]::text[], null, '2024-01-01');
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, 'eef22cce-abe4-4e7a-824d-aafd9a139b51', 'phone', '058-4445566', true);
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, 'eef22cce-abe4-4e7a-824d-aafd9a139b51', 'email', 'weber.s@gmail.com', true);
  insert into public.unit_dues_rates (org_id, unit_id, amount, effective_month) values (v_org, 'a5adce6a-f4f1-4d28-93c5-fa8f5eca33a9', 370, '2024-01-01');
  insert into public.units (id, org_id, building_id, unit_type, commercial_label, number, entrance, floor, sort_order) values ('93d1fcef-742b-4618-a9ef-002ade0dce78', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'residential', null, '6', null, null, 6);
  insert into public.occupancies (id, org_id, unit_id, tenant_name, business_name, occupant_type, payment_method, bank_payer_names, hiyuvit_client_number, start_date) values ('616875fa-5aaa-482f-bab1-6f0240d72cfa', v_org, '93d1fcef-742b-4618-a9ef-002ade0dce78', 'נחמן קניג', null, null, 'מזומן', array[]::text[], null, '2024-01-01');
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, '616875fa-5aaa-482f-bab1-6f0240d72cfa', 'phone', '050-9998877', true);
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, '616875fa-5aaa-482f-bab1-6f0240d72cfa', 'email', 'kenig.n@gmail.com', true);
  insert into public.unit_dues_rates (org_id, unit_id, amount, effective_month) values (v_org, '93d1fcef-742b-4618-a9ef-002ade0dce78', 370, '2024-01-01');
  insert into public.unit_charges (org_id, unit_id, month, kind, occupancy_id, amount_due) values (v_org, '93d1fcef-742b-4618-a9ef-002ade0dce78', '2026-07-01', 'dues', '616875fa-5aaa-482f-bab1-6f0240d72cfa', 370);
  insert into public.unit_charges (org_id, unit_id, month, kind, occupancy_id, amount_due) values (v_org, '93d1fcef-742b-4618-a9ef-002ade0dce78', '2026-08-01', 'dues', '616875fa-5aaa-482f-bab1-6f0240d72cfa', 370);
  insert into public.unit_charges (org_id, unit_id, month, kind, occupancy_id, amount_due) values (v_org, '93d1fcef-742b-4618-a9ef-002ade0dce78', '2026-09-01', 'dues', '616875fa-5aaa-482f-bab1-6f0240d72cfa', 370);
  insert into public.units (id, org_id, building_id, unit_type, commercial_label, number, entrance, floor, sort_order) values ('9dfbca69-0363-4a52-9443-89512ba5dfc3', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'residential', null, '7', null, null, 7);
  insert into public.occupancies (id, org_id, unit_id, tenant_name, business_name, occupant_type, payment_method, bank_payer_names, hiyuvit_client_number, start_date) values ('592f0807-9ede-4a2d-b5ba-8578d5bcde4e', v_org, '9dfbca69-0363-4a52-9443-89512ba5dfc3', 'הלל אייזנבאך', null, null, 'חיובית', array[]::text[], null, '2024-01-01');
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, '592f0807-9ede-4a2d-b5ba-8578d5bcde4e', 'phone', '052-1112233', true);
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, '592f0807-9ede-4a2d-b5ba-8578d5bcde4e', 'email', 'eisenbach.h@gmail.com', true);
  insert into public.unit_dues_rates (org_id, unit_id, amount, effective_month) values (v_org, '9dfbca69-0363-4a52-9443-89512ba5dfc3', 370, '2024-01-01');
  insert into public.units (id, org_id, building_id, unit_type, commercial_label, number, entrance, floor, sort_order) values ('f73c62d3-2d11-4336-9bba-cecc33cf8672', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'residential', null, '8', null, null, 8);
  insert into public.occupancies (id, org_id, unit_id, tenant_name, business_name, occupant_type, payment_method, bank_payer_names, hiyuvit_client_number, start_date) values ('d546058a-3b22-4893-b57a-d28c0e7fe026', v_org, 'f73c62d3-2d11-4336-9bba-cecc33cf8672', 'מינץ אולפן', null, null, 'חיובית', array[]::text[], null, '2024-01-01');
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, 'd546058a-3b22-4893-b57a-d28c0e7fe026', 'phone', '054-5556677', true);
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, 'd546058a-3b22-4893-b57a-d28c0e7fe026', 'email', 'mintz.studio@gmail.com', true);
  insert into public.unit_dues_rates (org_id, unit_id, amount, effective_month) values (v_org, 'f73c62d3-2d11-4336-9bba-cecc33cf8672', 450, '2024-01-01');
  insert into public.transactions (org_id, building_id, account, date, direction, amount, category_id, source, description) values (v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'bank', '2026-09-01', 'out', 1100, coalesce((select id from public.categories where org_id = v_org and direction = 'out' and name = 'דמי ניהול' and deleted_at is null), (select id from public.categories where org_id = v_org and system_key = 'other')), 'recurring', 'דמי ניהול ועד בית חודש 9');
  insert into public.transactions (org_id, building_id, account, date, direction, amount, category_id, source, description) values (v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'bank', '2026-09-02', 'out', 80, coalesce((select id from public.categories where org_id = v_org and direction = 'out' and name = 'מפיץ ריח' and deleted_at is null), (select id from public.categories where org_id = v_org and system_key = 'other')), 'recurring', 'החלפת מפיץ ריח בלובי');
  insert into public.transactions (org_id, building_id, account, date, direction, amount, category_id, source, description) values (v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'bank', '2026-09-10', 'out', 1007, coalesce((select id from public.categories where org_id = v_org and direction = 'out' and name = 'חשבון חשמל' and deleted_at is null), (select id from public.categories where org_id = v_org and system_key = 'other')), 'bank_import', 'חברת החשמל חיוב ישיר');
  insert into public.transactions (org_id, building_id, account, date, direction, amount, category_id, source, description) values (v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'bank', '2026-09-12', 'out', 1133, coalesce((select id from public.categories where org_id = v_org and direction = 'out' and name = 'ביטוח מעליות' and deleted_at is null), (select id from public.categories where org_id = v_org and system_key = 'other')), 'bank_import', 'שינדלר מעליות אחזקה שוטפת');
  insert into public.transactions (org_id, building_id, account, date, direction, amount, category_id, source, description) values (v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'cash', '2026-09-15', 'out', 1400, coalesce((select id from public.categories where org_id = v_org and direction = 'out' and name = 'ניקיון' and deleted_at is null), (select id from public.categories where org_id = v_org and system_key = 'other')), 'manual', 'ניקיון חדרי מדרגות חודש ספטמבר');
  insert into public.transactions (org_id, building_id, account, date, direction, amount, category_id, source, description) values (v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'bank', '2026-09-18', 'out', 146, coalesce((select id from public.categories where org_id = v_org and direction = 'out' and name = 'עמלות סליקה' and deleted_at is null), (select id from public.categories where org_id = v_org and system_key = 'other')), 'hiyuvit_import', 'אוקס פינטק / חיובית עמלות');
  insert into public.transactions (org_id, building_id, account, date, direction, amount, category_id, source, description) values (v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'cash', '2026-09-22', 'out', 250, coalesce((select id from public.categories where org_id = v_org and direction = 'out' and name = 'תחזוקה שוטפת והוצאות חריגות' and deleted_at is null), (select id from public.categories where org_id = v_org and system_key = 'other')), 'manual', 'ניקיון מיוחד קומה 5,6');
  insert into public.recurring_expenses (org_id, building_id, name, category_id, amount) values (v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'דמי ניהול ועד בית', (select id from public.categories where org_id = v_org and direction = 'out' and name = 'דמי ניהול' and deleted_at is null), 1100);
  insert into public.recurring_expenses (org_id, building_id, name, category_id, amount) values (v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'שירות מפיץ ריח', (select id from public.categories where org_id = v_org and direction = 'out' and name = 'מפיץ ריח' and deleted_at is null), 80);
  insert into public.special_levies (id, org_id, building_id, name, mode, amount_per_unit, start_month, installments, status) values ('a55fd2b6-b799-4213-bc90-f7c88ef286ee', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'תיקון פיצוץ צנרת ראשי בחניון', 'one_time', 300, '2026-09-01', 1, 'active');
  insert into public.unit_charges (id, org_id, unit_id, month, kind, levy_id, occupancy_id, amount_due) values ('2208e165-52d8-4a0b-acb0-a25bc23200b0', v_org, '4edf95cd-6bbd-4f07-97ff-51a602d74644', '2026-09-01', 'levy', 'a55fd2b6-b799-4213-bc90-f7c88ef286ee', 'ce982c21-c899-47d6-9320-eecb9c00a7ef', 300);
  insert into public.transactions (id, org_id, building_id, account, date, direction, amount, category_id, levy_id, source, unit_id, description) values ('1e904f21-7bed-4f97-a982-e3d9d772b84e', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'cash', '2026-09-05', 'in', 300, (select id from public.categories where org_id = v_org and system_key = 'other_income'), 'a55fd2b6-b799-4213-bc90-f7c88ef286ee', 'manual', '4edf95cd-6bbd-4f07-97ff-51a602d74644', 'תשלום תיקון פיצוץ צנרת ראשי בחניון · דירה 1');
  insert into public.charge_payments (org_id, charge_id, transaction_id, amount) values (v_org, '2208e165-52d8-4a0b-acb0-a25bc23200b0', '1e904f21-7bed-4f97-a982-e3d9d772b84e', 300);
  insert into public.unit_charges (id, org_id, unit_id, month, kind, levy_id, occupancy_id, amount_due) values ('66084170-d547-40d2-8e5c-152a2bc28a18', v_org, '02ad5677-2c01-4e4c-b719-b567a731e7a6', '2026-09-01', 'levy', 'a55fd2b6-b799-4213-bc90-f7c88ef286ee', 'e71866f7-fad0-448a-9f28-ae12a34db588', 300);
  insert into public.transactions (id, org_id, building_id, account, date, direction, amount, category_id, levy_id, source, unit_id, description) values ('de261926-de34-4271-8665-318640aab6ed', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'cash', '2026-09-05', 'in', 300, (select id from public.categories where org_id = v_org and system_key = 'other_income'), 'a55fd2b6-b799-4213-bc90-f7c88ef286ee', 'manual', '02ad5677-2c01-4e4c-b719-b567a731e7a6', 'תשלום תיקון פיצוץ צנרת ראשי בחניון · דירה 2');
  insert into public.charge_payments (org_id, charge_id, transaction_id, amount) values (v_org, '66084170-d547-40d2-8e5c-152a2bc28a18', 'de261926-de34-4271-8665-318640aab6ed', 300);
  insert into public.unit_charges (id, org_id, unit_id, month, kind, levy_id, occupancy_id, amount_due) values ('864d279d-e24a-4579-bb71-44d843482d48', v_org, '21d72dd4-9e57-4afc-8d46-8826f5202be4', '2026-09-01', 'levy', 'a55fd2b6-b799-4213-bc90-f7c88ef286ee', '780b816a-0285-4ca4-bff9-83a917824304', 300);
  insert into public.unit_charges (id, org_id, unit_id, month, kind, levy_id, occupancy_id, amount_due) values ('93f3786b-c0db-4d86-8b66-fee6276b60d2', v_org, '7870e558-ea65-4971-b381-b63401b41c41', '2026-09-01', 'levy', 'a55fd2b6-b799-4213-bc90-f7c88ef286ee', 'c8f610aa-d528-4e6a-9ad3-1ee6d6ef0a17', 300);
  insert into public.transactions (id, org_id, building_id, account, date, direction, amount, category_id, levy_id, source, unit_id, description) values ('b1031ac6-8c13-49af-a13d-3d3a08f75495', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'cash', '2026-09-05', 'in', 300, (select id from public.categories where org_id = v_org and system_key = 'other_income'), 'a55fd2b6-b799-4213-bc90-f7c88ef286ee', 'manual', '7870e558-ea65-4971-b381-b63401b41c41', 'תשלום תיקון פיצוץ צנרת ראשי בחניון · דירה 4');
  insert into public.charge_payments (org_id, charge_id, transaction_id, amount) values (v_org, '93f3786b-c0db-4d86-8b66-fee6276b60d2', 'b1031ac6-8c13-49af-a13d-3d3a08f75495', 300);
  insert into public.unit_charges (id, org_id, unit_id, month, kind, levy_id, occupancy_id, amount_due) values ('320db18f-4cb2-430a-85a4-6f6c4b7c15e0', v_org, 'a5adce6a-f4f1-4d28-93c5-fa8f5eca33a9', '2026-09-01', 'levy', 'a55fd2b6-b799-4213-bc90-f7c88ef286ee', 'eef22cce-abe4-4e7a-824d-aafd9a139b51', 300);
  insert into public.transactions (id, org_id, building_id, account, date, direction, amount, category_id, levy_id, source, unit_id, description) values ('a631b79d-7134-434a-b88d-612f63ec7793', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'cash', '2026-09-05', 'in', 300, (select id from public.categories where org_id = v_org and system_key = 'other_income'), 'a55fd2b6-b799-4213-bc90-f7c88ef286ee', 'manual', 'a5adce6a-f4f1-4d28-93c5-fa8f5eca33a9', 'תשלום תיקון פיצוץ צנרת ראשי בחניון · דירה 5');
  insert into public.charge_payments (org_id, charge_id, transaction_id, amount) values (v_org, '320db18f-4cb2-430a-85a4-6f6c4b7c15e0', 'a631b79d-7134-434a-b88d-612f63ec7793', 300);
  insert into public.unit_charges (id, org_id, unit_id, month, kind, levy_id, occupancy_id, amount_due) values ('bdc246a3-d710-4092-bf69-611a790b1e09', v_org, '93d1fcef-742b-4618-a9ef-002ade0dce78', '2026-09-01', 'levy', 'a55fd2b6-b799-4213-bc90-f7c88ef286ee', '616875fa-5aaa-482f-bab1-6f0240d72cfa', 300);
  insert into public.unit_charges (id, org_id, unit_id, month, kind, levy_id, occupancy_id, amount_due) values ('e402f7ab-e116-4654-b64b-162dc01b94c8', v_org, '9dfbca69-0363-4a52-9443-89512ba5dfc3', '2026-09-01', 'levy', 'a55fd2b6-b799-4213-bc90-f7c88ef286ee', '592f0807-9ede-4a2d-b5ba-8578d5bcde4e', 300);
  insert into public.unit_charges (id, org_id, unit_id, month, kind, levy_id, occupancy_id, amount_due) values ('d2ce6519-6354-4cb8-b07a-eca9f5a74258', v_org, 'f73c62d3-2d11-4336-9bba-cecc33cf8672', '2026-09-01', 'levy', 'a55fd2b6-b799-4213-bc90-f7c88ef286ee', 'd546058a-3b22-4893-b57a-d28c0e7fe026', 300);
  insert into public.transactions (id, org_id, building_id, account, date, direction, amount, category_id, levy_id, source, unit_id, description) values ('93216f36-966a-43a9-9736-67bded730f54', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'cash', '2026-09-05', 'in', 300, (select id from public.categories where org_id = v_org and system_key = 'other_income'), 'a55fd2b6-b799-4213-bc90-f7c88ef286ee', 'manual', 'f73c62d3-2d11-4336-9bba-cecc33cf8672', 'תשלום תיקון פיצוץ צנרת ראשי בחניון · דירה 8');
  insert into public.charge_payments (org_id, charge_id, transaction_id, amount) values (v_org, 'd2ce6519-6354-4cb8-b07a-eca9f5a74258', '93216f36-966a-43a9-9736-67bded730f54', 300);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'bank', '2026-09-01', 20590.59);
  insert into public.issues (id, org_id, building_id, title, status, closed_at, reported_by_text, created_at) values ('a00b6019-2e13-4d65-84f9-c731f6db820a', v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', 'רעש מהמעלית בקומה 3', 'open', null, 'אליעזר קרפמן (דירה 2)', '2026-09-25 14:30:00+03');
  insert into public.issue_messages (org_id, issue_id, author_id, kind, text, created_at) values (v_org, 'a00b6019-2e13-4d65-84f9-c731f6db820a', v_author, 'message', 'אליעזר קרפמן: המעלית משמיעה חריקות חזקות בעצירה בקומה 3, בבקשה לבדוק.', '2026-09-25 14:30:00+03');
  insert into public.issue_messages (org_id, issue_id, author_id, kind, text, created_at) values (v_org, 'a00b6019-2e13-4d65-84f9-c731f6db820a', v_author, 'message', 'מנהל החברה: הוזמן טכנאי מחברת שינדלר ליום חמישי בבוקר.', '2026-09-25 16:15:00+03');
  -- ---------------- רבינא 1 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('dfddede7-2866-40ee-ab1e-0f6812a0dc1e', v_org, 'רבינא 1', 'רחוב רבינא 1, ירושלים', 'amber', 'בנק דיסקונט 11-123-556677', '646', 2);
  insert into public.units (id, org_id, building_id, unit_type, commercial_label, number, entrance, floor, sort_order) values ('85a69e24-d214-447d-988f-61c4d2886866', v_org, 'dfddede7-2866-40ee-ab1e-0f6812a0dc1e', 'residential', null, '1', null, null, 1);
  insert into public.occupancies (id, org_id, unit_id, tenant_name, business_name, occupant_type, payment_method, bank_payer_names, hiyuvit_client_number, start_date) values ('877b25e8-623c-494b-9332-022137cdc511', v_org, '85a69e24-d214-447d-988f-61c4d2886866', 'ישראל ישראלי', null, null, 'חיובית', array[]::text[], null, '2024-01-01');
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, '877b25e8-623c-494b-9332-022137cdc511', 'phone', '050-1111111', true);
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, '877b25e8-623c-494b-9332-022137cdc511', 'email', 'israel@gmail.com', true);
  insert into public.unit_dues_rates (org_id, unit_id, amount, effective_month) values (v_org, '85a69e24-d214-447d-988f-61c4d2886866', 300, '2024-01-01');
  insert into public.units (id, org_id, building_id, unit_type, commercial_label, number, entrance, floor, sort_order) values ('689804c8-630f-4ceb-8f9c-8cc0fae70e97', v_org, 'dfddede7-2866-40ee-ab1e-0f6812a0dc1e', 'residential', null, '2', null, null, 2);
  insert into public.occupancies (id, org_id, unit_id, tenant_name, business_name, occupant_type, payment_method, bank_payer_names, hiyuvit_client_number, start_date) values ('1718d062-d409-4d33-b58a-63b2998f6c6f', v_org, '689804c8-630f-4ceb-8f9c-8cc0fae70e97', 'אברהם לוי', null, null, 'חיובית', array[]::text[], null, '2024-01-01');
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, '1718d062-d409-4d33-b58a-63b2998f6c6f', 'phone', '052-2222222', true);
  insert into public.occupant_contacts (org_id, occupancy_id, kind, value, is_primary) values (v_org, '1718d062-d409-4d33-b58a-63b2998f6c6f', 'email', 'levi@gmail.com', true);
  insert into public.unit_dues_rates (org_id, unit_id, amount, effective_month) values (v_org, '689804c8-630f-4ceb-8f9c-8cc0fae70e97', 300, '2024-01-01');
  insert into public.transactions (org_id, building_id, account, date, direction, amount, category_id, source, description) values (v_org, 'dfddede7-2866-40ee-ab1e-0f6812a0dc1e', 'bank', '2026-09-01', 'out', 1200, coalesce((select id from public.categories where org_id = v_org and direction = 'out' and name = 'דמי ניהול' and deleted_at is null), (select id from public.categories where org_id = v_org and system_key = 'other')), 'recurring', 'דמי ניהול ועד');
  insert into public.transactions (org_id, building_id, account, date, direction, amount, category_id, source, description) values (v_org, 'dfddede7-2866-40ee-ab1e-0f6812a0dc1e', 'bank', '2026-09-10', 'out', 1500, coalesce((select id from public.categories where org_id = v_org and direction = 'out' and name = 'ניקיון' and deleted_at is null), (select id from public.categories where org_id = v_org and system_key = 'other')), 'bank_import', 'שירות ניקיון');
  insert into public.recurring_expenses (org_id, building_id, name, category_id, amount) values (v_org, 'dfddede7-2866-40ee-ab1e-0f6812a0dc1e', 'דמי ניהול', (select id from public.categories where org_id = v_org and direction = 'out' and name = 'דמי ניהול' and deleted_at is null), 1200);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, 'dfddede7-2866-40ee-ab1e-0f6812a0dc1e', 'bank', '2026-09-01', 26850);
  -- ---------------- ירושלמי 18 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('507a59cb-b330-4bf1-b600-8679f83de1d9', v_org, 'ירושלמי 18', 'רחוב ירושלמי 18', 'emerald', 'בנק לאומי 10-850-998877', '648', 3);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, '507a59cb-b330-4bf1-b600-8679f83de1d9', 'bank', '2026-01-01', 12400);
  -- ---------------- אביי 27 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('76901742-c69c-4928-8377-5cf28681b48d', v_org, 'אביי 27', 'רחוב אביי 27', 'terracotta', 'בנק הפועלים 12-650-334455', '650', 4);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, '76901742-c69c-4928-8377-5cf28681b48d', 'bank', '2026-01-01', 9800.5);
  -- ---------------- ריש לקיש 14 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('63b69ca6-6d9d-4acc-ade1-c8a6f0142a60', v_org, 'ריש לקיש 14', 'רחוב ריש לקיש 14', 'plum', 'בנק מזרחי 20-410-112233', '652', 5);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, '63b69ca6-6d9d-4acc-ade1-c8a6f0142a60', 'bank', '2026-01-01', 15320);
  -- ---------------- אמוראים 76 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('df9a446f-974c-450d-8c1d-0c25f766636b', v_org, 'אמוראים 76', 'רחוב אמוראים 76', 'teal', 'בנק הפועלים 12-700-445566', '654', 6);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, 'df9a446f-974c-450d-8c1d-0c25f766636b', 'bank', '2026-01-01', 8750);
  -- ---------------- אמוראים 35 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('faa99b6f-60f8-456d-a5ae-ac3f91c812ba', v_org, 'אמוראים 35', 'רחוב אמוראים 35', 'burgundy', 'בנק הפועלים 12-700-445577', '656', 7);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, 'faa99b6f-60f8-456d-a5ae-ac3f91c812ba', 'bank', '2026-01-01', 14200);
  -- ---------------- ברכיה 8 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('b9f13456-1509-492f-acdc-df352b6ddabe', v_org, 'ברכיה 8', 'רחוב ברכיה 8', 'navy', 'בנק דיסקונט 11-300-889900', '658', 8);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, 'b9f13456-1509-492f-acdc-df352b6ddabe', 'bank', '2026-01-01', 21000);
  -- ---------------- חלקיה בר טובי 8 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('bdae0960-188a-4ec8-a9e9-baa96ca2b661', v_org, 'חלקיה בר טובי 8', 'רחוב חלקיה בר טובי 8', 'olive', 'בנק לאומי 10-820-114477', '660', 9);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, 'bdae0960-188a-4ec8-a9e9-baa96ca2b661', 'bank', '2026-01-01', 17650);
  -- ---------------- חלקיה בר טובי 27 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('20cc7f9c-c7f4-4767-9308-af076519ed0f', v_org, 'חלקיה בר טובי 27', 'רחוב חלקיה בר טובי 27', 'lavender', 'בנק לאומי 10-820-114488', '662', 10);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, '20cc7f9c-c7f4-4767-9308-af076519ed0f', 'bank', '2026-01-01', 11300);
  -- ---------------- חנינא 21 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('963ef285-540e-4fb4-b583-0814c25ee3ba', v_org, 'חנינא 21', 'רחוב חנינא 21', 'espresso', 'בנק מזרחי 20-430-778899', '664', 11);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, '963ef285-540e-4fb4-b583-0814c25ee3ba', 'bank', '2026-01-01', 19400);
  -- ---------------- חנינא 23 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('92176a9b-e6ba-4a64-8640-5b4cc4a5e8cb', v_org, 'חנינא 23', 'רחוב חנינא 23', 'ocean', 'בנק מזרחי 20-430-778800', '666', 12);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, '92176a9b-e6ba-4a64-8640-5b4cc4a5e8cb', 'bank', '2026-01-01', 13900);
  -- ---------------- בבלי 47 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('e0888cdf-91a7-4817-96bf-0363d4b9cae5', v_org, 'בבלי 47', 'רחוב בבלי 47', 'bronze', 'בנק הפועלים 12-740-438920', '668', 13);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, 'e0888cdf-91a7-4817-96bf-0363d4b9cae5', 'bank', '2026-01-01', 27800);
  -- ---------------- רב עמרם 10 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('dbae369f-16ea-40dc-87af-7926c9dcca6e', v_org, 'רב עמרם 10', 'רחוב רב עמרם 10', 'crimson', 'בנק דיסקונט 11-150-332211', '670', 14);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, 'dbae369f-16ea-40dc-87af-7926c9dcca6e', 'bank', '2026-01-01', 6500);
  -- ---------------- רב חנן 8 ----------------
  insert into public.buildings (id, org_id, name, address, color_id, bank_account, hiyuvit_code, sort_order) values ('c38c6879-5146-426f-8a7e-11f339dfa78e', v_org, 'רב חנן 8', 'רחוב רב חנן 8', 'forest', 'בנק לאומי 10-890-554433', '672', 15);
  insert into public.opening_balances (org_id, building_id, account, date, amount) values (v_org, 'c38c6879-5146-426f-8a7e-11f339dfa78e', 'bank', '2026-01-01', 18200);

  -- ---------------- סגירת ספטמבר בבניינים שעודכנו ----------------
  insert into public.month_closes (org_id, building_id, month, steps, closed_at) values (v_org, 'fa99fd4f-ae09-4a27-8304-f0539f045296', '2026-09-01', '{"bank": {"done": true}, "hiyuvit": {"done": true}, "receipts": {"done": true}, "expenses": {"done": true}}'::jsonb, now());
  insert into public.month_closes (org_id, building_id, month, steps, closed_at) values (v_org, 'dfddede7-2866-40ee-ab1e-0f6812a0dc1e', '2026-09-01', '{"bank": {"done": true}, "hiyuvit": {"done": true}, "receipts": {"done": true}, "expenses": {"done": true}}'::jsonb, now());
  insert into public.month_closes (org_id, building_id, month, steps, closed_at) values (v_org, '507a59cb-b330-4bf1-b600-8679f83de1d9', '2026-09-01', '{"bank": {"done": true}, "hiyuvit": {"done": true}, "receipts": {"done": true}, "expenses": {"done": true}}'::jsonb, now());
  insert into public.month_closes (org_id, building_id, month, steps, closed_at) values (v_org, '63b69ca6-6d9d-4acc-ade1-c8a6f0142a60', '2026-09-01', '{"bank": {"done": true}, "hiyuvit": {"done": true}, "receipts": {"done": true}, "expenses": {"done": true}}'::jsonb, now());
  insert into public.month_closes (org_id, building_id, month, steps, closed_at) values (v_org, 'faa99b6f-60f8-456d-a5ae-ac3f91c812ba', '2026-09-01', '{"bank": {"done": true}, "hiyuvit": {"done": true}, "receipts": {"done": true}, "expenses": {"done": true}}'::jsonb, now());
  insert into public.month_closes (org_id, building_id, month, steps, closed_at) values (v_org, 'b9f13456-1509-492f-acdc-df352b6ddabe', '2026-09-01', '{"bank": {"done": true}, "hiyuvit": {"done": true}, "receipts": {"done": true}, "expenses": {"done": true}}'::jsonb, now());
  insert into public.month_closes (org_id, building_id, month, steps, closed_at) values (v_org, 'bdae0960-188a-4ec8-a9e9-baa96ca2b661', '2026-09-01', '{"bank": {"done": true}, "hiyuvit": {"done": true}, "receipts": {"done": true}, "expenses": {"done": true}}'::jsonb, now());
  insert into public.month_closes (org_id, building_id, month, steps, closed_at) values (v_org, '963ef285-540e-4fb4-b583-0814c25ee3ba', '2026-09-01', '{"bank": {"done": true}, "hiyuvit": {"done": true}, "receipts": {"done": true}, "expenses": {"done": true}}'::jsonb, now());
  insert into public.month_closes (org_id, building_id, month, steps, closed_at) values (v_org, '92176a9b-e6ba-4a64-8640-5b4cc4a5e8cb', '2026-09-01', '{"bank": {"done": true}, "hiyuvit": {"done": true}, "receipts": {"done": true}, "expenses": {"done": true}}'::jsonb, now());
  insert into public.month_closes (org_id, building_id, month, steps, closed_at) values (v_org, 'e0888cdf-91a7-4817-96bf-0363d4b9cae5', '2026-09-01', '{"bank": {"done": true}, "hiyuvit": {"done": true}, "receipts": {"done": true}, "expenses": {"done": true}}'::jsonb, now());
  insert into public.month_closes (org_id, building_id, month, steps, closed_at) values (v_org, 'c38c6879-5146-426f-8a7e-11f339dfa78e', '2026-09-01', '{"bank": {"done": true}, "hiyuvit": {"done": true}, "receipts": {"done": true}, "expenses": {"done": true}}'::jsonb, now());

  -- יומן השינויים של הדמו מתחיל נקי (הטעינה עצמה לא נחשבת "שינוי")
  delete from public.audit_log where org_id = v_org;
end;
$demo$;
