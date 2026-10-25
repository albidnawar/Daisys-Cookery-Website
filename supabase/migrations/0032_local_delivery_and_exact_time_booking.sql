-- Part 1: collapse near/mid/far delivery zones into a single "Local
-- Delivery" option. Mid-range/Far rows can't be deleted (real orders
-- reference them via orders.zone_id) — they're deactivated instead, so
-- they keep showing correctly on historical orders but are never offered
-- for new bookings. The surviving zone's delivery_fee becomes 0: the admin
-- now sets each order's real delivery cost by hand from the order detail
-- page (orders.delivery_fee, already editable there) instead of an
-- automatic per-zone number.

alter table delivery_zones add column is_active boolean not null default true;

update delivery_zones set is_active = false
where name in ('Mid-range (Agrabad / Nasirabad)', 'Far (rest of Chattogram)');

update delivery_zones
set name = 'Local Delivery', distance_band = 'local', delivery_fee = 0
where name = 'Nearby (College Road / Panchlaish)';

-- Part 2: exact-time booking instead of fixed, capacity-limited windows.
-- Each booking now gets its own single-use delivery_slots row
-- (start_time = end_time = the customer's chosen time, capacity 1,
-- booked_count 1) instead of picking a shared pre-generated row — so the
-- old uniqueness constraint (which existed to dedupe pre-generated
-- windows) must go: two different orders legitimately collide on the same
-- exact date/time/fulfilment/zone now.

alter table delivery_slots
  drop constraint delivery_slots_date_start_time_fulfilment_type_zone_id_key;

-- One-time cleanup: the old rolling-window generator pre-created up to 30
-- days of windows nobody had booked yet. Only rows with booked_count = 0
-- AND no draft_orders still pointing at them are touched — anything with a
-- real hold, order, or in-progress draft on it is left exactly alone.
delete from delivery_slots ds
where ds.date >= current_date
  and ds.booked_count = 0
  and not exists (select 1 from draft_orders do2 where do2.slot_id = ds.id);

drop function if exists hold_slot(uuid, uuid, int);

-- Replaces hold_slot(): same date-blocked / day-level max_orders checks
-- (including the FOR UPDATE lock on the date's capacity-settings row, for
-- the same race-prevention reason), but instead of checking/incrementing
-- an existing shared slot row, it INSERTs a fresh one for this exact
-- booking and returns its id alongside the hold.
create or replace function book_exact_time(
  p_date date,
  p_start_time time,
  p_fulfilment_type text,
  p_zone_id uuid,
  p_draft_id uuid,
  p_hold_minutes int default 10
)
returns table (hold_id uuid, slot_id uuid, expires_at timestamptz)
language plpgsql
set search_path = public
as $$
declare
  v_is_blocked boolean;
  v_max_orders int;
  v_day_total int;
  v_slot_id uuid;
  v_hold_id uuid;
  v_expires timestamptz;
begin
  perform 1 from date_capacity_settings where date = p_date for update;

  select is_blocked, max_orders into v_is_blocked, v_max_orders
  from date_capacity_settings
  where date = p_date;

  if v_is_blocked then
    raise exception 'date_blocked';
  end if;

  if v_max_orders is not null then
    select coalesce(sum(booked_count), 0) into v_day_total
    from delivery_slots
    where date = p_date;

    if v_day_total >= v_max_orders then
      raise exception 'daily_cap_reached';
    end if;
  end if;

  insert into delivery_slots (date, start_time, end_time, fulfilment_type, zone_id, capacity, booked_count)
  values (p_date, p_start_time, p_start_time, p_fulfilment_type, p_zone_id, 1, 1)
  returning id into v_slot_id;

  v_expires := now() + make_interval(mins => p_hold_minutes);
  insert into slot_holds (slot_id, draft_order_id, expires_at)
  values (v_slot_id, p_draft_id, v_expires)
  returning id into v_hold_id;

  return query select v_hold_id, v_slot_id, v_expires;
end;
$$;
