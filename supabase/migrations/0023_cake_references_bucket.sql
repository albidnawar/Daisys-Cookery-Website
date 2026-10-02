-- The customiser's reference-image upload route
-- (src/app/api/draft-order/[id]/reference-image/route.ts) has always
-- targeted a "cake-references" bucket, but it was never actually created —
-- uploads were silently failing with "Bucket not found" until this.
-- Mirrors the "media" bucket's setup (0008_admin.sql): public read, writes
-- only ever happen through API routes using the service-role client.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cake-references',
  'cake-references',
  true,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "cake-references bucket is public read" on storage.objects
  for select using (bucket_id = 'cake-references');
