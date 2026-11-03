import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  addOrderReferenceImage,
  assertOrderCanAddReferenceImage,
  removeOrderReferenceImage,
} from "@/lib/admin/orderDetail";
import { ORDERS_KANBAN_TAG } from "@/lib/admin/ordersAdmin";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

async function guard() {
  try {
    await requireModule("live_orders");
    return null;
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
}

/** Lets an admin add a reference photo the customer sent after the order
 * was already placed (over Messenger/WhatsApp, a call, etc.) — stored in
 * the same "cake-references" bucket the customer's own order-form uploads
 * use, keyed by order id instead of draft id. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guard();
  if (denied) return denied;
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

  try {
    await assertOrderCanAddReferenceImage(id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't save that photo" },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const supabase = createServiceRoleClient();
  const path = `${id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("cake-references")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }
  const url = supabase.storage.from("cake-references").getPublicUrl(path).data.publicUrl;

  try {
    await addOrderReferenceImage(id, url);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't save that photo" },
      { status: 500 },
    );
  }
  revalidateTag(ORDERS_KANBAN_TAG, { expire: 0 });
  return NextResponse.json({ url });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url : null;
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    await removeOrderReferenceImage(id, url);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't remove that photo" },
      { status: 500 },
    );
  }
  revalidateTag(ORDERS_KANBAN_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
