import { NextResponse, type NextRequest } from "next/server";
import { requireOwner, AdminAuthError } from "@/lib/admin/auth";
import { updateStoreSettings } from "@/lib/admin/storeSettings";
import type { StoreSettings } from "@/lib/settings/store";

export async function PUT(request: NextRequest) {
  try {
    await requireOwner();
    const input = (await request.json()) as StoreSettings;
    await updateStoreSettings(input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    }
    throw error;
  }
}
