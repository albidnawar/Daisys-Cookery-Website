import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { updateDraftOrderSpec } from "@/lib/draftOrders/store";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

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

  const bytes = new Uint8Array(await file.arrayBuffer());
  let referenceImageUrl: string;

  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const path = `${id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("cake-references")
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    referenceImageUrl = supabase.storage
      .from("cake-references")
      .getPublicUrl(path).data.publicUrl;
  } else {
    // Dev fallback without Supabase Storage configured: inline the image as
    // a data URL, stored the same way in spec.referenceImageUrl either way.
    const base64 = Buffer.from(bytes).toString("base64");
    referenceImageUrl = `data:${file.type};base64,${base64}`;
  }

  try {
    const draft = await updateDraftOrderSpec(id, { referenceImageUrl });
    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
}
