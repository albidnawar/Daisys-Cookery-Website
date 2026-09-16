import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { updateOrderStatus } from "@/lib/admin/ordersAdmin";
import type { OrderStatus } from "@/lib/types/domain";

const VALID_STATUSES: OrderStatus[] = [
  "received",
  "confirmed",
  "baking",
  "ready",
  "out_for_delivery",
  "collected",
  "delivered",
  "cancelled",
];

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
  const { status } = await request.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  await updateOrderStatus(id, status);
  return NextResponse.json({ ok: true });
}
