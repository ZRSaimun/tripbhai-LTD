-- Explicit table privileges accompany RLS; no anonymous access is granted.
grant usage on schema public to authenticated;
grant select on public.roles to authenticated;

do $$
declare t text;
begin
 foreach t in array array[
  'profiles','user_roles','clients','staff_members','cases','case_applicants','case_access',
  'visa_applications','visa_checklists','visa_checklist_items','documents','document_versions',
  'document_reviews','messages','internal_notes','tasks','appointments','quotes','payments',
  'audit_events','success_stories','consents','notifications','oauth_identities'
 ] loop
   execute format('grant select, insert, update, delete on public.%I to authenticated',t);
 end loop;
end $$;

-- A logged-in client may update only their own contact record and create
-- an unassigned initial enquiry linked to that client record.
create policy clients_update_own on public.clients for update
using(account_id=auth.uid()) with check(account_id=auth.uid());

create policy cases_client_create_enquiry on public.cases for insert
with check (
 status='new_enquiry' and case_manager_id is null and visa_advisor_id is null
 and submitted_at is null and created_by=auth.uid()
 and exists(select 1 from public.clients cl where cl.id=client_id and cl.account_id=auth.uid())
);

create policy applicants_client_add_own on public.case_applicants for insert
with check (
 created_by=auth.uid() and public.can_access_case(case_id)
);

create policy messages_client_send on public.messages for insert
with check (
 author_id=auth.uid() and visibility='client' and public.can_access_case(case_id)
);

create policy checklist_items_client_update on public.visa_checklist_items for update
using (
 status in ('requested','uploaded','under_review')
 and exists(select 1 from public.visa_checklists v where v.id=checklist_id
   and v.client_visible and public.can_access_case(v.case_id))
)
with check(status in ('uploaded','under_review'));

create index if not exists cases_client_created_idx on public.cases(client_id,created_at desc);
create index if not exists documents_case_status_idx on public.documents(case_id,scan_status,review_status);
create index if not exists messages_case_created_idx on public.messages(case_id,created_at);
create index if not exists tasks_assignee_status_due_idx on public.tasks(assignee_id,status,due_at);
create index if not exists appointments_start_idx on public.appointments(starts_at) where status='scheduled';
create index if not exists audit_events_case_created_idx on public.audit_events(case_id,created_at desc);
