-- TripBhai secure portal foundation. Apply only to a new, dedicated Supabase project.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  preferred_language text not null default 'en' check (preferred_language in ('en','bn')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  name text primary key check (name in ('administrator','case_manager','visa_advisor','travel_coordinator','operations_manager','finance_manager','client')),
  label text not null
);
insert into public.roles(name,label) values
 ('administrator','Administrator'),('case_manager','TripBhai Case Manager'),
 ('visa_advisor','Visa Advisor'),('travel_coordinator','Travel Coordinator'),
 ('operations_manager','Operations Manager'),('finance_manager','Finance Manager'),('client','Client')
on conflict do nothing;

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_name text not null references public.roles(name),
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key(user_id,role_name)
);

create or replace function public.has_role(wanted text)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles r where r.user_id=auth.uid()
    and r.role_name=wanted and r.revoked_at is null)
$$;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  account_id uuid unique references public.profiles(id),
  full_name text not null,
  email text not null,
  phone text,
  archived_at timestamptz,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id),
  title text not null,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('TB-' || upper(substr(encode(gen_random_bytes(6),'hex'),1,10))),
  client_id uuid not null references public.clients(id),
  destination_country text not null,
  service_type text not null,
  nationality text,
  application_country text,
  intended_travel_start date,
  intended_travel_end date,
  status text not null default 'new_enquiry' check(status in ('new_enquiry','information_required','documents_requested','documents_received','document_review','checklist_prepared','application_preparation','client_review','ready_for_external_submission','submitted','waiting_for_decision','decision_received','completed','withdrawn','closed')),
  priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
  case_manager_id uuid references public.profiles(id),
  visa_advisor_id uuid references public.profiles(id),
  next_client_action text,
  external_reference text,
  submitted_at timestamptz,
  archived_at timestamptz,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (intended_travel_end is null or intended_travel_start is null or intended_travel_end >= intended_travel_start),
  check ((status <> 'submitted' and submitted_at is null) or (status = 'submitted' and submitted_at is not null))
);

create table public.case_applicants (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  linked_client_id uuid references public.clients(id),
  full_name text not null,
  date_of_birth date,
  nationality text,
  is_primary boolean not null default false,
  authority_record text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_access (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  access_scope text not null check(access_scope in ('read','work','finance')),
  reason text not null,
  granted_by uuid not null references public.profiles(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(case_id,user_id)
);

create or replace function public.can_access_case(target uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(
   select 1 from public.cases c
   join public.clients cl on cl.id=c.client_id
   where c.id=target and c.archived_at is null and (
     cl.account_id=auth.uid()
     or public.has_role('administrator')
     or public.has_role('operations_manager')
     or c.case_manager_id=auth.uid()
     or c.visa_advisor_id=auth.uid()
     or exists(select 1 from public.case_access a where a.case_id=c.id and a.user_id=auth.uid()
       and a.revoked_at is null and a.access_scope in ('read','work'))
   )
 )
$$;

create table public.visa_applications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.cases(id) on delete cascade,
  destination_country text not null,
  application_country text not null,
  visa_type text not null,
  authority_name text,
  external_reference text,
  status text not null default 'preparation',
  submitted_by uuid references public.profiles(id),
  submitted_at timestamptz,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.visa_checklists (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  version integer not null default 1,
  title text not null,
  source_urls text[] not null default '{}',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  client_visible boolean not null default false,
  archived_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(case_id,version)
);
create table public.visa_checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.visa_checklists(id) on delete cascade,
  applicant_id uuid references public.case_applicants(id) on delete cascade,
  label text not null,
  instructions text not null default '',
  status text not null default 'requested' check(status in ('requested','uploaded','under_review','accepted','replacement_needed','not_applicable')),
  due_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  applicant_id uuid references public.case_applicants(id),
  checklist_item_id uuid references public.visa_checklist_items(id),
  original_filename text not null,
  mime_type text not null check(mime_type in ('application/pdf','image/jpeg','image/png')),
  file_size bigint not null check(file_size between 1 and 10485760),
  storage_path text not null unique,
  uploaded_by uuid not null references public.profiles(id),
  source text not null default 'portal',
  scan_status text not null default 'pending' check(scan_status in ('pending','scanning','clean','infected','failed')),
  review_status text not null default 'uploaded' check(review_status in ('uploaded','scanning','checking','accepted','needs_replacement','expired','rejected','archived')),
  client_visible boolean not null default true,
  staff_note text,
  replacement_reason text,
  current_version integer not null default 1,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version integer not null,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  file_size bigint not null,
  sha256 text,
  uploaded_by uuid not null references public.profiles(id),
  replacement_reason text,
  created_at timestamptz not null default now(),
  unique(document_id,version)
);
create table public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  outcome text not null check(outcome in ('accepted','needs_replacement','rejected','expired','checking')),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check(length(body) between 1 and 10000),
  visibility text not null default 'client' check(visibility in ('client','internal')),
  created_at timestamptz not null default now()
);
create table public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check(length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id),
  title text not null,
  description text not null default '',
  assignee_id uuid references public.profiles(id),
  due_at timestamptz,
  status text not null default 'open' check(status in ('open','in_progress','done','cancelled')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Europe/London',
  format text not null,
  status text not null default 'scheduled' check(status in ('scheduled','cancelled','completed')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(ends_at > starts_at)
);
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  currency char(3) not null default 'GBP',
  amount_minor bigint not null check(amount_minor >= 0),
  external_cost_minor bigint not null default 0 check(external_cost_minor >= 0),
  conditions text not null default '',
  expires_at timestamptz,
  status text not null default 'draft' check(status in ('draft','sent','accepted','declined','expired')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  amount_minor bigint not null check(amount_minor > 0),
  currency char(3) not null default 'GBP',
  reference text not null,
  method text not null default 'manual',
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  case_id uuid references public.cases(id),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table public.success_stories (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  public_title text not null,
  redacted_asset_path text,
  consent_id uuid,
  published_at timestamptz,
  published_by uuid references public.profiles(id),
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  case_id uuid references public.cases(id),
  purpose text not null,
  granted_at timestamptz,
  withdrawn_at timestamptz,
  evidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  title text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.oauth_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check(provider in ('google','azure','facebook','email')),
  provider_subject text,
  created_at timestamptz not null default now(),
  unique(provider,provider_subject)
);

create or replace function public.is_management()
returns boolean language sql stable security definer set search_path=public as $$
 select public.has_role('administrator') or public.has_role('operations_manager')
   or public.has_role('case_manager') or public.has_role('visa_advisor')
   or public.has_role('travel_coordinator') or public.has_role('finance_manager')
$$;
create or replace function public.can_access_document(path text)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.documents d where d.storage_path=path and d.archived_at is null
   and (public.can_access_case(d.case_id) or public.has_role('finance_manager')))
$$;

alter table public.profiles enable row level security;
create policy profiles_read_self_or_management on public.profiles for select using (id=auth.uid() or public.is_management());
create policy profiles_update_self on public.profiles for update using (id=auth.uid()) with check (id=auth.uid());
alter table public.roles enable row level security;
create policy roles_read_authenticated on public.roles for select to authenticated using (true);
alter table public.user_roles enable row level security;
create policy user_roles_read_self_or_admin on public.user_roles for select using (user_id=auth.uid() or public.has_role('administrator'));
create policy user_roles_admin_manage on public.user_roles for all using (public.has_role('administrator')) with check (public.has_role('administrator'));

alter table public.clients enable row level security;
create policy clients_read_own_or_management on public.clients for select using (account_id=auth.uid() or public.is_management());
create policy clients_management_write on public.clients for all using (public.is_management()) with check (public.is_management());
alter table public.staff_members enable row level security;
create policy staff_members_management on public.staff_members for all using (public.is_management()) with check (public.is_management());
alter table public.cases enable row level security;
create policy cases_read_authorized on public.cases for select using (public.can_access_case(id) or public.has_role('finance_manager'));
create policy cases_management_insert on public.cases for insert with check (public.is_management());
create policy cases_management_update on public.cases for update using (public.is_management()) with check (public.is_management());
alter table public.case_access enable row level security;
create policy case_access_authorized_read on public.case_access for select using (public.can_access_case(case_id) or public.has_role('administrator'));
create policy case_access_admin_manage on public.case_access for all using (public.has_role('administrator')) with check (public.has_role('administrator'));

alter table public.case_applicants enable row level security;
create policy applicants_case_access on public.case_applicants for select using (public.can_access_case(case_id) or public.has_role('finance_manager'));
create policy applicants_management_write on public.case_applicants for all using (public.is_management()) with check (public.is_management());
alter table public.visa_applications enable row level security;
create policy visa_application_case_access on public.visa_applications for select using (public.can_access_case(case_id));
create policy visa_application_management_write on public.visa_applications for all using (public.is_management()) with check (public.is_management());
alter table public.visa_checklists enable row level security;
create policy checklists_visible_or_management on public.visa_checklists for select using ((client_visible and public.can_access_case(case_id)) or public.is_management());
create policy checklists_management_write on public.visa_checklists for all using (public.is_management()) with check (public.is_management());
alter table public.visa_checklist_items enable row level security;
create policy checklist_items_visible_or_management on public.visa_checklist_items for select using (
 exists(select 1 from public.visa_checklists v where v.id=checklist_id and
 ((v.client_visible and public.can_access_case(v.case_id)) or public.is_management())));
create policy checklist_items_management_write on public.visa_checklist_items for all using (public.is_management()) with check (public.is_management());

alter table public.documents enable row level security;
create policy documents_case_read on public.documents for select using (
 (public.can_access_case(case_id) and (client_visible or public.is_management())) or public.has_role('finance_manager'));
create policy documents_client_upload on public.documents for insert with check (
 uploaded_by=auth.uid() and public.can_access_case(case_id) and not public.is_management());
create policy documents_management_write on public.documents for all using (public.is_management()) with check (public.is_management());
alter table public.document_versions enable row level security;
create policy document_versions_parent_access on public.document_versions for select using (
 exists(select 1 from public.documents d where d.id=document_id and
 (public.can_access_case(d.case_id) or public.has_role('finance_manager'))));
create policy document_versions_management_write on public.document_versions for all using (public.is_management()) with check (public.is_management());
alter table public.document_reviews enable row level security;
create policy document_reviews_management_read on public.document_reviews for select using (public.is_management());
create policy document_reviews_management_write on public.document_reviews for all using (public.is_management()) with check (public.is_management());

alter table public.messages enable row level security;
create policy messages_case_read on public.messages for select using (
 public.can_access_case(case_id) and (visibility='client' or public.is_management()));
create policy messages_author_insert on public.messages for insert with check (
 author_id=auth.uid() and public.can_access_case(case_id) and
 (visibility='client' or public.is_management()));
alter table public.internal_notes enable row level security;
create policy internal_notes_management on public.internal_notes for all using (public.is_management()) with check (public.is_management());
alter table public.tasks enable row level security;
create policy tasks_management on public.tasks for all using (public.is_management()) with check (public.is_management());
alter table public.appointments enable row level security;
create policy appointments_case_access on public.appointments for select using (public.can_access_case(case_id));
create policy appointments_management_write on public.appointments for all using (public.is_management()) with check (public.is_management());
alter table public.quotes enable row level security;
create policy quotes_client_or_finance on public.quotes for select using (
 (public.can_access_case(case_id) and status <> 'draft') or public.has_role('administrator')
 or public.has_role('operations_manager') or public.has_role('finance_manager'));
create policy quotes_finance_write on public.quotes for all using (
 public.has_role('administrator') or public.has_role('operations_manager') or public.has_role('finance_manager'))
 with check (public.has_role('administrator') or public.has_role('operations_manager') or public.has_role('finance_manager'));
alter table public.payments enable row level security;
create policy payments_finance_read on public.payments for select using (
 public.has_role('administrator') or public.has_role('operations_manager') or public.has_role('finance_manager'));
create policy payments_finance_write on public.payments for all using (
 public.has_role('administrator') or public.has_role('operations_manager') or public.has_role('finance_manager'))
 with check (public.has_role('administrator') or public.has_role('operations_manager') or public.has_role('finance_manager'));
alter table public.audit_events enable row level security;
create policy audit_admin_read on public.audit_events for select using (public.has_role('administrator'));
create policy audit_actor_insert on public.audit_events for insert with check (actor_id=auth.uid());
alter table public.success_stories enable row level security;
create policy stories_management on public.success_stories for all using (public.is_management()) with check (public.is_management());
alter table public.consents enable row level security;
create policy consent_client_or_management_read on public.consents for select using (
 exists(select 1 from public.clients c where c.id=client_id and c.account_id=auth.uid()) or public.is_management());
create policy consent_management_write on public.consents for all using (public.is_management()) with check (public.is_management());
alter table public.notifications enable row level security;
create policy notifications_owner on public.notifications for all using (user_id=auth.uid()) with check (user_id=auth.uid());
alter table public.oauth_identities enable row level security;
create policy oauth_identity_owner_or_admin on public.oauth_identities for select using (user_id=auth.uid() or public.has_role('administrator'));
create policy oauth_identity_admin_write on public.oauth_identities for all using (public.has_role('administrator')) with check (public.has_role('administrator'));

do $$
declare t text;
begin
 foreach t in array array['profiles','clients','staff_members','cases','case_applicants','visa_applications','visa_checklists','visa_checklist_items','documents','internal_notes','tasks','appointments','quotes','consents','success_stories'] loop
   execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',t);
 end loop;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('client-documents','client-documents',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

create policy client_documents_read on storage.objects for select to authenticated
using (bucket_id='client-documents' and public.can_access_document(name));
create policy client_documents_upload on storage.objects for insert to authenticated
with check (bucket_id='client-documents' and
 (public.has_role('administrator') or public.has_role('operations_manager') or public.can_access_document(name)));
create policy client_documents_delete_admin on storage.objects for delete to authenticated
using (bucket_id='client-documents' and public.has_role('administrator'));

-- Do not seed privileged accounts. Provision the first administrator out-of-band
-- after project ownership, MFA, and identity have been verified.
