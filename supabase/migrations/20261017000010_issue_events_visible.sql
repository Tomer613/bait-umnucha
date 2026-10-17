-- ==========================================================================
-- בית ומנוחה - נציג רואה אירועים בשרשור ("הפנייה נסגרה"), ורק הערות פנימיות מוסתרות ממנו.
-- נציג עדיין כותב רק הודעות רגילות.
-- ==========================================================================
drop policy issue_messages_select on public.issue_messages;
create policy issue_messages_select on public.issue_messages for select to authenticated
  using (
    public.can_see_issue(issue_id)
    and (kind <> 'internal_note' or (select public.my_building_id()) is null)
  );
