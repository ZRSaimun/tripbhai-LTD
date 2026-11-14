begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

create temp table portal_fixture_ids(kind text primary key, id uuid not null);
insert into portal_fixture_ids values
 ('client_a','10000000-0000-4000-8000-000000000001'),
 ('client_b','10000000-0000-4000-8000-000000000002'),
 ('finance','10000000-0000-4000-8000-000000000003'),
 ('case_a','20000000-0000-4000-8000-000000000001'),
 ('case_b','20000000-0000-4000-8000-000000000002'),
 ('doc_pending','30000000-0000-4000-8000-000000000001'),
 ('quote_a','40000000-0000-4000-8000-000000000001');

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,
 raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'authenticated','authenticated',kind||'@rls-test.invalid','',
 now(),'{"provider":"email","providers":["email"]}','{"full_name":"RLS fixture"}',now(),now()
from portal_fixture_ids where kind in ('client_a','client_b','finance');

insert into public.user_roles(user_id,role_name)
select id,'finance_manager' from portal_fixture_ids where kind='finance';

insert into public.cases(id,client_id,destination_country,service_type,status,created_by)
select f.id,c.id,'France','Schengen visa application support','new_enquiry',c.account_id
from portal_fixture_ids f
join public.clients c on c.account_id=(select id from portal_fixture_ids where kind=case f.kind when 'case_a' then 'client_a' else 'client_b' end)
where f.kind in ('case_a','case_b');

insert into public.documents(id,case_id,original_filename,mime_type,file_size,storage_path,uploaded_by,scan_status)
select f.id,c.id,'sample.pdf','application/pdf',12,'case-test/'||f.id::text||'/sample.pdf',c.account_id,'pending'
from portal_fixture_ids f
join public.cases c on c.id=f.id
join public.clients cl on cl.id=c.client_id
where f.kind='doc_pending';

insert into public.messages(case_id,author_id,visibility,body)\nselect c.id,cl.account_id,'internal','private note' from public.cases c join public.clients cl on cl.id=c.client_id\nwhere c.id=(select id from portal_fixture_ids where kind='case_a')\nunion all\nselect c.id,cl.account_id,'client','client B message' from public.cases c join public.clients cl on cl.id=c.client_id\nwhere c.id=(select id from portal_fixture_ids where kind='case_b');\n\ninsert into public.quotes(id,case_id,currency,amount_minor,status)
select q.id,c.id,'GBP',1000,'sent'
from portal_fixture_ids q, portal_fixture_ids f join public.cases c on c.id=f.id
where q.kind='quote_a' and f.kind='case_a';

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub',(select id::text from portal_fixture_ids where kind='client_a'),true);
select is((select count(*)::int from public.cases),1,'client reads only their own case');
select is((select count(*)::int from public.messages),0,'client cannot read another case or internal notes');
select ok(not public.can_access_document('case-test/20000000-0000-4000-8000-000000000001/sample.pdf'),'unscanned file is not downloadable');
select throws_ok(
 $$insert into public.cases(client_id,destination_country,service_type,status,created_by)
   select id,'Canada','Visitor visa application support','new_enquiry',
   (select id from portal_fixture_ids where kind='client_a')
   from public.clients where account_id=(select id from portal_fixture_ids where kind='client_b')$$,
 '42501',null,'client cannot create a case for another client');

reset role;
select set_config('request.jwt.claim.sub',(select id::text from portal_fixture_ids where kind='finance'),true);
set local role authenticated;
select is((select count(*)::int from public.cases),0,'finance role cannot browse client case records');
select is((select count(*)::int from public.quotes),1,'finance role can read quotations');
reset role;

select * from finish();
rollback;
