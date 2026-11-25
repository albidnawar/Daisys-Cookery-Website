import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { setCustomerEventTag } from "@/lib/admin/customerEventTags";
import { normalizePhone } from "@/lib/phone";

export async function PATCH(request: NextRequest) {
  try {
    await requireModule("customers");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }

  const body = await request.json();
  const contactPhone = normalizePhone(String(body.contactPhone ?? ""));
  const tag = String(body.tag ?? "").trim();
  if (!contactPhone) {
    return NextResponse.json({ error: "Missing contactPhone" }, { status: 400 });
  }

  await setCustomerEventTag(contactPhone, tag);
  return NextResponse.json({ ok: true });
}
