-- Client self-service intake stays unassigned and document uploads remain quarantined.
drop policy if exists cases_management_insert on public.cases;
create policy cases_admin_or_ops_insert on public.cases for insert
with check(public.has_role('administrator') or public.has_role('operations_manager'));

drop policy if exists documents_client_upload on public.documents;
create policy documents_client_quarantined_upload on public.documents for insert
with check (
 uploaded_by=auth.uid()
 and public.can_access_case(case_id)
 and not public.is_management()
 and scan_status='pending'
 and review_status='uploaded'
 and client_visible=true
 and archived_at is null
 and current_version=1
 and (file_size between 1 and 10485760)
 and mime_type in ('application/pdf','image/jpeg','image/png')
);

revoke update on public.profiles from authenticated;
grant update(full_name,phone,preferred_language) on public.profiles to authenticated;
