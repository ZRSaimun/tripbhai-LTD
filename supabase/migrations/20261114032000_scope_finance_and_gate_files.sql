-- Keep finance access limited to quotes/payments and prevent downloads before scanning.
create or replace function public.is_management()
returns boolean language sql stable security definer set search_path=public as $$
 select public.has_role('administrator') or public.has_role('operations_manager')
   or public.has_role('case_manager') or public.has_role('visa_advisor')
   or public.has_role('travel_coordinator')
$$;

drop policy if exists cases_read_authorized on public.cases;
create policy cases_read_authorized on public.cases for select using (public.can_access_case(id));
drop policy if exists applicants_case_access on public.case_applicants;
create policy applicants_case_access on public.case_applicants for select using (public.can_access_case(case_id));

create or replace function public.can_access_document(path text)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.documents d where d.storage_path=path
   and d.archived_at is null and d.scan_status='clean'
   and public.can_access_case(d.case_id)
   and (d.client_visible or public.is_management()))
$$;

create or replace function public.can_upload_document(path text)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.documents d where d.storage_path=path
   and d.archived_at is null and d.scan_status in ('pending','scanning')
   and d.uploaded_by=auth.uid() and public.can_access_case(d.case_id))
$$;

drop policy if exists client_documents_upload on storage.objects;
create policy client_documents_upload on storage.objects for insert to authenticated
with check (bucket_id='client-documents' and
 (public.can_upload_document(name) or
  (public.is_management() and public.can_upload_document(name))));

-- Prevent direct client updates to object metadata and prevent finance access.
drop policy if exists client_documents_read on storage.objects;
create policy client_documents_read on storage.objects for select to authenticated
using (bucket_id='client-documents' and public.can_access_document(name));
