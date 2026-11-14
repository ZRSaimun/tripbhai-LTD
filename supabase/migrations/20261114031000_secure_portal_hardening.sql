-- Tighten the foundation and initialize regular client identities.
-- Every authenticated signup receives only the client role; privileged roles
-- must be provisioned by an administrator through a verified onboarding path.

create or replace function public.bootstrap_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path=public,auth as $$
declare display_name text;
begin
 display_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');
 insert into public.profiles(id,full_name,email)
 values(new.id,display_name,coalesce(new.email,''))
 on conflict(id) do nothing;
 insert into public.user_roles(user_id,role_name)
 values(new.id,'client')
 on conflict(user_id,role_name) do nothing;
 if coalesce(new.email,'') <> '' then
   insert into public.clients(account_id,full_name,email)
   values(new.id,display_name,new.email)
   on conflict(account_id) do nothing;
 end if;
 return new;
end $$;

create trigger on_auth_user_created_profile
 after insert on auth.users
 for each row execute function public.bootstrap_profile_for_auth_user();

-- Finance roles must not access passport or travel documents. They receive
-- quotation and payment access only.
create or replace function public.can_access_document(path text)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.documents d where d.storage_path=path and d.archived_at is null
   and public.can_access_case(d.case_id))
$$;

drop policy if exists documents_case_read on public.documents;
create policy documents_case_read on public.documents for select using (
 public.can_access_case(case_id) and (client_visible or public.is_management()));
drop policy if exists audit_actor_insert on public.audit_events;
-- Audit events are written only by trusted server code using the service role.
-- End users cannot forge or modify the audit trail.
