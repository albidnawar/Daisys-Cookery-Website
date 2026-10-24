import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { deleteRiderAdmin, updateRiderAdmin, RiderError } from "@/lib/admin/ridersAdmin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireModule("delivery_riders");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const { id } = await params;
  const { name, phone } = (await request.json()) as { name: string; phone: string };
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!phone?.trim()) return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  try {
    await updateRiderAdmin(id, name.trim(), phone.trim());
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof RiderError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireModule("delivery_riders");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const { id } = await params;
  await deleteRiderAdmin(id);
  return NextResponse.json({ ok: true });
}
