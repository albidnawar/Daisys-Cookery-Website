import { NextResponse, type NextRequest } from "next/server";
import { requireOwner, AdminAuthError } from "@/lib/admin/auth";
import { createAdminAccount, listAdminAccounts, AdminAccountError, type CreateAdminAccountInput } from "@/lib/admin/adminAccounts";

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
  const accounts = await listAdminAccounts();
  return NextResponse.json({ accounts });
}

export async function POST(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const input = (await request.json()) as CreateAdminAccountInput;
    const id = await createAdminAccount(input);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAccountError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
