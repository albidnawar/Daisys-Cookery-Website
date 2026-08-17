-- A draft_order becomes a real order at checkout. customer_id has no FK
-- yet (customer_profiles doesn't exist until the M7/auth migration) so
-- guest checkout works today; the FK is added there.

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid,
  draft_order_id uuid not null references draft_orders (id),
  -- Frozen copy of the cake + spec so later catalog edits (price changes,
  -- renamed options) never alter a historical order's record.
  cake_snapshot jsonb not null,
  fulfilment_type text not null check (fulfilment_type in ('pickup', 'delivery')),
  zone_id uuid not null references delivery_zones (id),
  delivery_address jsonb,
  slot_id uuid not null references delivery_slots (id),
  subtotal numeric(10, 2) not null,
  extras_total numeric(10, 2) not null default 0,
  delivery_fee numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  deposit_amount numeric(10, 2) not null,
  balance_due numeric(10, 2) not null,
  payment_method text not null check (
    payment_method in ('bkash', 'nagad', 'card', 'cash_on_collection')
  ),
  payment_status text not null default 'pending' check (
    payment_status in ('pending', 'deposit_paid', 'paid_in_full', 'failed', 'refunded')
  ),
  status text not null default 'received' check (
    status in (
      'received', 'confirmed', 'baking', 'ready',
      'out_for_delivery', 'collected', 'delivered', 'cancelled'
    )
  ),
  contact_name text not null,
  contact_phone text not null,
  kitchen_note text,
  created_at timestamptz not null default now()
);

create index orders_customer_id_idx on orders (customer_id);
create index orders_draft_order_id_idx on orders (draft_order_id);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  cake_snapshot jsonb not null,
  qty int not null default 1,
  line_total numeric(10, 2) not null
);

-- Kept separate from `orders` even though v1 is always exactly one cake
-- per order, so a future multi-cake basket is an additive change, not a
-- schema migration.
create index order_items_order_id_idx on order_items (order_id);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  status text not null,
  note text,
  changed_at timestamptz not null default now(),
  changed_by text not null default 'system'
);

create index order_status_history_order_id_idx on order_status_history (order_id);

alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;

create policy "owners can select their own orders" on orders
  for select using (customer_id = auth.uid());

create policy "owners can select their own order items" on order_items
  for select using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and orders.customer_id = auth.uid()
    )
  );

create policy "owners can select their own order status history" on order_status_history
  for select using (
    exists (
      select 1 from orders
      where orders.id = order_status_history.order_id
      and orders.customer_id = auth.uid()
    )
  );
