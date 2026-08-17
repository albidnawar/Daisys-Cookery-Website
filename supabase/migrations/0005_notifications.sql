-- Logs every order-status-triggered customer notification. Sending is
-- stubbed for this build (see src/lib/notifications/notify.ts) — a row
-- here with status='sent' means "we would have sent this via <channel>",
-- not that an SMS/WhatsApp Business API call actually went out. Swapping
-- in real sending later only touches that one file.

create table notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  customer_id uuid,
  channel text not null check (channel in ('sms', 'whatsapp', 'email')),
  type text not null check (
    type in (
      'order_confirmed', 'baking_in_progress',
      'out_for_delivery', 'ready_for_collection'
    )
  ),
  payload jsonb not null default '{}',
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index notifications_order_id_idx on notifications (order_id);

alter table notifications enable row level security;

create policy "owners can select their own notifications" on notifications
  for select using (
    exists (
      select 1 from orders
      where orders.id = notifications.order_id
      and orders.customer_id = auth.uid()
    )
  );
