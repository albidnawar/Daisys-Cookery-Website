-- Delivery/pickup slot capacity — the "Delivery Date Locker" that caps how
-- many cakes can be promised for a given day/window so weekends can't be
-- overbooked past what the kitchen can actually produce.
--
-- zone_id is NEVER null (a "pickup" sentinel zone is seeded for pickup
-- slots) specifically so the uniqueness constraint below works: Postgres
-- treats NULL as distinct from NULL, so a nullable zone_id would silently
-- allow duplicate pickup slots for the same date/time.

create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  distance_band text not null,
  delivery_fee numeric(10, 2) not null default 0
);

create table delivery_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  fulfilment_type text not null check (fulfilment_type in ('pickup', 'delivery')),
  zone_id uuid not null references delivery_zones (id),
  capacity int not null,
  booked_count int not null default 0 check (booked_count >= 0),
  unique (date, start_time, fulfilment_type, zone_id)
);

create index delivery_slots_date_idx on delivery_slots (date, fulfilment_type);

-- A short-lived reservation created the moment a customer picks a slot in
-- Buying Options, so two customers racing for the last slot can't both
-- reach checkout believing they've secured it. booked_count is incremented
-- when the hold is created (not only when the order is finalized) so
-- "2 left" / "Full" reflects in-progress checkouts too; see hold_slot()
-- below. Converting a hold to a real order (M5) just deletes this row —
-- booked_count is already counted and stays as-is.
create table slot_holds (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references delivery_slots (id),
  draft_order_id uuid not null references draft_orders (id),
  held_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index slot_holds_slot_id_idx on slot_holds (slot_id);
create index slot_holds_expires_at_idx on slot_holds (expires_at);

alter table delivery_zones enable row level security;
alter table delivery_slots enable row level security;
alter table slot_holds enable row level security;

create policy "delivery zones are public read" on delivery_zones for select using (true);
create policy "delivery slots are public read" on delivery_slots for select using (true);
-- No public policy on slot_holds: only the service-role client (used by
-- the /api/slots/* route handlers, which do their own draft-ownership
-- checks) ever reads or writes it.

-- Releases capacity from holds that were never converted to an order —
-- called at the top of hold_slot() so availability numbers self-heal
-- without needing a cron job.
create or replace function release_expired_holds()
returns void
language plpgsql
as $$
begin
  update delivery_slots ds
  set booked_count = ds.booked_count - expired.cnt
  from (
    select slot_id, count(*) as cnt
    from slot_holds
    where expires_at < now()
    group by slot_id
  ) expired
  where ds.id = expired.slot_id;

  delete from slot_holds where expires_at < now();
end;
$$;

-- The correctness-critical operation: atomically checks remaining
-- capacity and reserves one unit, so two concurrent requests for the last
-- slot can't both succeed. The row lock (FOR UPDATE) makes the second
-- caller wait for the first transaction to commit before it re-reads
-- booked_count, which is what prevents the race.
create or replace function hold_slot(
  p_slot_id uuid,
  p_draft_id uuid,
  p_hold_minutes int default 10
)
returns table (hold_id uuid, expires_at timestamptz)
language plpgsql
as $$
declare
  v_capacity int;
  v_booked int;
  v_hold_id uuid;
  v_expires timestamptz;
begin
  perform release_expired_holds();

  select capacity, booked_count into v_capacity, v_booked
  from delivery_slots
  where id = p_slot_id
  for update;

  if not found then
    raise exception 'slot_not_found';
  end if;

  if v_booked >= v_capacity then
    raise exception 'slot_full';
  end if;

  update delivery_slots set booked_count = booked_count + 1 where id = p_slot_id;

  v_expires := now() + make_interval(mins => p_hold_minutes);
  insert into slot_holds (slot_id, draft_order_id, expires_at)
  values (p_slot_id, p_draft_id, v_expires)
  returning id into v_hold_id;

  return query select v_hold_id, v_expires;
end;
$$;

alter table draft_orders
  add constraint draft_orders_slot_id_fkey
  foreign key (slot_id) references delivery_slots (id);

alter table draft_orders
  add constraint draft_orders_zone_id_fkey
  foreign key (zone_id) references delivery_zones (id);
