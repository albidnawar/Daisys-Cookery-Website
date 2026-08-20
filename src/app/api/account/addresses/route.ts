import { NextResponse, type NextRequest } from "next/server";
import { requireCustomer, CustomerAuthError } from "@/lib/customer/auth";
import { createAddress, listAddresses } from "@/lib/customer/addresses";

export async function GET() {
  try {
    const customer = await requireCustomer();
    const addresses = await listAddresses(customer.id);
    return NextResponse.json({ addresses });
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
    const label = typeof body.label === "string" ? body.label.trim() : "";
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!label || !text) {
      return NextResponse.json({ error: "Label and address are required" }, { status: 400 });
    }

    await createAddress(customer.id, { label, text, isDefault: Boolean(body.isDefault) });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
}
