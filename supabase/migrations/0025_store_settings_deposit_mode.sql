-- Lets the admin choose a flat advance amount (e.g. ৳500) instead of
-- always a percentage of the order total — some admins find "a fixed
-- advance" easier to reason about than "30% of whatever the total is".
-- deposit_rate (percentage mode) is untouched; these two columns are only
-- consulted when deposit_mode = 'fixed'.
alter table store_settings
  add column deposit_mode text not null default 'percentage' check (deposit_mode in ('percentage', 'fixed')),
  add column deposit_fixed_amount numeric(10, 2);
