-- M7: customer accounts (email OTP auth), addresses, saved cakes.
-- orders.customer_id and draft_orders.customer_id already exist (added in
-- 0002/0004) but were never FK'd since auth.users-backed customers didn't
-- exist yet — add those constraints now that customer_profiles does.

create table customer_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  phone text,
  allergen_defaults text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table customer_profiles enable row level security;

create policy "owners can select their own profile" on customer_profiles
  for select using (id = auth.uid());
create policy "owners can insert their own profile" on customer_profiles
  for insert with check (id = auth.uid());
create policy "owners can update their own profile" on customer_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create table customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  -- Matches the free-text { text: "..." } shape orders.delivery_address
  -- already uses (see ManualOrderForm/checkout) rather than structured
  -- street/city fields.
  address jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index customer_addresses_customer_id_idx on customer_addresses (customer_id);
alter table customer_addresses enable row level security;

create policy "owners can manage their own addresses" on customer_addresses
  for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create table saved_cakes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id) on delete cascade,
  cake_id uuid not null references cakes (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (customer_id, cake_id)
);

create index saved_cakes_customer_id_idx on saved_cakes (customer_id);
alter table saved_cakes enable row level security;

create policy "owners can manage their own saved cakes" on saved_cakes
  for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

alter table orders
  add constraint orders_customer_id_fkey foreign key (customer_id) references auth.users (id);
alter table draft_orders
  add constraint draft_orders_customer_id_fkey foreign key (customer_id) references auth.users (id);
