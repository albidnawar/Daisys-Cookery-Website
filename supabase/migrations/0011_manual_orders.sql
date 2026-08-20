-- Supports Module 1 (manual FB/phone order entry) and Module 2 (kitchen
-- kanban): orders can now originate outside the customer-facing checkout,
-- so draft_order_id can't stay mandatory, and we track who took the order
-- and how a manually-recorded MFS payment was verified.

alter table orders
  add column order_source text not null default 'web' check (order_source in ('web', 'manual')),
  add column manual_trx_id text,
  add column created_by_admin_id uuid references admin_users (id);

alter table orders alter column draft_order_id drop not null;
