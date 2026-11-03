-- Merges the two previously-separate "flavor" lists into one: the
-- Order Options "Flavor" option group (option_values under option_groups
-- code 'sponge' — priced, used when customizing/editing an order's cake)
-- becomes the single source of truth, replacing the plain catalog-only
-- `flavors` table (used only for `cakes.primary_flavor_id`, browse-page
-- filtering, with no price). Admins were adding flavors in one place
-- (Taxonomy) that never showed up in the other (Order Options' cake
-- editor), which is exactly the bug this fixes.

-- 1. Add "Roshmalai" (exists in flavors, not yet in the Flavor option
--    group) so every cake currently tagged with it has somewhere to
--    point in step 2.
insert into option_values (group_id, label, value_code, price_delta, sort_order)
select
  og.id,
  'Roshmalai',
  'roshmalai',
  0,
  (select coalesce(max(sort_order), 0) + 1 from option_values where group_id = og.id)
from option_groups og
where og.code = 'sponge'
on conflict (group_id, value_code) do nothing;

-- 2. Drop the old FK (still pointing at flavors) before repointing values,
--    or the update below gets rejected for referencing an id that isn't
--    in the old flavors table.
alter table cakes drop constraint cakes_primary_flavor_id_fkey;

-- 3. Repoint every cake's primary_flavor_id from the old flavors table to
--    the matching Flavor option value, matched by label/name (verified
--    beforehand: every flavors.name in use has an exact-label match here
--    after step 1), then add the FK back pointing at option_values.
update cakes c
set primary_flavor_id = ov.id
from flavors f
join option_groups og on og.code = 'sponge'
join option_values ov on ov.group_id = og.id and ov.label = f.name
where c.primary_flavor_id = f.id;

alter table cakes add constraint cakes_primary_flavor_id_fkey
  foreign key (primary_flavor_id) references option_values (id);

-- 4. The old catalog-only flavor list is now fully replaced.
drop table flavors;
