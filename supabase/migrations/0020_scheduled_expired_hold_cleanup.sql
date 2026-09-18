-- Module: surge readiness. release_expired_holds() was called inline,
-- synchronously, on every single hold_slot() call AND every
-- listAvailability() call (src/lib/slots/store.ts) — i.e. on every booking
-- attempt and every time a visitor merely looks at the slot picker. It
-- scans/cleans expired holds across every date, table-wide, not just the
-- one being viewed/booked. Under a burst of concurrent browsing or
-- booking, many callers redundantly repeat the same cleanup scan. Moving
-- it to a scheduled job removes that redundant work from the hot path
-- without touching the correctness-critical locking in hold_slot() at all
-- (the `for update` slot-row lock is untouched).

create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'release-expired-holds',
  '*/2 * * * *',
  $$ select release_expired_holds(); $$
);

-- Same as 0014_date_capacity_settings.sql's hold_slot(), minus the inline
-- `perform release_expired_holds();` call.
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
