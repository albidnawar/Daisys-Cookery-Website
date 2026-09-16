import { NextResponse, type NextRequest } from "next/server";
import { requireOwner, AdminAuthError } from "@/lib/admin/auth";
import { deleteCustomRole, updateCustomRole, AdminRoleError } from "@/lib/admin/adminRoles";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOwner();
    const { id } = await params;
    const { name, modules } = await request.json();
    await updateCustomRole(id, name, modules ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }
    if (error instanceof AdminRoleError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOwner();
    const { id } = await params;
    await deleteCustomRole(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }
    if (error instanceof AdminRoleError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
