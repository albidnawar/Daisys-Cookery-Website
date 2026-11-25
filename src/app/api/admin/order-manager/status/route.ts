import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { requireOwner, AdminAuthError } from "@/lib/admin/auth";
import { ALL_ORDER_STATUSES } from "@/lib/admin/kanbanColumns";
import { bulkUpdateOrderStatus } from "@/lib/admin/orderManager";
import { ORDERS_KANBAN_TAG } from "@/lib/admin/ordersAdmin";

const VALID_STATUSES = ALL_ORDER_STATUSES.map((s) => s.value);

export async function PATCH(request: NextRequest) {
  try {
    await requireOwner();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }
    throw error;
  }

  const { ids, status } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No orders selected" }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await bulkUpdateOrderStatus(ids, status);
  revalidateTag(ORDERS_KANBAN_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
