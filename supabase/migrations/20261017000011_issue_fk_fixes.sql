-- ==========================================================================
-- בית ומנוחה - תיקונים אחרי סקירה של מיגרציות 8–10
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. מחיקה סופית של פנייה לפי מדיניות השמירה (אפיון 13, 6.3) הייתה נכשלת כשיש
--    לפנייה הוצאה מקושרת או פנייה שבהמשך אליה. עכשיו הקישור מתאפס, והרשומה
--    המקושרת נשארת. (Postgres 15+: מאפסים רק את העמודה, לא את org_id.)
-- --------------------------------------------------------------------------
alter table public.transactions drop constraint transactions_issue_fk;
alter table public.transactions
  add constraint transactions_issue_fk foreign key (issue_id, org_id)
  references public.issues (id, org_id) on delete set null (issue_id);

alter table public.issues drop constraint issues_follow_up_of_org_id_fkey;
alter table public.issues
  add constraint issues_follow_up_of_org_id_fkey foreign key (follow_up_of, org_id)
  references public.issues (id, org_id) on delete set null (follow_up_of);

-- --------------------------------------------------------------------------
-- 2. "דווח ע"י נציג" לא היה מוגבל לנציג של אותה חברה
-- --------------------------------------------------------------------------
alter table public.profiles add constraint profiles_id_org_key unique (id, org_id);

alter table public.issues drop constraint issues_reported_by_profile_id_fkey;
alter table public.issues
  add constraint issues_reported_by_profile_fk foreign key (reported_by_profile_id, org_id)
  references public.profiles (id, org_id) on delete set null (reported_by_profile_id);
