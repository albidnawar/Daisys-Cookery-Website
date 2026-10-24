import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { createRiderAdmin, listRidersAdmin, RiderError } from "@/lib/admin/ridersAdmin";

export async function GET() {
  try {
    await requireModule("delivery_riders");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const riders = await listRidersAdmin();
  return NextResponse.json({ riders });
}

export async function POST(request: NextRequest) {
  try {
    await requireModule("delivery_riders");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const { name, phone } = (await request.json()) as { name: string; phone: string };
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!phone?.trim()) return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  try {
    const id = await createRiderAdmin(name.trim(), phone.trim());
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof RiderError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
