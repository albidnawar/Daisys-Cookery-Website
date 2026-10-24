import { createServiceRoleClient } from "@/lib/supabase/server";

/** A Supabase public storage URL looks like
 * ".../storage/v1/object/public/<bucket>/<path>" — this pulls the bucket
 * and path back out so a stored URL can be deleted without having to know
 * in advance which bucket it came from (the normal customer flow uploads
 * reference photos to the dedicated "cake-references" bucket, keyed by
 * draft order id, but an admin manual order's single reference photo goes
 * through the shared "media" bucket instead — see
 * src/app/api/admin/upload/route.ts). */
function parsePublicStorageUrl(url: string): { bucket: string; path: string } | null {
  const marker = "/storage/v1/object/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rest = url.slice(idx + marker.length);
  const slash = rest.indexOf("/");
  if (slash === -1) return null;
  return { bucket: decodeURIComponent(rest.slice(0, slash)), path: decodeURIComponent(rest.slice(slash + 1)) };
}

/** Deletes the given reference-photo URLs from whichever Storage bucket
 * each actually lives in. Called once an order is collected, delivered, or
 * cancelled — nobody needs the photo once the cake is baked or the order
 * is off the books, and these 8MB-capped uploads add up fast otherwise.
 * Silently skips dev-fallback data: URLs (no Supabase Storage configured)
 * and anything that isn't a recognizable Supabase public storage URL, and
 * never throws — a failed cleanup shouldn't block the status change that
 * triggered it. */
export async function deleteReferenceImageUrls(urls: string[]): Promise<void> {
  const byBucket = new Map<string, string[]>();
  for (const url of urls) {
    if (!url || url.startsWith("data:")) continue;
    const parsed = parsePublicStorageUrl(url);
    if (!parsed) continue;
    const list = byBucket.get(parsed.bucket) ?? [];
    list.push(parsed.path);
    byBucket.set(parsed.bucket, list);
  }
  if (byBucket.size === 0) return;

  const supabase = createServiceRoleClient();
  for (const [bucket, paths] of byBucket) {
    try {
      await supabase.storage.from(bucket).remove(paths);
    } catch {
      // Best-effort — leftover files just mean this cleanup gets another
      // chance next time, not a broken order.
    }
  }
}
