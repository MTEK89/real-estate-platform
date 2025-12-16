-- Invoices + persisted PDF metadata for contracts.

-- =========================
-- Contracts: persisted PDF + stored payload
-- =========================

alter table if exists public.contracts
  add column if not exists data jsonb not null default '{}'::jsonb;

alter table if exists public.contracts
  add column if not exists file_path text null;

alter table if exists public.contracts
  add column if not exists generated_at timestamptz null;

create index if not exists idx_contracts_agency_generated_at on public.contracts(agency_id, generated_at desc);

-- =========================
-- Invoices
-- =========================

create table if not exists public.invoices (
  id text primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  contact_id text null references public.contacts(id) on delete set null,
  deal_id text null,
  invoice_number text not null,
  issue_date text not null,
  due_date text not null,
  currency text not null default 'EUR',
  status text not null default 'draft',
  paid_at timestamptz null,
  payload jsonb not null default '{}'::jsonb,
  file_path text null,
  generated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_agency_created_at on public.invoices(agency_id, created_at desc);
create index if not exists idx_invoices_agency_status on public.invoices(agency_id, status);
create index if not exists idx_invoices_agency_due_date on public.invoices(agency_id, due_date);
create index if not exists idx_invoices_agency_contact on public.invoices(agency_id, contact_id);
create index if not exists idx_invoices_agency_generated_at on public.invoices(agency_id, generated_at desc);

alter table if exists public.invoices enable row level security;

create policy "invoices_rw_member"
on public.invoices for all
to authenticated
using (public.is_agency_member(invoices.agency_id))
with check (public.is_agency_member(invoices.agency_id));

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_invoices_updated_at') then
    create trigger trg_invoices_updated_at before update on public.invoices
    for each row execute function public.set_updated_at();
  end if;
end $$;

