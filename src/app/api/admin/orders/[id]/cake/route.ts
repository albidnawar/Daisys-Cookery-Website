import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { updateOrderCakeSpec, type CakeSpecPatch } from "@/lib/admin/orderDetail";
import { ORDERS_KANBAN_TAG } from "@/lib/admin/ordersAdmin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireModule("live_orders");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }

  const { id } = await params;
  const input = (await request.json()) as CakeSpecPatch;

  try {
    await updateOrderCakeSpec(id, input);
  } catch (error) {
    console.error("Failed to update cake details", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't save those changes" },
      { status: 500 },
    );
  }
  revalidateTag(ORDERS_KANBAN_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
