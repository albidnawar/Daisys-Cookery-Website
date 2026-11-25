-- Manual per-customer occasion tags for the Customers CRM's "Occasion"
-- column. categorizeOrderEvent() (src/lib/admin/orderEventCategory.ts)
-- only catches orders whose freeform text contains an English/Banglish
-- keyword it knows about — plenty of real orders describe the occasion in
-- Bangla script, or in wording too specific to turn into a safe keyword
-- rule (see the untagged_customers.csv export) — so the owner reviews
-- those by hand and this table holds what they decide. Looked up by
-- contact_phone (normalizePhone()'s canonical form, same identity the CRM
-- already groups orders by — see customersCrm.ts), not a foreign key,
-- since a phone number isn't a key on any table and most orders are
-- guest checkouts with no customer_id at all.
create table customer_event_tags (
  contact_phone text primary key,
  tag text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table customer_event_tags enable row level security;
-- Owner-only internal CRM data — no anon/authenticated access needed, same
-- as admin_users; all reads/writes go through the service-role client.
