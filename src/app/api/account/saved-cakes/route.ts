import { NextResponse, type NextRequest } from "next/server";
import { requireCustomer, CustomerAuthError } from "@/lib/customer/auth";
import { isCakeSaved, listSavedCakes, saveCake, SavedCakeError } from "@/lib/customer/savedCakes";

export async function GET(request: NextRequest) {
  try {
    const customer = await requireCustomer();
    const cakeId = request.nextUrl.searchParams.get("cakeId");
    if (cakeId) {
      const savedId = await isCakeSaved(customer.id, cakeId);
      return NextResponse.json({ saved: Boolean(savedId), savedId });
    }
    const savedCakes = await listSavedCakes(customer.id);
    return NextResponse.json({ savedCakes });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const customer = await requireCustomer();
    const body = await request.json().catch(() => ({}));
    const cakeId = typeof body.cakeId === "string" ? body.cakeId : "";
    if (!cakeId) return NextResponse.json({ error: "cakeId is required" }, { status: 400 });

    await saveCake(customer.id, cakeId);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    if (error instanceof SavedCakeError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
