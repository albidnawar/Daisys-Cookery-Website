-- Cancelling an order (or deleting a test/converted booking) never freed
-- the delivery_slots.booked_count it had reserved — booked_count only ever
-- went up (at hold_slot()) or down via release_expired_holds() for an
-- *unconverted* hold. Once a hold became a real order, cancelling that
-- order later had no code path back to the slot at all, so the slot
-- looked permanently full/booked even though nothing was actually
-- happening on that date anymore.

create or replace function release_slot_capacity(p_slot_id uuid)
returns void
language plpgsql
as $$
begin
  update delivery_slots
  set booked_count = greatest(booked_count - 1, 0)
  where id = p_slot_id;
end;
$$;

-- One-time repair: recompute every slot's booked_count from ground truth
-- (active holds + non-cancelled orders) rather than trusting the
-- incrementally-maintained column, which has drifted for any slot that
-- ever had an order cancelled or a test order deleted directly.
update delivery_slots ds
set booked_count = coalesce(counts.total, 0)
from (
  select slot_id, count(*) as total
  from (
    select slot_id from slot_holds
    union all
    select slot_id from orders where status <> 'cancelled'
  ) combined
  group by slot_id
) counts
where ds.id = counts.slot_id;

update delivery_slots
set booked_count = 0
where booked_count <> 0
  and id not in (
    select slot_id from slot_holds
    union
    select slot_id from orders where status <> 'cancelled'
  );
