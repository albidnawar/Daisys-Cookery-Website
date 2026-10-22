-- The person actually assigned to carry out a delivery, distinct from
-- needs_rider_pickup/rider_pickup_at (whether/when a rider needs to swing
-- by the shop to collect the cake). Shown on the order detail page and the
-- Live Orders kanban card so the admin doesn't have to open each order to
-- see who's running it.
alter table orders
  add column rider_name text,
  add column rider_phone text;
