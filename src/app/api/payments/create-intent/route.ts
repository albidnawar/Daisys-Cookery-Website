import { NextResponse, type NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments";

// Not called internally by /api/orders (which talks to the provider
// directly to avoid an in-process HTTP round-trip to itself) — this route
// exists as the documented, directly-testable entry point the plan calls
// for, and as the shape a real bKash/Nagad hosted-checkout redirect would
// eventually hang off of.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { orderId, amount, method } = body;

  if (!orderId || typeof amount !== "number" || !method) {
    return NextResponse.json(
      { error: "orderId, amount, and method are required" },
      { status: 400 },
    );
  }

  const intent = await getPaymentProvider().createIntent({ orderId, amount, method });
  return NextResponse.json({ intent });
}
