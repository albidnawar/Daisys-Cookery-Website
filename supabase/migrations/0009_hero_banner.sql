-- Replaces the per-cake hero-carousel rotation with a single hero banner
-- image: one photo, optionally a click-through link, no cake name overlay.
-- This is a promotional slot, not necessarily tied to any one cake (e.g.
-- "Eid pre-orders open" linking to a filtered Browse page).

create table hero_banner (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  link_url text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table hero_banner enable row level security;
create policy "hero banner is public read" on hero_banner for select using (is_active);

drop index if exists cakes_hero_carousel_idx;
alter table cakes drop column if exists hero_carousel_sort_order;
