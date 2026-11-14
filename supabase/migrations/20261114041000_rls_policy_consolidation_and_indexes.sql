-- Consolidate intentionally distinct client/staff pathways into single
-- permissive policies per command and add indexes for remaining foreign keys.
drop policy if exists applicants_client_add_own on public.case_applicants;
drop policy if exists applicants_management_insert on public.case_applicants;
create policy applicants_insert_authorized on public.case_applicants for insert to authenticated
with check (created_by=auth.uid() and public.can_access_case(case_id));

drop policy if exists cases_admin_or_ops_insert on public.cases;
drop policy if exists cases_client_create_enquiry on public.cases;
create policy cases_insert_authorized_intake on public.cases for insert to authenticated
with check (
 (public.has_role('administrator') or public.has_role('operations_manager'))
 or
 (status='new_enquiry' and case_manager_id is null and visa_advisor_id is null
  and submitted_at is null and created_by=auth.uid()
  and exists(select 1 from public.clients cl where cl.id=client_id and cl.account_id=auth.uid()))
);

drop policy if exists clients_case_manager_write on public.clients;
drop policy if exists clients_update_own on public.clients;
create policy clients_update_own_or_case on public.clients for update to authenticated
using (
 account_id=auth.uid()
 or public.has_role('administrator') or public.has_role('operations_manager')
 or exists(select 1 from public.cases c where c.client_id=id
   and public.can_access_case(c.id) and public.is_management())
)
with check (
 account_id=auth.uid()
 or public.has_role('administrator') or public.has_role('operations_manager')
 or exists(select 1 from public.cases c where c.client_id=id
   and public.can_access_case(c.id) and public.is_management())
);
revoke update on public.clients from authenticated;
grant update(full_name,email,phone) on public.clients to authenticated;

drop policy if exists messages_author_insert on public.messages;
drop policy if exists messages_client_send on public.messages;
create policy messages_insert_authorized on public.messages for insert to authenticated
with check (
 author_id=auth.uid() and public.can_access_case(case_id)
 and (visibility='client' or (visibility='internal' and public.is_management()))
);

do $$
declare fk record;
declare idx_name text;
begin
 for fk in
  select c.conrelid,c.conname,c.conkey,
    string_agg(format('%I',a.attname),',' order by k.ordinality) as cols,
    c.conrelid::regclass as relation_name,
    c.conrelid::regclass::text as table_name
  from pg_constraint c
  cross join lateral unnest(c.conkey) with ordinality as k(attnum,ordinality)
  join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum
  where c.contype='f' and c.connamespace='public'::regnamespace
  group by c.conrelid,c.conname,c.conkey
 loop
  if not exists(
    select 1 from pg_index i
    where i.indrelid=fk.conrelid and i.indisvalid and i.indpred is null
      and (select array_agg(u.attnum::smallint order by u.ordinality)
           from unnest(i.indkey::smallint[]) with ordinality as u(attnum,ordinality)
           where u.ordinality<=cardinality(fk.conkey))=fk.conkey
  ) then
    idx_name:=left('idx_'||replace(fk.table_name,'.','_')||'_'||fk.conname,63);
    execute format('create index if not exists %I on %s (%s)',idx_name,fk.relation_name,fk.cols);
  end if;
 end loop;
end $$;
