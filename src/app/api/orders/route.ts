import { NextResponse, type NextRequest } from "next/server";
import { createOrder, OrderValidationError } from "@/lib/orders/store";
import { getCurrentCustomer } from "@/lib/customer/auth";
import type { PaymentMethod } from "@/lib/types/domain";

const PAYMENT_METHODS: PaymentMethod[] = ["bkash", "nagad", "card", "cash_on_collection"];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { draftId, contactName, contactPhone, kitchenNote, paymentMethod, manualTrxId } = body;

  if (!draftId || !contactName || !contactPhone) {
    return NextResponse.json(
      { error: "draftId, contactName, and contactPhone are required" },
      { status: 400 },
    );
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: "Invalid paymentMethod" }, { status: 400 });
  }
  if ((paymentMethod === "bkash" || paymentMethod === "nagad") && !manualTrxId) {
    return NextResponse.json(
      { error: "The number the deposit was sent from is required for bKash/Nagad, since there's no merchant gateway to verify it any other way" },
      { status: 400 },
    );
  }

  try {
    const customer = await getCurrentCustomer();
    const order = await createOrder({
      draftId,
      contactName,
      contactPhone,
      kitchenNote,
      paymentMethod,
      manualTrxId: manualTrxId ?? null,
      customerId: customer?.id ?? null,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
