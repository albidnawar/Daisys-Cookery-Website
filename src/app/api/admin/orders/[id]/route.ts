import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { updateOrderDetails, type OrderEditableFields } from "@/lib/admin/orderDetail";

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
  const input = (await request.json()) as OrderEditableFields;
  if (!input.contactName?.trim() || !input.contactPhone?.trim()) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }
  await updateOrderDetails(id, input);
  return NextResponse.json({ ok: true });
}
