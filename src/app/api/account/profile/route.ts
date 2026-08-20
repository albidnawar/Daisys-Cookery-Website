import { NextResponse, type NextRequest } from "next/server";
import { requireCustomer, CustomerAuthError } from "@/lib/customer/auth";
import { updateProfile } from "@/lib/customer/profile";

export async function PUT(request: NextRequest) {
  try {
    const customer = await requireCustomer();
    const body = await request.json().catch(() => ({}));
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() || null : null;
    const phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
    const allergenDefaults = Array.isArray(body.allergenDefaults)
      ? body.allergenDefaults.filter((tag: unknown) => typeof tag === "string")
      : [];

    await updateProfile(customer.id, { displayName, phone, allergenDefaults });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
}
