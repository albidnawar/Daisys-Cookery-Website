-- The public order-form's "Custom design" path has no catalog price to
-- take a percentage of, so its booking advance is always a flat Taka
-- amount — independent of the regular checkout's deposit_mode/deposit_rate
-- (which stay percentage- or fixed-based for catalog orders).
alter table store_settings
  add column custom_order_advance_amount numeric(10, 2) not null default 500;
