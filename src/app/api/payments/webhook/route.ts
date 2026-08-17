import { NextResponse, type NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments";

// Stub: the mock provider never actually calls this (it settles
// synchronously in createIntent), but a real bKash/Nagad/Card integration
// would land its async payment-result callback here. verifyWebhook() is
// the signature-check seam — MockPaymentProvider's always returns true;
// a real provider's would reject anything not actually from that gateway.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");

  if (!getPaymentProvider().verifyWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Real order-status update on payment confirmation is wired up once
  // there's a live provider to receive events from; logged here in the
  // meantime so the endpoint is exercised end-to-end.
  console.log("Payment webhook received:", rawBody);
  return NextResponse.json({ received: true });
}
