-- Supports listOrdersForKanban()'s two query shapes: the unfiltered board
-- view (status != 'cancelled' ordered by created_at) and the date-filtered
-- view (inner join to delivery_slots on orders.slot_id, which had no index
-- of its own despite being a foreign key).
create index orders_status_created_at_idx on orders (status, created_at);
create index orders_slot_id_idx on orders (slot_id);
