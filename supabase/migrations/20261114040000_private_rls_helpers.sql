-- Keep privileged RLS helpers outside PostgREST's exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.has_role(wanted text)
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth as $$
 select exists(select 1 from public.user_roles r where r.user_id=auth.uid()
   and r.role_name=wanted and r.revoked_at is null)
$$;

create or replace function private.is_management()
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth as $$
 select private.has_role('administrator') or private.has_role('operations_manager')
   or private.has_role('case_manager') or private.has_role('visa_advisor')
   or private.has_role('travel_coordinator')
$$;

create or replace function private.can_access_case(target uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth as $$
 select exists(
   select 1 from public.cases c join public.clients cl on cl.id=c.client_id
   where c.id=target and c.archived_at is null and (
     cl.account_id=auth.uid()
     or private.has_role('administrator')
     or private.has_role('operations_manager')
     or c.case_manager_id=auth.uid()
     or c.visa_advisor_id=auth.uid()
     or exists(select 1 from public.case_access a where a.case_id=c.id and a.user_id=auth.uid()
       and a.revoked_at is null and a.access_scope in ('read','work'))
   )
 )
$$;

create or replace function private.can_access_client(target uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth as $$
 select exists(select 1 from public.clients cl where cl.id=target and (
   cl.account_id=auth.uid() or private.has_role('administrator') or private.has_role('operations_manager')
   or exists(select 1 from public.cases c where c.client_id=cl.id and private.can_access_case(c.id))
 ))
$$;

create or replace function private.can_access_document(path text)
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth as $$
 select exists(select 1 from public.documents d where d.storage_path=path
   and d.archived_at is null and d.scan_status='clean'
   and private.can_access_case(d.case_id)
   and (d.client_visible or private.is_management()))
$$;

create or replace function private.can_upload_document(path text)
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth as $$
 select exists(select 1 from public.documents d where d.storage_path=path
   and d.archived_at is null and d.scan_status in ('pending','scanning')
   and d.uploaded_by=auth.uid() and private.can_access_case(d.case_id))
$$;

revoke all on function private.has_role(text) from public,anon;
revoke all on function private.is_management() from public,anon;
revoke all on function private.can_access_case(uuid) from public,anon;
revoke all on function private.can_access_client(uuid) from public,anon;
revoke all on function private.can_access_document(text) from public,anon;
revoke all on function private.can_upload_document(text) from public,anon;
grant execute on function private.has_role(text),private.is_management(),private.can_access_case(uuid),
 private.can_access_client(uuid),private.can_access_document(text),private.can_upload_document(text)
 to authenticated;

create or replace function public.has_role(wanted text)
returns boolean language sql stable security invoker set search_path=pg_catalog,public,private as $$
 select private.has_role(wanted)
$$;
create or replace function public.is_management()
returns boolean language sql stable security invoker set search_path=pg_catalog,public,private as $$
 select private.is_management()
$$;
create or replace function public.can_access_case(target uuid)
returns boolean language sql stable security invoker set search_path=pg_catalog,public,private as $$
 select private.can_access_case(target)
$$;
create or replace function public.can_access_client(target uuid)
returns boolean language sql stable security invoker set search_path=pg_catalog,public,private as $$
 select private.can_access_client(target)
$$;
create or replace function public.can_access_document(path text)
returns boolean language sql stable security invoker set search_path=pg_catalog,public,private as $$
 select private.can_access_document(path)
$$;
create or replace function public.can_upload_document(path text)
returns boolean language sql stable security invoker set search_path=pg_catalog,public,private as $$
 select private.can_upload_document(path)
$$;

revoke all on function public.has_role(text),public.is_management(),public.can_access_case(uuid),
 public.can_access_client(uuid),public.can_access_document(text),public.can_upload_document(text)
 from public,anon;
grant execute on function public.has_role(text),public.is_management(),public.can_access_case(uuid),
 public.can_access_client(uuid),public.can_access_document(text),public.can_upload_document(text)
 to authenticated;

create or replace function private.bootstrap_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,auth as $$
declare display_name text;
begin
 display_name := coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name','');
 insert into public.profiles(id,full_name,email)
 values(new.id,display_name,coalesce(new.email,''))
 on conflict(id) do nothing;
 insert into public.user_roles(user_id,role_name)
 values(new.id,'client') on conflict(user_id,role_name) do nothing;
 if coalesce(new.email,'')<>'' then
   insert into public.clients(account_id,full_name,email)
   values(new.id,display_name,new.email) on conflict(account_id) do nothing;
 end if;
 return new;
end $$;
revoke all on function private.bootstrap_profile_for_auth_user() from public,anon,authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
 for each row execute function private.bootstrap_profile_for_auth_user();
drop function if exists public.bootstrap_profile_for_auth_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path=pg_catalog as $$
begin new.updated_at=now(); return new; end $$;
