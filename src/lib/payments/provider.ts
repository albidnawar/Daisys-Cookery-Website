export type PaymentIntentStatus = "pending" | "succeeded" | "failed";

export type PaymentIntent = {
  intentId: string;
  status: PaymentIntentStatus;
  /** Where to send the customer to complete payment. Null for providers
   * (like the mock) that settle synchronously with no redirect. */
  redirectUrl: string | null;
};

export type PaymentOrderInput = {
  orderId: string;
  amount: number;
  method: string;
};

/** The seam real bKash/Nagad/Card integrations plug into later without
 * touching checkout UI or order-finalization logic — see
 * lib/payments/index.ts for how an implementation is selected. */
export interface PaymentProvider {
  createIntent(order: PaymentOrderInput): Promise<PaymentIntent>;
  confirmIntent(intentId: string): Promise<{ status: PaymentIntentStatus }>;
  verifyWebhook(rawBody: string, signature: string | null): boolean;
  refund(orderId: string, amount: number): Promise<{ status: string }>;
}
