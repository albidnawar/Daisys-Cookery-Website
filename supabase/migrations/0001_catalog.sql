-- Catalog: flavors, cakes, dietary tags, and the customisation option tree
-- shared by the Customiser wizard and any customisable cake detail page.

create extension if not exists "pgcrypto";

create table flavors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order int not null default 0
);

create table cakes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  primary_flavor_id uuid references flavors (id),
  description text not null default '',
  short_description text not null default '',
  base_price numeric(10, 2) not null,
  hero_image_url text,
  gallery_image_urls text[] not null default '{}',
  is_customisable boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index cakes_primary_flavor_id_idx on cakes (primary_flavor_id);
create index cakes_is_active_idx on cakes (is_active);

create table cake_dietary_tags (
  cake_id uuid not null references cakes (id) on delete cascade,
  tag text not null check (
    tag in ('eggless', 'gluten_free', 'vegan', 'sugar_free')
  ),
  primary key (cake_id, tag)
);

create table option_groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (
    code in (
      'size_lb', 'shape', 'tiers', 'sponge', 'filling',
      'frosting_finish', 'extras', 'allergen_swap', 'photo_print'
    )
  ),
  label text not null,
  input_type text not null check (
    input_type in ('radio', 'segmented', 'checkbox_multi', 'number')
  ),
  min_select int not null default 0,
  max_select int not null default 1,
  sort_order int not null default 0
);

create table option_values (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references option_groups (id) on delete cascade,
  label text not null,
  value_code text not null,
  price_delta numeric(10, 2) not null default 0,
  sort_order int not null default 0,
  metadata jsonb not null default '{}',
  unique (group_id, value_code)
);

create index option_values_group_id_idx on option_values (group_id);

create table cake_option_groups (
  cake_id uuid not null references cakes (id) on delete cascade,
  option_group_id uuid not null references option_groups (id) on delete cascade,
  primary key (cake_id, option_group_id)
);

-- Public read access: the catalog has no customer-specific data.
alter table flavors enable row level security;
alter table cakes enable row level security;
alter table cake_dietary_tags enable row level security;
alter table option_groups enable row level security;
alter table option_values enable row level security;
alter table cake_option_groups enable row level security;

create policy "flavors are public read" on flavors for select using (true);
create policy "cakes are public read" on cakes for select using (is_active);
create policy "cake dietary tags are public read" on cake_dietary_tags for select using (true);
create policy "option groups are public read" on option_groups for select using (true);
create policy "option values are public read" on option_values for select using (true);
create policy "cake option groups are public read" on cake_option_groups for select using (true);
