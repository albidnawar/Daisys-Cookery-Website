import { NextResponse, type NextRequest } from "next/server";
import { requireOwner, AdminAuthError } from "@/lib/admin/auth";
import { createCustomRole, listAdminRoles, AdminRoleError } from "@/lib/admin/adminRoles";

async function guard() {
  try {
    await requireOwner();
    return null;
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }
    throw error;
  }
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const roles = await listAdminRoles();
  return NextResponse.json({ roles });
}

export async function POST(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const { name, modules } = await request.json();
    const id = await createCustomRole(name, modules ?? []);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminRoleError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
