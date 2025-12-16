-- Operational + Marketing documents (go-live).

-- =========================
-- Operational documents
-- =========================

create table if not exists public.operational_documents (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  property_id text not null references public.properties(id) on delete cascade,
  contact_id text null references public.contacts(id) on delete set null,
  contract_id text null references public.contracts(id) on delete set null,
  type text not null,
  sub_type text null,
  status text not null default 'draft',
  scheduled_at timestamptz null,
  completed_at timestamptz null,
  data jsonb not null default '{}'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_operational_documents_agency_created_at on public.operational_documents(agency_id, created_at desc);
create index if not exists idx_operational_documents_agency_property on public.operational_documents(agency_id, property_id);
create index if not exists idx_operational_documents_agency_type on public.operational_documents(agency_id, type);

alter table if exists public.operational_documents enable row level security;
create policy "operational_documents_rw_member"
on public.operational_documents for all
to authenticated
using (public.is_agency_member(operational_documents.agency_id))
with check (public.is_agency_member(operational_documents.agency_id));

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_operational_documents_updated_at') then
    create trigger trg_operational_documents_updated_at before update on public.operational_documents
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- =========================
-- Marketing documents
-- =========================

create table if not exists public.marketing_documents (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  property_id text null references public.properties(id) on delete set null,
  type text not null,
  title text not null,
  description text not null default '',
  version integer not null default 1,
  status text not null default 'draft',
  data jsonb not null default '{}'::jsonb,
  file_path text null,
  generated_at timestamptz null,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketing_documents_agency_created_at on public.marketing_documents(agency_id, created_at desc);
create index if not exists idx_marketing_documents_agency_property on public.marketing_documents(agency_id, property_id);
create index if not exists idx_marketing_documents_agency_type on public.marketing_documents(agency_id, type);

alter table if exists public.marketing_documents enable row level security;
create policy "marketing_documents_rw_member"
on public.marketing_documents for all
to authenticated
using (public.is_agency_member(marketing_documents.agency_id))
with check (public.is_agency_member(marketing_documents.agency_id));

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_marketing_documents_updated_at') then
    create trigger trg_marketing_documents_updated_at before update on public.marketing_documents
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- =========================
-- Generated files bucket (private)
-- =========================

insert into storage.buckets (id, name, public)
values ('generated-documents', 'generated-documents', false)
on conflict (id) do nothing;

-- NOTE: We do not alter storage.objects policies here; server uses service role + signed URLs.
