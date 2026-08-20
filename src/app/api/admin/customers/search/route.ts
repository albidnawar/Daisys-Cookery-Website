import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/admin/auth";
import { searchCustomerByPhone } from "@/lib/admin/manualOrders";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const phone = request.nextUrl.searchParams.get("phone");
  if (!phone) return NextResponse.json({ error: "phone is required" }, { status: 400 });
  const customer = await searchCustomerByPhone(phone);
  return NextResponse.json({ customer });
}
