-- Store Settings: the business-policy numbers the original build plan
-- flagged as placeholders from day one (deposit %, shop address/hours/
-- phone) — previously hardcoded across pricing.ts and several display
-- components, now a single admin-editable row everything reads from.
-- Singleton-row pattern: id is a boolean that must be true, so the check
-- constraint (combined with the primary key) makes a second row impossible.

create table store_settings (
  id boolean primary key default true check (id),
  deposit_rate numeric(4, 3) not null default 0.300,
  shop_address text not null default 'Flat D3, House - 176, Sanmar Santino, Devpahar, College Road, Chattogram',
  shop_hours text not null default 'Open 9am to 9pm, seven days',
  shop_phone text not null default '01814438989',
  updated_at timestamptz not null default now()
);

insert into store_settings (id) values (true);

alter table store_settings enable row level security;

-- Public read: the deposit rate and shop contact info feed customer-facing
-- pricing and copy (Customiser, Buying Options, Cake Detail), not just the
-- admin Settings page. Writes only ever go through the service-role client
-- (admin route, owner-gated — see requireOwner() in lib/admin/auth.ts).
create policy "store settings are public read" on store_settings
  for select using (true);
