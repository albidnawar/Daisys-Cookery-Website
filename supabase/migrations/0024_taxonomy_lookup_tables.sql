-- Turns dietary tags and occasions from fixed, code-deploy-only lists
-- (a CHECK constraint on cake_dietary_tags.tag / cake_events.event_code)
-- into admin-manageable lookup tables, mirroring the existing `flavors`
-- table pattern. The join tables keep their existing text columns; the
-- CHECK constraints are swapped for a foreign key into the new tables so
-- existing data and existing queries keep working unchanged.

create table dietary_tags (
  code text primary key,
  label text not null,
  sort_order int not null default 0
);

insert into dietary_tags (code, label, sort_order) values
  ('eggless', 'Eggless', 1),
  ('gluten_free', 'Gluten-free', 2),
  ('vegan', 'Vegan', 3),
  ('sugar_free', 'Sugar-free', 4);

alter table cake_dietary_tags drop constraint cake_dietary_tags_tag_check;
alter table cake_dietary_tags
  add constraint cake_dietary_tags_tag_fkey
  foreign key (tag) references dietary_tags (code) on update cascade;

alter table dietary_tags enable row level security;
create policy "dietary tags are public read" on dietary_tags for select using (true);

create table occasions (
  code text primary key,
  label text not null,
  sort_order int not null default 0
);

insert into occasions (code, label, sort_order) values
  ('birthday', 'Birthday (Kids & Adults)', 1),
  ('anniversary_romance', 'Anniversary & Romance', 2),
  ('wedding_gaye_holud', 'Wedding & Gaye Holud', 3),
  ('engagement_ring', 'Engagement & Ring Ceremony', 4),
  ('baby_shower_sadh', 'Baby Shower & Sadh', 5),
  ('graduation_success', 'Graduation & Success', 6),
  ('eid_festive', 'Eid & Festive Specials', 7),
  ('valentines_mothers_fathers_day', 'Valentine''s & Mother''s/Father''s Day', 8),
  ('corporate_office', 'Corporate & Office Parties', 9),
  ('kids_character', 'Kids & Character Themes', 10);

alter table cake_events drop constraint cake_events_event_code_check;
alter table cake_events
  add constraint cake_events_event_code_fkey
  foreign key (event_code) references occasions (code) on update cascade;

alter table occasions enable row level security;
create policy "occasions are public read" on occasions for select using (true);

-- The size_lb "other" option's label hardcoded the shop's phone number,
-- which is now a store setting, not a constant — sizes above 5lb are
-- typed in directly (see SizeSelector.tsx) rather than phoned in, so the
-- label no longer needs to mention calling at all.
update option_values set label = 'Other' where value_code = 'other';

-- Rider dispatch info for delivery orders, set by admin after the order
-- comes in (not at checkout) — whether this order needs a rider to pick
-- it up from the shop, and when that pickup is scheduled.
alter table orders
  add column needs_rider_pickup boolean not null default false,
  add column rider_pickup_at timestamptz;
