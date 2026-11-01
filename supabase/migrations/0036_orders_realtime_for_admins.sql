-- Lets a logged-in admin's browser receive live Supabase Realtime updates
-- for ALL orders (not just rows RLS would otherwise let a customer see),
-- so an open Kanban board can reflect another admin's change instantly
-- instead of needing a manual refresh. Read-only: every WRITE to orders
-- still goes exclusively through server-side API routes using the
-- service-role client, which re-verify admin status (see requireModule)
-- before doing anything — this policy only grants SELECT.
create policy "admins can select all orders" on orders
  for select
  to authenticated
  using (exists (select 1 from admin_users where admin_users.id = auth.uid()));

alter publication supabase_realtime add table orders;
