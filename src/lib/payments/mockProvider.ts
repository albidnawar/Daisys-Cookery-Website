import { randomUUID } from "node:crypto";
import type { PaymentIntent, PaymentOrderInput, PaymentProvider } from "@/lib/payments/provider";

/** Stands in for bKash/Nagad/Card until real merchant credentials exist.
 * Settles every payment synchronously as "succeeded" — no redirect, no
 * webhook round-trip — so the checkout flow can be built and tested end
 * to end today. Swapping in a real provider later is a one-file change:
 * add e.g. bkashProvider.ts and select it in lib/payments/index.ts. */
export class MockPaymentProvider implements PaymentProvider {
  async createIntent(order: PaymentOrderInput): Promise<PaymentIntent> {
    void order;
    return { intentId: `mock_${randomUUID()}`, status: "succeeded", redirectUrl: null };
  }

  async confirmIntent(): Promise<{ status: PaymentIntent["status"] }> {
    return { status: "succeeded" };
  }

  verifyWebhook(): boolean {
    return true;
  }

  async refund(): Promise<{ status: string }> {
    return { status: "refunded" };
  }
}
