import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { getDraftOrder, updateDraftOrderSpec } from "@/lib/draftOrders/store";
import { getReferenceImages } from "@/lib/customiser/referenceImages";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
// A generous server-side sanity ceiling — the real UX cap (3 on a catalog
// cake's customiser, 6 on the from-scratch/custom-design entry) is
// enforced client-side by only showing an upload slot while under it.
const MAX_IMAGES = 10;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  const existing = await getDraftOrder(id);
  if (!existing) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
  const currentImages = getReferenceImages(existing.spec);
  if (currentImages.length >= MAX_IMAGES) {
    return NextResponse.json({ error: "Too many reference images" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let uploadedUrl: string;

  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const path = `${id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("cake-references")
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    uploadedUrl = supabase.storage.from("cake-references").getPublicUrl(path).data.publicUrl;
  } else {
    // Dev fallback without Supabase Storage configured: inline the image as
    // a data URL, stored the same way in spec.referenceImageUrls either way.
    const base64 = Buffer.from(bytes).toString("base64");
    uploadedUrl = `data:${file.type};base64,${base64}`;
  }

  try {
    const draft = await updateDraftOrderSpec(id, {
      referenceImageUrls: [...currentImages, uploadedUrl],
    });
    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
}
