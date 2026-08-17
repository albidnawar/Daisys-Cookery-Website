import { NextResponse, type NextRequest } from "next/server";
import { createOrder, OrderValidationError } from "@/lib/orders/store";
import type { PaymentMethod } from "@/lib/types/domain";

const PAYMENT_METHODS: PaymentMethod[] = ["bkash", "nagad", "card", "cash_on_collection"];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { draftId, contactName, contactPhone, kitchenNote, paymentMethod } = body;

  if (!draftId || !contactName || !contactPhone) {
    return NextResponse.json(
      { error: "draftId, contactName, and contactPhone are required" },
      { status: 400 },
    );
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: "Invalid paymentMethod" }, { status: 400 });
  }

  try {
    const order = await createOrder({
      draftId,
      contactName,
      contactPhone,
      kitchenNote,
      paymentMethod,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
