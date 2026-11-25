import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { requireOwner, AdminAuthError, ADMIN_ROW_TAG } from "@/lib/admin/auth";
import { deleteCustomRole, updateCustomRole, updateRoleModules, AdminRoleError } from "@/lib/admin/adminRoles";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireOwner();
    const { id } = await params;
    const { name, modules } = await request.json();
    // A built-in role's name is never sent (RoleManager doesn't show a
    // name field for it) — only its module list can change, via the path
    // that works on built-in roles too.
    if (name === undefined) {
      await updateRoleModules(id, modules ?? []);
    } else {
      await updateCustomRole(id, name, modules ?? []);
    }
    revalidateTag(ADMIN_ROW_TAG, { expire: 0 });
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
    revalidateTag(ADMIN_ROW_TAG, { expire: 0 });
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
