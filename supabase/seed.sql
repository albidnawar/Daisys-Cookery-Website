-- Placeholder catalog data for local development.
-- Prices/flavors/extras mirror the reference design mockup where it gave
-- concrete numbers; anything not specified there is a reasonable stand-in
-- pending real menu/pricing numbers from the business (see plan's
-- "Prerequisites" section).

insert into flavors (name, slug, sort_order) values
  ('Vanilla', 'vanilla', 1),
  ('Chocolate', 'chocolate', 2),
  ('Black Forest', 'black-forest', 3),
  ('Red Velvet', 'red-velvet', 4),
  ('Butterscotch', 'butterscotch', 5),
  ('Orange', 'orange', 6),
  ('Mango', 'mango', 7),
  ('Lemon', 'lemon', 8),
  ('Strawberry', 'strawberry', 9),
  ('Blueberry', 'blueberry', 10),
  ('Pistachio', 'pistachio', 11);

insert into cakes (slug, name, primary_flavor_id, description, short_description, base_price, is_customisable, is_active)
select
  v.slug, v.name, f.id, v.description, v.short_description, v.base_price, true, true
from (values
  ('the-vanilla-bean', 'The Vanilla Bean', 'vanilla', 'Bourbon vanilla sponge, whipped cream, a plain gold band.', 'Bourbon vanilla sponge, whipped cream, a plain gold band.', 1150.00),
  ('dark-chocolate-ganache', 'Dark Chocolate Ganache', 'chocolate', 'Dark sponge, ganache between the layers, cocoa dusted.', 'Dark sponge, ganache between the layers, cocoa dusted.', 1250.00),
  ('the-winter-gateau', 'The Winter Gateau', 'black-forest', 'Three layers of dark sponge brushed with cherry syrup, whipped cream between, and chocolate shaved off the block by hand.', 'Cherries, cream and shaved chocolate. Two pounds serves eight.', 1400.00),
  ('daisys-velvet', 'Daisy''s Velvet', 'red-velvet', 'Buttermilk crumb with a cream-cheese frosting, crumbed edge.', 'Cream cheese between three layers, crumbed all round.', 1350.00),
  ('praline-crown', 'Praline Crown', 'butterscotch', 'Caramel sponge with crushed praline pressed into the sides.', 'Caramel sponge with crushed praline pressed into the sides.', 1300.00),
  ('orange-zest-delight', 'Orange Zest Delight', 'orange', 'Orange-zested sponge with a light citrus syrup soak.', 'Orange-zested sponge with a light citrus syrup soak.', 1150.00),
  ('summer-cream-cake', 'Summer Cream Cake', 'mango', 'Alphonso puree folded through the cream, fruit on the crown.', 'Alphonso puree folded through the cream, fruit on the crown.', 1300.00),
  ('curd-and-cream', 'Curd & Cream', 'lemon', 'Sharp curd, soft meringue peaks, zest across the top.', 'Sharp curd, soft meringue peaks, zest across the top.', 1200.00),
  ('strawberry-fields', 'Strawberry Fields', 'strawberry', 'Fresh strawberry compote layered through vanilla sponge.', 'Fresh strawberry compote layered through vanilla sponge.', 1300.00),
  ('blueberry-bliss', 'Blueberry Bliss', 'blueberry', 'Blueberry compote and cream, finished with fresh berries.', 'Blueberry compote and cream, finished with fresh berries.', 1350.00),
  ('the-green-loaf', 'The Green Loaf', 'pistachio', 'Ground pistachio sponge, honey syrup, nibbed edge.', 'Ground pistachio sponge, honey syrup, nibbed edge.', 1500.00)
) as v(slug, name, flavor_slug, description, short_description, base_price)
join flavors f on f.slug = v.flavor_slug;

insert into cake_dietary_tags (cake_id, tag)
select c.id, t.tag
from cakes c
join (values
  ('the-winter-gateau', 'eggless'),
  ('the-winter-gateau', 'gluten_free'),
  ('daisys-velvet', 'eggless'),
  ('curd-and-cream', 'gluten_free'),
  ('summer-cream-cake', 'vegan')
) as t(slug, tag) on t.slug = c.slug;

insert into cake_events (cake_id, event_code)
select c.id, e.event_code
from cakes c
join (values
  ('the-vanilla-bean', 'birthday'),
  ('the-vanilla-bean', 'kids_character'),
  ('dark-chocolate-ganache', 'birthday'),
  ('dark-chocolate-ganache', 'corporate_office'),
  ('the-winter-gateau', 'birthday'),
  ('the-winter-gateau', 'anniversary_romance'),
  ('daisys-velvet', 'anniversary_romance'),
  ('daisys-velvet', 'valentines_mothers_fathers_day'),
  ('praline-crown', 'graduation_success'),
  ('praline-crown', 'corporate_office'),
  ('orange-zest-delight', 'eid_festive'),
  ('summer-cream-cake', 'eid_festive'),
  ('summer-cream-cake', 'baby_shower_sadh'),
  ('curd-and-cream', 'baby_shower_sadh'),
  ('curd-and-cream', 'graduation_success'),
  ('strawberry-fields', 'valentines_mothers_fathers_day'),
  ('strawberry-fields', 'engagement_ring'),
  ('blueberry-bliss', 'engagement_ring'),
  ('blueberry-bliss', 'wedding_gaye_holud'),
  ('the-green-loaf', 'wedding_gaye_holud'),
  ('the-green-loaf', 'corporate_office')
) as e(slug, event_code) on e.slug = c.slug;

insert into option_groups (code, label, input_type, min_select, max_select, sort_order) values
  ('size_lb', 'Size, in pounds', 'segmented', 1, 1, 1),
  ('shape', 'Shape', 'radio', 1, 1, 2),
  ('tiers', 'Tiers', 'radio', 1, 1, 3),
  ('sponge', 'Sponge flavor', 'radio', 1, 1, 4),
  ('filling', 'Filling', 'radio', 1, 1, 5),
  ('frosting_finish', 'Frosting & finish', 'radio', 1, 1, 6),
  ('extras', 'Candles & toppers', 'checkbox_multi', 0, 5, 7),
  ('allergen_swap', 'Allergen swaps', 'checkbox_multi', 0, 3, 8),
  ('photo_print', 'Photo print on cake', 'checkbox_multi', 0, 1, 9);

insert into option_values (group_id, label, value_code, price_delta, sort_order, metadata)
select g.id, v.label, v.value_code, v.price_delta, v.sort_order, v.metadata::jsonb
from option_groups g
join (values
  ('size_lb', '1 lb', '1', 0, 1, '{"lb": 1}'),
  ('size_lb', '2 lb', '2', 0, 2, '{"lb": 2}'),
  ('size_lb', '3 lb', '3', 0, 3, '{"lb": 3}'),
  ('size_lb', '4 lb', '4', 0, 4, '{"lb": 4}'),
  ('size_lb', '5 lb', '5', 0, 5, '{"lb": 5}'),
  ('size_lb', 'Other', 'other', 0, 6, '{"lb": null}'),

  ('shape', 'Round', 'round', 0, 1, '{}'),
  ('shape', 'Square', 'square', 0, 2, '{}'),

  ('tiers', 'Single', 'single', 0, 1, '{"tiers": 1}'),
  ('tiers', 'Two tier', 'two', 800, 2, '{"tiers": 2}'),
  ('tiers', 'Three tier', 'three', 1800, 3, '{"tiers": 3}'),

  ('sponge', 'Vanilla', 'vanilla', 0, 1, '{}'),
  ('sponge', 'Chocolate', 'chocolate', 0, 2, '{}'),
  ('sponge', 'Black Forest', 'black-forest', 0, 3, '{}'),
  ('sponge', 'Red Velvet', 'red-velvet', 0, 4, '{}'),
  ('sponge', 'Butterscotch', 'butterscotch', 0, 5, '{}'),
  ('sponge', 'Orange', 'orange', 0, 6, '{}'),
  ('sponge', 'Mango', 'mango', 0, 7, '{}'),
  ('sponge', 'Lemon', 'lemon', 0, 8, '{}'),
  ('sponge', 'Strawberry', 'strawberry', 0, 9, '{}'),
  ('sponge', 'Blueberry', 'blueberry', 0, 10, '{}'),
  ('sponge', 'Pistachio', 'pistachio', 150, 11, '{}'),

  ('filling', 'Whipped cream', 'whipped_cream', 0, 1, '{}'),
  ('filling', 'Cherry & cream', 'cherry_cream', 0, 2, '{}'),
  ('filling', 'Chocolate ganache', 'chocolate_ganache', 0, 3, '{}'),
  ('filling', 'Cream cheese', 'cream_cheese', 0, 4, '{}'),
  ('filling', 'Fresh fruit & curd', 'fresh_fruit_curd', 100, 5, '{}'),

  ('frosting_finish', 'Swiss buttercream, smooth', 'swiss_buttercream', 0, 1, '{}'),
  ('frosting_finish', 'Whipped cream, piped shell', 'whipped_shell', 0, 2, '{}'),
  ('frosting_finish', 'Shaved chocolate', 'shaved_chocolate', 0, 3, '{}'),
  ('frosting_finish', 'Mirror glaze', 'mirror_glaze', 200, 4, '{}'),
  ('frosting_finish', 'Naked, dusted', 'naked_dusted', 0, 5, '{}'),

  ('extras', 'Candles x6', 'candles', 50, 1, '{}'),
  ('extras', 'Sparkler', 'sparkler', 120, 2, '{}'),
  ('extras', 'Gold topper', 'gold_topper', 90, 3, '{}'),
  ('extras', 'Fresh daisies', 'fresh_daisies', 150, 4, '{}'),
  ('extras', 'Name plaque', 'name_plaque', 100, 5, '{}'),

  ('allergen_swap', 'Eggless sponge', 'eggless', 150, 1, '{}'),
  ('allergen_swap', 'Gluten-free flour', 'gluten_free', 250, 2, '{}'),
  ('allergen_swap', 'Vegan (no dairy)', 'vegan', 300, 3, '{}'),
  ('allergen_swap', 'Nut-free kitchen run', 'nut_free', 0, 4, '{}'),

  ('photo_print', 'Print my reference photo on rice paper', 'photo_print', 400, 1, '{}')
) as v(group_code, label, value_code, price_delta, sort_order, metadata) on g.code = v.group_code;

insert into cake_option_groups (cake_id, option_group_id)
select c.id, g.id from cakes c cross join option_groups g where c.is_customisable;

-- Delivery zones (the "pickup" zone is a non-null-zone_id sentinel for
-- pickup slots — see the comment on delivery_slots in the migration).
insert into delivery_zones (name, distance_band, delivery_fee) values
  ('Shop pickup', 'pickup', 0),
  ('Nearby (College Road / Panchlaish)', '0-3km', 180),
  ('Mid-range (Agrabad / Nasirabad)', '3-8km', 300),
  ('Far (rest of Chattogram)', '8km+', 420);

-- 30 days of slots from today, four windows per day, matching the
-- reference mockup's time bands. Delivery gets one row per zone (excluding
-- the pickup zone); pickup gets a single row against the pickup zone.
insert into delivery_slots (date, start_time, end_time, fulfilment_type, zone_id, capacity, booked_count)
select
  d::date,
  w.start_time,
  w.end_time,
  'pickup',
  z.id,
  10,
  0
from generate_series(current_date, current_date + interval '29 days', interval '1 day') d
cross join (values
  ('09:00'::time, '12:00'::time),
  ('12:00'::time, '15:00'::time),
  ('15:00'::time, '18:00'::time),
  ('18:00'::time, '21:00'::time)
) as w(start_time, end_time)
cross join delivery_zones z
where z.distance_band = 'pickup';

insert into delivery_slots (date, start_time, end_time, fulfilment_type, zone_id, capacity, booked_count)
select
  d::date,
  w.start_time,
  w.end_time,
  'delivery',
  z.id,
  3,
  0
from generate_series(current_date, current_date + interval '29 days', interval '1 day') d
cross join (values
  ('10:00'::time, '12:00'::time),
  ('12:00'::time, '14:00'::time),
  ('16:00'::time, '18:00'::time),
  ('18:00'::time, '20:00'::time)
) as w(start_time, end_time)
cross join delivery_zones z
where z.distance_band <> 'pickup';

-- A little variety on the first few days so the UI visibly shows
-- low-availability and fully-booked slots, not just "N left" everywhere.
update delivery_slots set booked_count = capacity
where date = current_date + 1 and start_time = '12:00' and fulfilment_type = 'delivery';

update delivery_slots set booked_count = capacity - 1
where date = current_date + 1 and start_time = '18:00' and fulfilment_type = 'delivery';

update delivery_slots set booked_count = capacity
where date = current_date + 2 and start_time = '16:00' and fulfilment_type = 'delivery';

insert into reviews (customer_name, review_text, rating, sort_order, review_date) values
  ('Nabila Rahman', 'Ordered the Black Forest for my daughter''s birthday and it was gone in minutes. Every layer was fresh and the message piping was so neat.', 5, 1, current_date - interval '3 days'),
  ('Tanvir Ahmed', 'Best red velvet in Chattogram, hands down. I have tried a lot of bakeries around College Road and Daisy''s is the only one I keep going back to.', 5, 2, current_date - interval '9 days'),
  ('Farzana Islam', 'We customised a two-tier cake for our Gaye Holud and they nailed the floral design from just one reference photo. Guests kept asking where we got it.', 5, 3, current_date - interval '16 days'),
  ('Shakib Hasan', 'Delivery was right on time and the box was still cold when it arrived. The pistachio cake tastes like it is worth every taka.', 5, 4, current_date - interval '24 days'),
  ('Ayesha Siddika', 'Ordered a last-minute eggless cake for a baby shower and they sorted it out over WhatsApp within the hour. Incredibly kind and responsive.', 5, 5, current_date - interval '32 days'),
  ('Rafiul Karim', 'The mango cream cake was the highlight of our office anniversary party. Clean design, not too sweet, and beautifully boxed.', 4, 6, current_date - interval '45 days'),
  ('Mim Chowdhury', 'Their Eid special box was a hit with the whole family. Will definitely be ordering again for Pahela Baishakh.', 5, 7, current_date - interval '60 days'),
  ('Imran Hossain', 'Got a custom fondant cake for my son''s superhero-themed birthday. The kids were amazed and it tasted even better than it looked.', 5, 8, current_date - interval '75 days');
