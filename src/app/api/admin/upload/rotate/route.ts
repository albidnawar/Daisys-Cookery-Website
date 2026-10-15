import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/admin/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

const BUCKET = "media";

/** Pulls the storage path back out of a public URL from this same bucket,
 * so the pre-rotation file can be cleaned up after a successful rotate —
 * rotating is otherwise a one-way street that'd leave an orphaned object
 * behind every time an admin nudges an image 90 degrees. */
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

  const sourceRes = await fetch(body.url).catch(() => null);
  if (!sourceRes?.ok) {
    return NextResponse.json({ error: "Couldn't fetch that image" }, { status: 400 });
  }
  const original = new Uint8Array(await sourceRes.arrayBuffer());

  let bytes: Uint8Array;
  try {
    bytes = await sharp(original).rotate(degrees).webp({ quality: 80 }).toBuffer();
  } catch {
    return NextResponse.json({ error: "Couldn't rotate that image" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const path = `${randomUUID()}-rotated.webp`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "image/webp" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const oldPath = pathFromPublicUrl(body.url);
  if (oldPath) {
    await supabase.storage.from(BUCKET).remove([oldPath]).catch(() => {});
  }

  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url });
}
