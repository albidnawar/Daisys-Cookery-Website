import { MockPaymentProvider } from "@/lib/payments/mockProvider";
import type { PaymentProvider } from "@/lib/payments/provider";

/** Selected by PAYMENT_PROVIDER (defaults to "mock"). Add a case + a new
 * *Provider.ts file here when real bKash/Nagad credentials are ready —
 * nothing else in the checkout/order flow needs to change. */
export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER || "mock";
  switch (provider) {
    case "mock":
    default:
      return new MockPaymentProvider();
  }
}
