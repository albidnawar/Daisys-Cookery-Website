-- A saved directory of delivery riders (name + phone) so the admin can pick
-- one when assigning an order's "Delivery person name/phone" (see
-- orders.rider_name/rider_phone, added in 0027_orders_rider_assignment.sql)
-- instead of retyping the same number every time. Admin-only, like the
-- rest of the Logistics module — no public read policy.

create table riders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  created_at timestamptz not null default now()
);

alter table riders enable row level security;
