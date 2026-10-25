import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { updateOrderCakeSpec, type CakeSpecPatch } from "@/lib/admin/orderDetail";

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
  await updateOrderCakeSpec(id, input);
  return NextResponse.json({ ok: true });
}
