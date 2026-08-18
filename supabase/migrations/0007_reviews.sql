-- Customer testimonials shown in the Home page's reviews marquee.
-- cake_image_url is nullable — until real customer photos exist, the UI
-- falls back to the same cream placeholder tile used elsewhere on the site.

create table reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  review_text text not null,
  cake_image_url text,
  rating int not null default 5 check (rating between 1 and 5),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index reviews_is_active_idx on reviews (is_active);

alter table reviews enable row level security;

create policy "reviews are public read" on reviews for select using (is_active);
