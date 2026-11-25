import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { requireOwner, AdminAuthError } from "@/lib/admin/auth";
import { listOrdersForManager, deleteOrders } from "@/lib/admin/orderManager";
import { ORDERS_KANBAN_TAG } from "@/lib/admin/ordersAdmin";
import type { OrderStatus } from "@/lib/types/domain";

async function guard() {
  try {
    await requireOwner();
    return null;
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const params = request.nextUrl.searchParams;
  const statusesParam = params.get("statuses");
  const statuses = statusesParam ? (statusesParam.split(",") as OrderStatus[]) : undefined;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;

  const orders = await listOrdersForManager({ statuses, from, to });
  return NextResponse.json({ orders });
}

export async function DELETE(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No orders selected" }, { status: 400 });
  }

  await deleteOrders(ids);
  revalidateTag(ORDERS_KANBAN_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
