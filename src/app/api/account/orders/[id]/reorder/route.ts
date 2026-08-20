import { NextResponse } from "next/server";
import { requireCustomer, CustomerAuthError } from "@/lib/customer/auth";
import { createReorderDraft, ReorderError } from "@/lib/customer/orders";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const customer = await requireCustomer();
    const { id } = await params;
    const draftId = await createReorderDraft(customer.id, id);
    return NextResponse.json({ draftId });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    if (error instanceof ReorderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
