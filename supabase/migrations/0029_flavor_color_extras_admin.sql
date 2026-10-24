-- Drops the Filling and Frosting & finish customisation options entirely
-- (cascades to their option_values and cake_option_groups links), renames
-- "Sponge flavor" to plain "Flavor" since it's the only flavor pick left,
-- and adds a new, admin-manageable "Cake color" option group so colors can
-- carry an optional price the same way sponge/extras choices already do.

alter table option_groups drop constraint option_groups_code_check;

delete from option_groups where code in ('filling', 'frosting_finish');

alter table option_groups add constraint option_groups_code_check check (
  code in (
    'size_lb', 'shape', 'tiers', 'sponge', 'cake_color',
    'extras', 'allergen_swap', 'photo_print'
  )
);

update option_groups set label = 'Flavor' where code = 'sponge';

insert into option_groups (code, label, input_type, min_select, max_select, sort_order)
values ('cake_color', 'Cake color', 'radio', 0, 1, 5);

-- Same backfill the original seed used for every other group: every
-- customisable cake gets every option group, since the catalog doesn't yet
-- support per-cake option-group selection despite the join table's shape.
insert into cake_option_groups (cake_id, option_group_id)
select c.id, g.id
from cakes c
join option_groups g on g.code = 'cake_color'
where c.is_customisable
and not exists (
  select 1 from cake_option_groups x
  where x.cake_id = c.id and x.option_group_id = g.id
);
