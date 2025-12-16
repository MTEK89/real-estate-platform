-- Seed demo data (idempotent).
-- Safe to run multiple times.

insert into public.agencies (id, name)
values ('a1', 'PropFlow Realty')
on conflict (id) do update set name = excluded.name;

insert into public.users (id, email, first_name, last_name, role)
values ('u1', 'sarah.johnson@propflow.com', 'Sarah', 'Johnson', 'agent')
on conflict (id) do update set
  email = excluded.email,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  role = excluded.role;

insert into public.agency_users (id, agency_id, user_id, role)
values ('au_a1_u1', 'a1', 'u1', 'agent')
on conflict (agency_id, user_id) do update set role = excluded.role;

insert into public.contacts (id, agency_id, type, first_name, last_name, email, phone, source, status, assigned_to, tags, notes, last_contact_at)
values
  ('c1','a1','buyer','Michael','Chen','michael.chen@email.com','+352 621 123 456','Website','new','u1','["luxembourg","buyer"]'::jsonb,'Interested in apartments near city center', now()),
  ('c2','a1','seller','Emma','Muller','emma.muller@email.com','+352 621 234 567','Referral','contacted','u1','["seller","luxembourg"]'::jsonb,'Wants to sell within 3 months', now()),
  ('c3','a1','lead','David','Schmit','david.schmit@email.com','+352 621 345 678','Open House','qualified','u1','["lead"]'::jsonb,'Asked for valuation and brochure', now())
on conflict (id) do nothing;

insert into public.properties (id, agency_id, reference, status, type, address, characteristics, price, owner_id, tags, images)
values
  (
    'p1','a1','PROP-001','published','apartment',
    '{"street":"10 Avenue Monterey","city":"Luxembourg","postalCode":"L-2163","country":"Luxembourg"}'::jsonb,
    '{"surface":111,"rooms":4,"bedrooms":2,"bathrooms":2,"yearBuilt":2019,"condition":"Excellent"}'::jsonb,
    895000,'c2','["downtown","modern"]'::jsonb,'[]'::jsonb
  ),
  (
    'p2','a1','PROP-002','draft','house',
    '{"street":"2 Rue du Fort Bourbon","city":"Luxembourg","postalCode":"L-1249","country":"Luxembourg"}'::jsonb,
    '{"surface":220,"rooms":6,"bedrooms":4,"bathrooms":2,"yearBuilt":2015,"condition":"Very Good"}'::jsonb,
    1450000,'c2','["family-home"]'::jsonb,'[]'::jsonb
  )
on conflict (id) do nothing;

insert into public.tasks (id, agency_id, title, description, assigned_to, related_to, priority, status, due_date)
values
  ('t1','a1','Call seller Emma Muller','Follow up on mandate and documents','u1','{"type":"contact","id":"c2"}'::jsonb,'high','todo',to_char(now()::date + 1,'YYYY-MM-DD')),
  ('t2','a1','Prepare brochure for PROP-001','Generate brochure and watermark images','u1','{"type":"property","id":"p1"}'::jsonb,'medium','in_progress',to_char(now()::date + 2,'YYYY-MM-DD'))
on conflict (id) do nothing;
