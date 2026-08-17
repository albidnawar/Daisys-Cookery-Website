-- The "cake configuration currently in progress" — created when a customer
-- starts customising or hits "Add to basket", updated on every wizard step,
-- and promoted to a real `orders` row at checkout (see the M5 migration).
--
-- customer_id and slot_id intentionally have no FK yet: customer_profiles
-- (M7/auth) and delivery_slots (M4) don't exist until later migrations.
-- Add the FK constraints there once those tables land.

create table draft_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,
  session_token text,
  cake_id uuid references cakes (id),
  spec jsonb not null default '{}',
  computed_price jsonb not null default '{}',
  fulfilment_type text check (fulfilment_type in ('pickup', 'delivery')),
  zone_id uuid,
  delivery_address jsonb,
  slot_id uuid,
  status text not null default 'active' check (
    status in ('active', 'converted', 'abandoned')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);

create index draft_orders_customer_id_idx on draft_orders (customer_id);
create index draft_orders_session_token_idx on draft_orders (session_token);

-- All draft-order reads/writes go through the app's own API routes (using
-- the service-role client), which authorize against the session_token
-- cookie or the signed-in customer_id themselves — a guest has no
-- auth.uid() for Postgres RLS to key off. RLS stays enabled as a backstop
-- so the anon key alone (e.g. a leaked client-side query) can never read or
-- write another customer's draft; only a signed-in owner can select it
-- directly.
alter table draft_orders enable row level security;

create policy "owners can select their own drafts" on draft_orders
  for select using (customer_id = auth.uid());
