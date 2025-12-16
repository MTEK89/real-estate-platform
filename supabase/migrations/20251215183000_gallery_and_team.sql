-- Gallery (photos + storage) and Team (invitations) for go-live.

-- Helper: check agency membership
create or replace function public.is_agency_member(p_agency_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.agency_users au
    where au.agency_id = p_agency_id
      and au.user_id = auth.uid()::text
  );
$$;

create or replace function public.is_agency_owner(p_agency_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.agency_users au
    where au.agency_id = p_agency_id
      and au.user_id = auth.uid()::text
      and au.role = 'owner'
  );
$$;

-- =========================
-- Gallery
-- =========================

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  agency_id text not null references public.agencies(id) on delete cascade,
  property_id text null references public.properties(id) on delete set null,
  filename text not null,
  path text not null,
  content_type text null,
  size bigint not null default 0,
  width integer null,
  height integer null,
  taken_at timestamptz null,
  tags jsonb not null default '[]'::jsonb,
  note text not null default '',
  favorite boolean not null default false,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(agency_id, path)
);

create index if not exists idx_photos_agency_created_at on public.photos(agency_id, created_at desc);
create index if not exists idx_photos_agency_property on public.photos(agency_id, property_id);

alter table if exists public.photos enable row level security;
create policy "photos_rw_member"
on public.photos for all
to authenticated
using (public.is_agency_member(photos.agency_id))
with check (public.is_agency_member(photos.agency_id));

-- Keep updated_at fresh
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_photos_updated_at') then
    create trigger trg_photos_updated_at before update on public.photos
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- Storage bucket (private)
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', false)
on conflict (id) do nothing;

-- NOTE:
-- We intentionally do not alter `storage.objects` policies from migrations in this repo
-- because some Supabase projects restrict ownership of `storage.objects` for non-superuser roles.
-- For go-live, we use signed upload/download URLs generated server-side with the service role key.

-- =========================
-- Team invitations
-- =========================

create table if not exists public.agency_invitations (
  id uuid primary key default gen_random_uuid(),
  agency_id text not null references public.agencies(id) on delete cascade,
  email text not null,
  role text not null default 'agent',
  invited_by_user_id text null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz null
);

create index if not exists idx_agency_invitations_agency_created_at on public.agency_invitations(agency_id, created_at desc);
create index if not exists idx_agency_invitations_email on public.agency_invitations(lower(email));

alter table if exists public.agency_invitations enable row level security;

-- Owners can manage invitations for their agency.
create policy "agency_invitations_owner_all"
on public.agency_invitations for all
to authenticated
using (public.is_agency_owner(agency_invitations.agency_id))
with check (public.is_agency_owner(agency_invitations.agency_id));

-- Invited users can see their own invites (by email claim) and accept them via RPC.
create policy "agency_invitations_select_self_email"
on public.agency_invitations for select
to authenticated
using (
  lower(agency_invitations.email) = lower(current_setting('request.jwt.claim.email', true))
);

-- Allow owners to view all agency members.
create policy "agency_users_select_owner"
on public.agency_users for select
to authenticated
using (public.is_agency_owner(agency_users.agency_id));

-- Allow owners to update member roles (but not change agency_id/user_id).
create policy "agency_users_update_owner"
on public.agency_users for update
to authenticated
using (public.is_agency_owner(agency_users.agency_id))
with check (
  public.is_agency_owner(agency_users.agency_id)
  and agency_users.agency_id = agency_users.agency_id
  and agency_users.user_id = agency_users.user_id
);

-- Allow owners to delete members (remove from agency).
create policy "agency_users_delete_owner"
on public.agency_users for delete
to authenticated
using (public.is_agency_owner(agency_users.agency_id));

-- Allow owners to read basic user profiles of their team.
create policy "users_select_agency_owner"
on public.users for select
to authenticated
using (
  exists (
    select 1
    from public.agency_users me
    join public.agency_users other on other.agency_id = me.agency_id
    where me.user_id = auth.uid()::text
      and me.role = 'owner'
      and other.user_id = users.id
  )
);

-- RPC: accept an invitation (email must match JWT claim).
create or replace function public.accept_agency_invitation(p_invite_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := auth.uid()::text;
  v_email text := lower(current_setting('request.jwt.claim.email', true));
  v_inv public.agency_invitations%rowtype;
  v_membership_id text;
begin
  if v_user_id is null or v_user_id = '' then
    raise exception 'not_authenticated';
  end if;
  if v_email is null or v_email = '' then
    raise exception 'missing_email_claim';
  end if;

  select *
    into v_inv
  from public.agency_invitations
  where id = p_invite_id
    and status = 'pending'
    and lower(email) = v_email
  limit 1;

  if not found then
    raise exception 'invalid_or_expired_invite';
  end if;

  -- Ensure a profile row exists in public.users
  insert into public.users (id, email, first_name, last_name, role)
  values (v_user_id, v_email, 'Agent', 'User', 'agent')
  on conflict (id) do nothing;

  v_membership_id := 'au_' || v_inv.agency_id || '_' || v_user_id;

  insert into public.agency_users (id, agency_id, user_id, role)
  values (v_membership_id, v_inv.agency_id, v_user_id, v_inv.role)
  on conflict (agency_id, user_id) do nothing;

  update public.agency_invitations
    set status = 'accepted',
        accepted_at = now()
  where id = p_invite_id;

  return jsonb_build_object('ok', true, 'agencyId', v_inv.agency_id, 'role', v_inv.role);
end;
$$;
