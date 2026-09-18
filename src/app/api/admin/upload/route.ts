import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/admin/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
// Every upload here (cake photos, banners, review images) is served to
// every visitor on a hot page — re-encoding to webp and capping the width
// keeps per-visitor bandwidth down regardless of how large the admin's
// original phone photo was (see the surge-readiness plan).
const MAX_WIDTH = 1600;

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!ACCEPTED.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PNG, JPEG, or WebP images are accepted" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 8MB)" }, { status: 400 });
  }

  const original = new Uint8Array(await file.arrayBuffer());
  let bytes: Uint8Array;
  try {
    bytes = await sharp(original)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Couldn't process that image" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const path = `${randomUUID()}-${baseName}.webp`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, bytes, { contentType: "image/webp", upsert: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url });
}
