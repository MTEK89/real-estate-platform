-- Allow agency owners to update agency settings/details (RLS).

create policy "agencies_update_owner"
on public.agencies for update
to authenticated
using (
  exists (
    select 1
    from public.agency_users au
    where au.agency_id = agencies.id
      and au.user_id = auth.uid()::text
      and au.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.agency_users au
    where au.agency_id = agencies.id
      and au.user_id = auth.uid()::text
      and au.role = 'owner'
  )
);

