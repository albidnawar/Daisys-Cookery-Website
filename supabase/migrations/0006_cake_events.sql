-- Event/occasion tagging so Browse can filter by "what is this cake for"
-- (birthday, wedding, eid, etc.) — mirrors the cake_dietary_tags pattern:
-- a many-to-many join table with a fixed, checked vocabulary rather than a
-- free-text field, since the category list is curated, not customer-entered.

create table cake_events (
  cake_id uuid not null references cakes (id) on delete cascade,
  event_code text not null check (
    event_code in (
      'birthday',
      'anniversary_romance',
      'wedding_gaye_holud',
      'engagement_ring',
      'baby_shower_sadh',
      'graduation_success',
      'eid_festive',
      'valentines_mothers_fathers_day',
      'corporate_office',
      'kids_character'
    )
  ),
  primary key (cake_id, event_code)
);

create index cake_events_event_code_idx on cake_events (event_code);

alter table cake_events enable row level security;

create policy "cake events are public read" on cake_events for select using (true);
