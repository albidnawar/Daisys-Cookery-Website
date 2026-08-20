import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/admin/auth";
import { createManualOrder, ManualOrderError, type ManualOrderInput } from "@/lib/admin/manualOrders";

export async function POST(request: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }

  const input = (await request.json()) as Omit<ManualOrderInput, "createdByAdminId">;
  try {
    const order = await createManualOrder({ ...input, createdByAdminId: admin.id });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof ManualOrderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
