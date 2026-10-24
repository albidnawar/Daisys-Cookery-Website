-- Courier dispatch message template: the admin-editable static boilerplate
-- (courier name, shop's own contact details, bKash number for the courier,
-- the standard liability note) that gets combined with each delivery
-- order's own details (pickup/delivery time, cake, customer phone/address,
-- cash to collect) to generate a ready-to-paste message per order — see
-- src/lib/admin/courierMessages.ts. Singleton-row pattern, same as
-- store_settings (0016_store_settings.sql).
--
-- Seeded with the shop's real, currently-used values (not placeholders) so
-- the feature works immediately without a setup step.

create table courier_template_settings (
  id boolean primary key default true check (id),
  courier_name text not null default 'এসআরএস এক্সপ্রেস',
  pickup_point text not null default 'দেবপাহড়, চকবাজার চট্টগ্রাম',
  sender_number text not null default '01814438989',
  sender_address text not null default 'সানমার সেন্টিনো, মসজিদের সামনে দেবপাহাড় চকবাজার চট্টগ্রাম',
  sender_facebook_name text not null default '',
  bkash_number text not null default '01788997985 (Personal)',
  page_name text not null default 'Daisy''s Cookery',
  emergency_number text not null default '01814438989',
  note_text text not null default 'আপনি অর্ডারটা যদি এই ফর্মেটে প্রদান না করেন তাহলে পিকআপ কিংবা ডেলিভারি করার সময় কোন সমস্যা হলে সেই সমস্যার দায়ভার আমরা নিব না',
  updated_at timestamptz not null default now()
);

insert into courier_template_settings (id) values (true);

-- Admin-only data (never read by the public site) — locked to the
-- service-role client by RLS with no policies, same as the riders table
-- (0030_delivery_riders.sql).
alter table courier_template_settings enable row level security;
