import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/admin/auth";
import { getKitchenBatch } from "@/lib/admin/ordersAdmin";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const date = request.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });
  const batch = await getKitchenBatch(date);
  return NextResponse.json({ batch });
}
