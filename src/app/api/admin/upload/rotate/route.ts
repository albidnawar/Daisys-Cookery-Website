import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/admin/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

const BUCKET = "media";

// Pulls the storage path back out of a public URL from this same bucket, so
// the source bytes can be fetched directly through the Storage API instead
// of round-tripping through the public CDN URL.
//
// Deliberately does NOT delete the pre-rotation file: the form the admin is
// editing may never get saved (or the same file may be referenced
// elsewhere), so the old object could still be exactly what's live in the
// database. Rotating leaves the previous file in place — a few extra KB in
// storage is a much smaller problem than silently deleting a photo that
// turns out to still be in use.
function pathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }

  const body = (await request.json().catch(() => null)) as { url?: string; degrees?: number } | null;
  if (!body?.url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  const degrees = body.degrees === -90 ? -90 : 90;

  const supabase = createServiceRoleClient();
  const sourcePath = pathFromPublicUrl(body.url);

  let sourceBytes: Uint8Array | null = null;
  if (sourcePath) {
    const { data } = await supabase.storage.from(BUCKET).download(sourcePath);
    if (data) sourceBytes = new Uint8Array(await data.arrayBuffer());
  }
  if (!sourceBytes) {
    const res = await fetch(body.url).catch(() => null);
    if (res?.ok) sourceBytes = new Uint8Array(await res.arrayBuffer());
  }
  if (!sourceBytes) {
    return NextResponse.json({ error: "Couldn't fetch that image" }, { status: 400 });
  }

  let bytes: Uint8Array;
  try {
    // effort 2 (default 4) trades a little file size for a faster encode —
    // worth it here since it runs synchronously in the request.
    bytes = await sharp(sourceBytes).rotate(degrees).webp({ quality: 80, effort: 2 }).toBuffer();
  } catch {
    return NextResponse.json({ error: "Couldn't rotate that image" }, { status: 400 });
  }

  const path = `${randomUUID()}-rotated.webp`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "image/webp" });
  if (error) {
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }

  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url });
}
