-- Enforce case assignment for operational users. Only administrator and
-- operations manager have organization-wide client/case access.
create or replace function public.is_management()
returns boolean language sql stable security definer set search_path=public as $$
 select public.has_role('administrator') or public.has_role('operations_manager')
   or public.has_role('case_manager') or public.has_role('visa_advisor')
   or public.has_role('travel_coordinator')
$$;

create or replace function public.can_access_client(target uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.clients cl where cl.id=target and (
   cl.account_id=auth.uid() or public.has_role('administrator') or public.has_role('operations_manager')
   or exists(select 1 from public.cases c where c.client_id=cl.id and public.can_access_case(c.id))
 ))
$$;

drop policy if exists profiles_read_self_or_management on public.profiles;
create policy profiles_read_self_or_relevant_team on public.profiles for select using (
 id=auth.uid() or public.has_role('administrator') or public.has_role('operations_manager')
 or exists(select 1 from public.cases c where
   public.can_access_case(c.id) and (c.case_manager_id=id or c.visa_advisor_id=id))
 or exists(select 1 from public.case_access a where a.user_id=id and a.revoked_at is null
   and public.can_access_case(a.case_id))
);

drop policy if exists clients_read_own_or_management on public.clients;
create policy clients_read_self_or_authorized_cases on public.clients for select using (public.can_access_client(id));
drop policy if exists clients_management_write on public.clients;
create policy clients_case_manager_write on public.clients for update
using(public.has_role('administrator') or public.has_role('operations_manager') or
 exists(select 1 from public.cases c where c.client_id=id and public.can_access_case(c.id) and public.is_management()))
with check(public.has_role('administrator') or public.has_role('operations_manager') or
 exists(select 1 from public.cases c where c.client_id=id and public.can_access_case(c.id) and public.is_management()));
create policy clients_admin_create on public.clients for insert
with check(public.has_role('administrator') or public.has_role('operations_manager'));

drop policy if exists cases_management_update on public.cases;
create policy cases_update_authorized_work on public.cases for update
using(public.is_management() and public.can_access_case(id))
with check(public.is_management() and public.can_access_case(id));

drop policy if exists applicants_management_write on public.case_applicants;
create policy applicants_case_work on public.case_applicants for update
using(public.is_management() and public.can_access_case(case_id))
with check(public.is_management() and public.can_access_case(case_id));
create policy applicants_management_insert on public.case_applicants for insert
with check(public.is_management() and public.can_access_case(case_id));

drop policy if exists visa_application_management_write on public.visa_applications;
create policy visa_application_case_work on public.visa_applications for all
using(public.is_management() and public.can_access_case(case_id))
with check(public.is_management() and public.can_access_case(case_id));

drop policy if exists checklists_visible_or_management on public.visa_checklists;
create policy checklists_visible_or_authorized on public.visa_checklists for select
using(public.can_access_case(case_id) and (client_visible or public.is_management()));
drop policy if exists checklists_management_write on public.visa_checklists;
create policy checklists_case_work on public.visa_checklists for all
using(public.is_management() and public.can_access_case(case_id))
with check(public.is_management() and public.can_access_case(case_id));

drop policy if exists checklist_items_visible_or_management on public.visa_checklist_items;
create policy checklist_items_visible_or_authorized on public.visa_checklist_items for select using (
 exists(select 1 from public.visa_checklists v where v.id=checklist_id
 and public.can_access_case(v.case_id) and (v.client_visible or public.is_management())));
drop policy if exists checklist_items_management_write on public.visa_checklist_items;
create policy checklist_items_case_work on public.visa_checklist_items for all using (
 public.is_management() and exists(select 1 from public.visa_checklists v where v.id=checklist_id
 and public.can_access_case(v.case_id)))
with check (
 public.is_management() and exists(select 1 from public.visa_checklists v where v.id=checklist_id
 and public.can_access_case(v.case_id)));

drop policy if exists documents_management_write on public.documents;
create policy documents_case_work on public.documents for all
using(public.is_management() and public.can_access_case(case_id))
with check(public.is_management() and public.can_access_case(case_id));
drop policy if exists document_versions_management_write on public.document_versions;
create policy document_versions_case_work on public.document_versions for all
using(public.is_management() and exists(select 1 from public.documents d where d.id=document_id and public.can_access_case(d.case_id)))
with check(public.is_management() and exists(select 1 from public.documents d where d.id=document_id and public.can_access_case(d.case_id)));
drop policy if exists document_reviews_management_read on public.document_reviews;
create policy document_reviews_case_read on public.document_reviews for select
using(public.is_management() and exists(select 1 from public.documents d where d.id=document_id and public.can_access_case(d.case_id)));
drop policy if exists document_reviews_management_write on public.document_reviews;
create policy document_reviews_case_write on public.document_reviews for insert
with check(public.is_management() and reviewer_id=auth.uid() and exists(select 1 from public.documents d where d.id=document_id and public.can_access_case(d.case_id)));

drop policy if exists internal_notes_management on public.internal_notes;
create policy internal_notes_case_work on public.internal_notes for all
using(public.is_management() and public.can_access_case(case_id))
with check(public.is_management() and author_id=auth.uid() and public.can_access_case(case_id));

drop policy if exists tasks_management on public.tasks;
create policy tasks_read_assigned_or_case on public.tasks for select using (
 public.has_role('administrator') or public.has_role('operations_manager') or assignee_id=auth.uid()
 or (case_id is not null and public.is_management() and public.can_access_case(case_id)));
create policy tasks_create_for_authorized_case on public.tasks for insert with check (
 created_by=auth.uid() and public.is_management() and
 (case_id is null and (public.has_role('administrator') or public.has_role('operations_manager'))
  or case_id is not null and public.can_access_case(case_id)));
create policy tasks_update_authorized on public.tasks for update using (
 public.has_role('administrator') or public.has_role('operations_manager') or
 (public.is_management() and case_id is not null and public.can_access_case(case_id)))
with check (
 public.has_role('administrator') or public.has_role('operations_manager') or
 (public.is_management() and case_id is not null and public.can_access_case(case_id)));

drop policy if exists appointments_management_write on public.appointments;
create policy appointments_case_work on public.appointments for all
using(public.is_management() and public.can_access_case(case_id))
with check(public.is_management() and public.can_access_case(case_id));

drop policy if exists stories_management on public.success_stories;
create policy stories_admin_manage on public.success_stories for all
using(public.has_role('administrator')) with check(public.has_role('administrator'));

drop policy if exists consent_client_or_management_read on public.consents;
create policy consent_relevant_read on public.consents for select using (
 exists(select 1 from public.clients cl where cl.id=client_id and cl.account_id=auth.uid())
 or public.has_role('administrator') or public.has_role('operations_manager')
 or (case_id is not null and public.can_access_case(case_id) and public.is_management()));
drop policy if exists consent_management_write on public.consents;
create policy consent_authorized_case_write on public.consents for all using (
 public.has_role('administrator') or public.has_role('operations_manager')
 or (case_id is not null and public.is_management() and public.can_access_case(case_id)))
with check (
 public.has_role('administrator') or public.has_role('operations_manager')
 or (case_id is not null and public.is_management() and public.can_access_case(case_id)));

drop policy if exists notifications_owner on public.notifications;
create policy notifications_read_own on public.notifications for select using(user_id=auth.uid());
create policy notifications_mark_own_read on public.notifications for update
using(user_id=auth.uid()) with check(user_id=auth.uid());
