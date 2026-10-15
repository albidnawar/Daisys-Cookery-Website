-- A pending custom design (public order-form "Custom design" path) has no
-- price yet — unlike every other draft, which always has at least the
-- '{}' default until a real price is computed. Allow an explicit null so
-- that state is distinguishable from "not priced yet vs. genuinely {}".
alter table draft_orders alter column computed_price drop not null;
