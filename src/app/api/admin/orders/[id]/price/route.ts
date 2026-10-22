import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { setOrderPrice } from "@/lib/admin/orderDetail";

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
  const body = await request.json().catch(() => ({}));
  const subtotal = Number(body.subtotal);
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ error: "A valid price is required" }, { status: 400 });
  }
  let depositAmount: number | undefined;
  if (body.depositAmount !== undefined && body.depositAmount !== null) {
    depositAmount = Number(body.depositAmount);
    if (!Number.isFinite(depositAmount) || depositAmount < 0) {
      return NextResponse.json({ error: "A valid deposit amount is required" }, { status: 400 });
    }
  }
  let deliveryFee: number | undefined;
  if (body.deliveryFee !== undefined && body.deliveryFee !== null) {
    deliveryFee = Number(body.deliveryFee);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      return NextResponse.json({ error: "A valid delivery cost is required" }, { status: 400 });
    }
  }

  await setOrderPrice(id, subtotal, depositAmount, deliveryFee);
  return NextResponse.json({ ok: true });
}
