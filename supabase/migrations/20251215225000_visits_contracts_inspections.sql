-- Visits, Contracts, and Inspections (go-live data sync).

-- =========================
-- Visits
-- =========================

create table if not exists public.visits (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  property_id text not null references public.properties(id) on delete cascade,
  contact_id text not null references public.contacts(id) on delete cascade,
  agent_id text not null,
  date text not null,
  start_time text not null,
  end_time text not null,
  status text not null default 'scheduled',
  confirmation_status text not null default 'pending',
  notes text not null default '',
  feedback jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visits_agency_date on public.visits(agency_id, date);
create index if not exists idx_visits_agency_property on public.visits(agency_id, property_id);
create index if not exists idx_visits_agency_contact on public.visits(agency_id, contact_id);
create index if not exists idx_visits_agency_created_at on public.visits(agency_id, created_at desc);

alter table if exists public.visits enable row level security;
create policy "visits_rw_member"
on public.visits for all
to authenticated
using (public.is_agency_member(visits.agency_id))
with check (public.is_agency_member(visits.agency_id));

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_visits_updated_at') then
    create trigger trg_visits_updated_at before update on public.visits
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- =========================
-- Contracts
-- =========================

create table if not exists public.contracts (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  property_id text not null references public.properties(id) on delete cascade,
  contact_id text null references public.contacts(id) on delete set null,
  deal_id text null,
  type text not null,
  property_category text not null,
  status text not null default 'draft',
  signature_method text null,
  auto_filled boolean not null default false,
  signed_at timestamptz null,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contracts_agency_created_at on public.contracts(agency_id, created_at desc);
create index if not exists idx_contracts_agency_property on public.contracts(agency_id, property_id);
create index if not exists idx_contracts_agency_type on public.contracts(agency_id, type);
create index if not exists idx_contracts_agency_status on public.contracts(agency_id, status);

alter table if exists public.contracts enable row level security;
create policy "contracts_rw_member"
on public.contracts for all
to authenticated
using (public.is_agency_member(contracts.agency_id))
with check (public.is_agency_member(contracts.agency_id));

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_contracts_updated_at') then
    create trigger trg_contracts_updated_at before update on public.contracts
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- =========================
-- Inspections (Etat des lieux, etc.)
-- =========================

create table if not exists public.inspections (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  type text not null,
  status text not null default 'draft',
  property_id text not null references public.properties(id) on delete cascade,
  landlord_id text not null references public.contacts(id) on delete cascade,
  tenant_id text not null references public.contacts(id) on delete cascade,
  scheduled_date text null,
  started_at timestamptz null,
  completed_at timestamptz null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inspections_agency_created_at on public.inspections(agency_id, created_at desc);
create index if not exists idx_inspections_agency_property on public.inspections(agency_id, property_id);
create index if not exists idx_inspections_agency_status on public.inspections(agency_id, status);

alter table if exists public.inspections enable row level security;
create policy "inspections_rw_member"
on public.inspections for all
to authenticated
using (public.is_agency_member(inspections.agency_id))
with check (public.is_agency_member(inspections.agency_id));

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_inspections_updated_at') then
    create trigger trg_inspections_updated_at before update on public.inspections
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- Storage bucket for inspection photos (private)
insert into storage.buckets (id, name, public)
values ('inspection-photos', 'inspection-photos', false)
on conflict (id) do nothing;
