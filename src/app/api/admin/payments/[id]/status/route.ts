import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { updatePaymentStatus } from "@/lib/admin/paymentsLedger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireModule("payments");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }

  const { id } = await params;
  const { paymentStatus } = await request.json();
  await updatePaymentStatus(id, paymentStatus);
  return NextResponse.json({ ok: true });
}
