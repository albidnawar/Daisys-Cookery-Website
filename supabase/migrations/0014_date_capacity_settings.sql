-- Module 7: Capacity & Delivery Logistics. Per-slot capacity (delivery_slots
-- capacity/booked_count) already caps each individual time window; this adds
-- a DAY-level production cap ("max 15 cakes/day" across every slot combined)
-- and a way to fully lock out a date (holidays, days off) regardless of
-- per-slot capacity.

create table date_capacity_settings (
  date date primary key,
  is_blocked boolean not null default false,
  max_orders int,
  note text,
  updated_at timestamptz not null default now()
);

alter table date_capacity_settings enable row level security;

-- Public read so a customer-facing calendar/slot picker can know a date is
-- blocked before ever calling hold_slot() — same treatment as
-- delivery_zones/delivery_slots. Writes only ever go through the
-- service-role client (admin routes).
create policy "date capacity settings are public read" on date_capacity_settings
  for select using (true);

-- Adds the date-blocked / daily-cap checks ahead of the existing per-slot
-- capacity check. Locks every slot row for the date up front (not just the
-- one being booked) so two concurrent holds against *different* slots on a
-- capped day can't both read the same pre-increment day total and both
-- squeeze past the cap — the same race the original per-slot FOR UPDATE
-- prevented at the single-slot level.
create or replace function hold_slot(
  p_slot_id uuid,
  p_draft_id uuid,
  p_hold_minutes int default 10
)
returns table (hold_id uuid, expires_at timestamptz)
language plpgsql
as $$
declare
  v_date date;
  v_capacity int;
  v_booked int;
  v_hold_id uuid;
  v_expires timestamptz;
  v_is_blocked boolean;
  v_max_orders int;
  v_day_total int;
begin
  perform release_expired_holds();

  select date into v_date from delivery_slots where id = p_slot_id;
  if not found then
    raise exception 'slot_not_found';
  end if;

  perform 1 from delivery_slots where date = v_date for update;

  select is_blocked, max_orders into v_is_blocked, v_max_orders
  from date_capacity_settings
  where date = v_date;

  if v_is_blocked then
    raise exception 'date_blocked';
  end if;

  if v_max_orders is not null then
    select coalesce(sum(booked_count), 0) into v_day_total
    from delivery_slots
    where date = v_date;

    if v_day_total >= v_max_orders then
      raise exception 'daily_cap_reached';
    end if;
  end if;

  select capacity, booked_count into v_capacity, v_booked
  from delivery_slots
  where id = p_slot_id;

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
