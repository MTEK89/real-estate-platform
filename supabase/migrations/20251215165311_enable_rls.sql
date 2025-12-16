-- Enable RLS and add baseline multi-tenant policies.
-- Note: service_role bypasses RLS (used by server-side admin operations).
-- These policies are for authenticated users (Supabase Auth) and will be used once the app is wired to auth.

-- Agencies
alter table if exists public.agencies enable row level security;
create policy "agencies_select_member"
on public.agencies for select
to authenticated
using (
  exists (
    select 1
    from public.agency_users au
    where au.agency_id = agencies.id
      and au.user_id = auth.uid()::text
  )
);

-- Users (self access)
alter table if exists public.users enable row level security;
create policy "users_select_self"
on public.users for select
to authenticated
using (users.id = auth.uid()::text);

create policy "users_update_self"
on public.users for update
to authenticated
using (users.id = auth.uid()::text)
with check (users.id = auth.uid()::text);

-- Agency membership table
alter table if exists public.agency_users enable row level security;
create policy "agency_users_select_self_memberships"
on public.agency_users for select
to authenticated
using (agency_users.user_id = auth.uid()::text);

-- Contacts
alter table if exists public.contacts enable row level security;
create policy "contacts_rw_member"
on public.contacts for all
to authenticated
using (
  exists (
    select 1
    from public.agency_users au
    where au.agency_id = contacts.agency_id
      and au.user_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1
    from public.agency_users au
    where au.agency_id = contacts.agency_id
      and au.user_id = auth.uid()::text
  )
);

-- Properties
alter table if exists public.properties enable row level security;
create policy "properties_rw_member"
on public.properties for all
to authenticated
using (
  exists (
    select 1
    from public.agency_users au
    where au.agency_id = properties.agency_id
      and au.user_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1
    from public.agency_users au
    where au.agency_id = properties.agency_id
      and au.user_id = auth.uid()::text
  )
);

-- Tasks
alter table if exists public.tasks enable row level security;
create policy "tasks_rw_member"
on public.tasks for all
to authenticated
using (
  exists (
    select 1
    from public.agency_users au
    where au.agency_id = tasks.agency_id
      and au.user_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1
    from public.agency_users au
    where au.agency_id = tasks.agency_id
      and au.user_id = auth.uid()::text
  )
);

-- Audit logs (read-only for members; writes should be server-side)
alter table if exists public.audit_logs enable row level security;
create policy "audit_logs_select_member"
on public.audit_logs for select
to authenticated
using (
  exists (
    select 1
    from public.agency_users au
    where au.agency_id = audit_logs.agency_id
      and au.user_id = auth.uid()::text
  )
);
