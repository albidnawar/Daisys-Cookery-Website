import { NextResponse } from "next/server";
import { requireCustomer, CustomerAuthError } from "@/lib/customer/auth";
import { unsaveCake } from "@/lib/customer/savedCakes";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const customer = await requireCustomer();
    const { id } = await params;
    await unsaveCake(customer.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
}
