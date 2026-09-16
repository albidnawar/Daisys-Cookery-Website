import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { listOrdersForKanban } from "@/lib/admin/ordersAdmin";

export async function GET(request: NextRequest) {
  try {
    await requireModule("live_orders");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const date = request.nextUrl.searchParams.get("date") ?? undefined;
  const orders = await listOrdersForKanban(date);
  return NextResponse.json({ orders });
}
