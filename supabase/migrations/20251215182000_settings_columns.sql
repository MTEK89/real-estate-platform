-- Add minimal settings columns for go-live.

alter table if exists public.agencies
  add column if not exists settings jsonb not null default '{}'::jsonb;

alter table if exists public.users
  add column if not exists phone text null,
  add column if not exists settings jsonb not null default '{}'::jsonb;

