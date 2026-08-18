-- Admin portal: who can log in, and the extra per-cake/per-review fields
-- the content & media manager (Module 4) and reviews manager (Module 3)
-- need. Admin accounts are Supabase Auth users that also have a row here —
-- a plain Auth signup alone does NOT make someone an admin.

create table admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

-- Lets the admin layout guard check "is the logged-in user an admin" using
-- the caller's own RLS-scoped session — no service-role client needed just
-- to answer that question. Actual admin WRITES (editing cakes, reviews,
-- banners) still go through API routes using the service-role client,
-- which re-verify admin status server-side before doing anything.
create policy "admins can see their own admin row" on admin_users
  for select using (id = auth.uid());

-- Where a cake photo shows up, controlled from the media manager instead
-- of being hardcoded in page components.
alter table cakes
  add column availability text not null default 'in_stock'
    check (availability in ('in_stock', 'sold_out', 'pre_order')),
  add column is_featured_home boolean not null default false,
  add column featured_sort_order int not null default 0,
  add column hero_carousel_sort_order int;

create index cakes_hero_carousel_idx on cakes (hero_carousel_sort_order)
  where hero_carousel_sort_order is not null;

-- Reviews can optionally be tagged to a specific cake, so the reviews
-- manager's "catalog product tagging" option can surface them on that
-- cake's own detail page as well as the homepage marquee.
alter table reviews add column cake_id uuid references cakes (id);

create table banners (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  link_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table banners enable row level security;
create policy "banners are public read" on banners for select using (is_active);

-- Shared storage bucket for admin-uploaded media (cake gallery photos,
-- review photos, banner images). Public read; writes only ever happen
-- through API routes using the service-role client (which bypasses RLS
-- entirely), so no anon/authenticated write policy is needed.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media bucket is public read" on storage.objects
  for select using (bucket_id = 'media');
