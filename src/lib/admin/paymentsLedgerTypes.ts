import type { PaymentMethod, PaymentStatus } from "@/lib/types/domain";

// Split out from paymentsLedger.ts (same reason as kanbanColumns.ts) —
// that module imports the service-role Supabase client, which a Client
// Component must never pull into its bundle.
export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "deposit_paid", label: "Deposit paid" },
  { value: "paid_in_full", label: "Paid in full" },
  { value: "failed", label: "Failed / not found" },
  { value: "refunded", label: "Refunded" },
];

export type PaymentLedgerRow = {
  id: string;
  orderNumber: string;
  contactName: string;
  contactPhone: string;
  cakeName: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  manualTrxId: string | null;
  total: number;
  depositAmount: number;
  balanceDue: number;
  slotDate: string | null;
  createdAt: string;
};

export type DailyFinancialBreakdown = {
  collectedMfs: number;
  collectedCash: number;
  pendingCash: number;
  orderCount: number;
};
