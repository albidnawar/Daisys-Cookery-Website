-- The Flavor option group ("sponge") becomes multi-select: a customer or
-- admin can now pick more than one flavor on a single cake (e.g. a
-- half-and-half order) instead of being forced to choose just one.
-- min_select stays 1 (a flavor is still required); max_select is raised
-- to 5, matching the cap already used for Candles & toppers ("extras").
update option_groups
set input_type = 'checkbox_multi',
    max_select = 5
where code = 'sponge';
