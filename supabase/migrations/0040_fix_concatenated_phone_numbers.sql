-- A customer sometimes typed two numbers into one phone field (e.g.
-- "01712345678, 01812345678" for an alternate contact) — the existing
-- digits-only normalization (0017_normalize_phone_numbers.sql,
-- normalizePhone() in src/lib/phone.ts) stripped the separator and
-- concatenated them into one garbled digit string (e.g.
-- "0186128932401819033809"). normalizePhone() now guards against this
-- going forward (keeps only the first 11-digit number when a second "01"
-- sequence immediately follows it); this backfills the handful of
-- existing rows already affected, using the same rule.

update orders
set contact_phone = left(contact_phone, 11)
where length(contact_phone) > 11
  and left(contact_phone, 2) = '01'
  and substring(contact_phone from 12 for 2) = '01';

update customer_profiles
set phone = left(phone, 11)
where phone is not null
  and length(phone) > 11
  and left(phone, 2) = '01'
  and substring(phone from 12 for 2) = '01';

update custom_quotes
set contact_phone = left(contact_phone, 11)
where length(contact_phone) > 11
  and left(contact_phone, 2) = '01'
  and substring(contact_phone from 12 for 2) = '01';
