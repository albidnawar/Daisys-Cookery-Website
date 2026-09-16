-- Replaces the fixed owner/staff role with a role -> modules model: three
-- built-in roles (owner: everything; marketing: Content & Media only;
-- sales: everything except Content & Media) plus room for an owner to
-- define custom roles with their own module list. "Settings" (store
-- financials + admin accounts) is intentionally never one of the
-- assignable modules — application code (requireOwner) still hardcodes
-- that to the 'owner' role by name, not by module membership.

create table admin_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_system boolean not null default false,
  modules text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table admin_roles enable row level security;

-- Role definitions aren't sensitive, but still limit reads to logged-in
-- admins rather than any authenticated Supabase user.
create policy "admins can read roles" on admin_roles
  for select using (exists (select 1 from admin_users where admin_users.id = auth.uid()));

insert into admin_roles (name, is_system, modules) values
  ('owner', true, array[
    'new_order', 'overview', 'live_orders', 'kitchen_batch', 'custom_requests',
    'payments', 'customers', 'content_media', 'logistics'
  ]::text[]),
  ('marketing', true, array['content_media']::text[]),
  ('sales', true, array[
    'new_order', 'overview', 'live_orders', 'kitchen_batch', 'custom_requests',
    'payments', 'customers', 'logistics'
  ]::text[]);

alter table admin_users add column role_id uuid references admin_roles (id);

-- Backfill: the old 'owner' role maps to the new 'owner' role. The old
-- 'staff' role had no module restrictions at all (every route just called
-- requireAdmin()), so its closest equivalent is 'sales' — everything
-- except the new Content & Media gate — rather than 'marketing', which
-- would newly lock existing staff out of most of the portal.
update admin_users au
set role_id = (
  select id from admin_roles
  where name = case when au.role = 'owner' then 'owner' else 'sales' end
);

alter table admin_users alter column role_id set not null;

-- role_id + admin_roles.modules is now the source of truth for access;
-- the old free-text column (and its owner/staff check constraint) is
-- fully superseded.
alter table admin_users drop column role;
