-- Lets the admin correct an order's booked date/time after the fact (e.g.
-- the customer called to reschedule). Each order owns a single-use
-- delivery_slots row (see book_exact_time() in
-- 0032_local_delivery_and_exact_time_booking.sql), so this just moves that
-- same row to the new date/time rather than creating a new one — no other
-- order can be affected by this update. The date-blocked / day-level
-- max_orders checks only need to run when the date is actually changing:
-- moving the time within the same day can't change that day's total
-- booked_count, and the existing total already reflects this order's own
-- booking, so re-checking it against the cap would wrongly block a shop
-- already sitting at its own limit from just changing the time.
create or replace function reschedule_order_slot(
  p_order_id uuid,
  p_date date,
  p_start_time time
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_slot_id uuid;
  v_old_date date;
  v_is_blocked boolean;
  v_max_orders int;
  v_day_total int;
begin
  select slot_id into v_slot_id from orders where id = p_order_id;
  if v_slot_id is null then
    raise exception 'order_has_no_slot';
  end if;

  select date into v_old_date from delivery_slots where id = v_slot_id;

  if v_old_date is distinct from p_date then
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
  end if;

  update delivery_slots
  set date = p_date, start_time = p_start_time, end_time = p_start_time
  where id = v_slot_id;
end;
$$;
