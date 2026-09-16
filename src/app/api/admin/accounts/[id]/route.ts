import { NextResponse, type NextRequest } from "next/server";
import { requireOwner, AdminAuthError } from "@/lib/admin/auth";
import { AdminAccountError, removeAdminAccount, updateAdminRole } from "@/lib/admin/adminAccounts";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOwner();
    const { id } = await params;
    const { roleId } = await request.json();
    await updateAdminRole(id, roleId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }
    if (error instanceof AdminAccountError) {
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
    const currentAdmin = await requireOwner();
    const { id } = await params;
    await removeAdminAccount(id, currentAdmin.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }
    if (error instanceof AdminAccountError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
