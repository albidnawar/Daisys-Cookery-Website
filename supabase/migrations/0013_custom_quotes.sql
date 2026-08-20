-- Module 5: Custom Quote & WhatsApp Engine. A custom_quotes row is the
-- admin's intake of an inbound FB/WhatsApp custom-cake inquiry; once priced
-- it gets a linked draft_orders row (cake_id null, a fixed computed_price)
-- so the customer can be sent a real, clickable checkout link instead of
-- finishing the whole thing over chat.

alter table draft_orders add column custom_cake_name text;

create table custom_quotes (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  contact_phone text not null,
  cake_title text not null,
  theme_notes text,
  icing_colors text,
  reference_image_urls text[] not null default '{}',
  quoted_price numeric(10, 2),
  quoted_size_note text,
  status text not null default 'new' check (status in ('new', 'quoted', 'declined')),
  draft_order_id uuid references draft_orders (id),
  created_by_admin_id uuid references admin_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index custom_quotes_status_idx on custom_quotes (status);

-- Admin-only data (customer contact details before any order exists) —
-- accessed exclusively through service-role API routes, same as
-- admin_users. The public quote page reads a single row by its uuid
-- through the service-role client too (mirrors how /confirmation/[orderId]
-- reads orders), so no public RLS policy is needed here either.
alter table custom_quotes enable row level security;
