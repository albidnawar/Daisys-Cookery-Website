-- Lets the admin choose what part of an uploaded photo stays visible when
-- object-cover crops it into a card/thumbnail/banner box. Reposition-only:
-- a normalized (0-1) focal point consumed as CSS object-position, not a
-- pixel-level crop/re-encode — the already-resized 1600px webp from
-- upload stays as-is.

alter table cakes
  add column hero_image_focal_x numeric(4, 3) not null default 0.5,
  add column hero_image_focal_y numeric(4, 3) not null default 0.5,
  -- Aligned by index with gallery_image_urls: [{"x":0.5,"y":0.5}, ...].
  add column gallery_image_focals jsonb not null default '[]';

alter table hero_banner
  add column image_focal_x numeric(4, 3) not null default 0.5,
  add column image_focal_y numeric(4, 3) not null default 0.5;

alter table reviews
  add column cake_image_focal_x numeric(4, 3) not null default 0.5,
  add column cake_image_focal_y numeric(4, 3) not null default 0.5;
