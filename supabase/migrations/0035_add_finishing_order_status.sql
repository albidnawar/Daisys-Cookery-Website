-- New Kanban stage between "baking" and "ready": the cake is out of the
-- oven and being finished (frosted/decorated/boxed) before it's ready for
-- pickup/delivery.
alter table orders drop constraint orders_status_check;

alter table orders add constraint orders_status_check check (
  status in (
    'received', 'confirmed', 'baking', 'finishing', 'ready',
    'out_for_delivery', 'collected', 'delivered', 'cancelled'
  )
);
