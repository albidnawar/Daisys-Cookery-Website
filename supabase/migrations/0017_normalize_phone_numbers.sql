-- Backfill orders.contact_phone and customer_profiles.phone to the same
-- canonical form the app now writes going forward (see src/lib/phone.ts's
-- normalizePhone) — strip all non-digits, then collapse a "+880"/"880"
-- country-code prefix down to the local leading "0". Without this, orders
-- placed before this migration (entered with spaces, dashes, or a country
-- code) stay invisible to Manual Order Entry's phone lookup and get
-- double-counted as separate customers in the Mini-CRM.

update orders
set contact_phone = case
  when regexp_replace(contact_phone, '\D', '', 'g') ~ '^880\d{10}$'
    then '0' || right(regexp_replace(contact_phone, '\D', '', 'g'), 10)
  else regexp_replace(contact_phone, '\D', '', 'g')
end
where contact_phone is not null;

update customer_profiles
set phone = case
  when regexp_replace(phone, '\D', '', 'g') ~ '^880\d{10}$'
    then '0' || right(regexp_replace(phone, '\D', '', 'g'), 10)
  else regexp_replace(phone, '\D', '', 'g')
end
where phone is not null;

update custom_quotes
set contact_phone = case
  when regexp_replace(contact_phone, '\D', '', 'g') ~ '^880\d{10}$'
    then '0' || right(regexp_replace(contact_phone, '\D', '', 'g'), 10)
  else regexp_replace(contact_phone, '\D', '', 'g')
end
where contact_phone is not null;
