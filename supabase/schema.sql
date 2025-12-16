-- Minimal schema for this platform (demo + enterprise-ready base).
-- Run this in Supabase SQL editor.

create table if not exists public.agencies (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id text primary key,
  email text unique not null,
  first_name text not null,
  last_name text not null,
  role text not null default 'agent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agency_users (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  role text not null default 'agent',
  created_at timestamptz not null default now(),
  unique(agency_id, user_id)
);

create table if not exists public.contacts (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  type text not null,
  first_name text not null,
  last_name text not null,
  email text null,
  phone text null,
  source text not null default 'Manual',
  status text not null default 'new',
  assigned_to text null,
  tags jsonb not null default '[]'::jsonb,
  notes text not null default '',
  last_contact_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_agency_created_at on public.contacts(agency_id, created_at desc);
create index if not exists idx_contacts_agency_type on public.contacts(agency_id, type);
create index if not exists idx_contacts_agency_status on public.contacts(agency_id, status);

create table if not exists public.properties (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  reference text not null,
  status text not null,
  type text not null,
  address jsonb not null default '{}'::jsonb,
  characteristics jsonb not null default '{}'::jsonb,
  price double precision not null default 0,
  owner_id text not null,
  tags jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_properties_agency_created_at on public.properties(agency_id, created_at desc);
create index if not exists idx_properties_agency_status on public.properties(agency_id, status);
create index if not exists idx_properties_agency_reference on public.properties(agency_id, reference);

create table if not exists public.tasks (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  title text not null,
  description text not null default '',
  assigned_to text not null,
  related_to jsonb null,
  priority text not null default 'medium',
  status text not null default 'todo',
  due_date text not null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_agency_status on public.tasks(agency_id, status);
create index if not exists idx_tasks_agency_due_date on public.tasks(agency_id, due_date);
create index if not exists idx_tasks_agency_created_at on public.tasks(agency_id, created_at desc);

create table if not exists public.audit_logs (
  id bigserial primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  actor_user_id text null,
  action text not null,
  entity_type text not null,
  entity_id text null,
  before jsonb null,
  after jsonb null,
  ip text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_agency_created_at on public.audit_logs(agency_id, created_at desc);
create index if not exists idx_audit_logs_agency_entity on public.audit_logs(agency_id, entity_type);

-- Optional: keep updated_at fresh automatically
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_contacts_updated_at') then
    create trigger trg_contacts_updated_at before update on public.contacts
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_properties_updated_at') then
    create trigger trg_properties_updated_at before update on public.properties
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_tasks_updated_at') then
    create trigger trg_tasks_updated_at before update on public.tasks
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_users_updated_at') then
    create trigger trg_users_updated_at before update on public.users
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_agencies_updated_at') then
    create trigger trg_agencies_updated_at before update on public.agencies
    for each row execute function public.set_updated_at();
  end if;
end $$;

