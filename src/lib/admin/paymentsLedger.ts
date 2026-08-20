import { createServiceRoleClient } from "@/lib/supabase/server";
import type { CakeSnapshot } from "@/lib/types/domain";
import type { DailyFinancialBreakdown, PaymentLedgerRow } from "@/lib/admin/paymentsLedgerTypes";

export type { PaymentLedgerRow, DailyFinancialBreakdown } from "@/lib/admin/paymentsLedgerTypes";

/** All non-cancelled orders' payment info, newest first. No merchant API
 * exists (bKash/Nagad are personal-number, self-reported TrxID) — this is
 * the read side of that manual reconciliation, not a gateway sync. */
export async function listPaymentLedger(date?: string): Promise<PaymentLedgerRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, cake_snapshot, contact_name, contact_phone, payment_method, payment_status, manual_trx_id, total, deposit_amount, balance_due, created_at, delivery_slots ( date )",
    )
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = (data as any[]).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    cakeName: (row.cake_snapshot as CakeSnapshot).name,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    manualTrxId: row.manual_trx_id,
    total: Number(row.total),
    depositAmount: Number(row.deposit_amount),
    balanceDue: Number(row.balance_due),
    slotDate: row.delivery_slots?.date ?? null,
    createdAt: row.created_at,
  }));

  if (date) rows = rows.filter((r) => r.slotDate === date);
  return rows;
}

/** The TrxID Matcher queue: bKash/Nagad orders the customer claims to have
 * paid but nobody's checked the shop's own bKash/Nagad app yet. Not
 * date-filtered — an unverified payment from any day still needs action. */
export async function listPendingTrxMatches(): Promise<PaymentLedgerRow[]> {
  const all = await listPaymentLedger();
  return all.filter(
    (r) => (r.paymentMethod === "bkash" || r.paymentMethod === "nagad") && r.paymentStatus === "pending",
  );
}

/** Every order carries a 30% deposit / 70%-at-the-door split. The deposit
 * on a bKash/Nagad order is the only part actually collected digitally —
 * the balance, and the whole amount on a cash-on-collection order, is
 * handed over in cash at pickup/delivery (see updateOrderStatus's
 * auto-settle-on-collection). These three buckets are mutually exclusive
 * and sum to the day's full order value: collected digitally + collected
 * in cash + still outstanding. */
function collectedViaMfs(row: PaymentLedgerRow): number {
  if (row.paymentMethod !== "bkash" && row.paymentMethod !== "nagad") return 0;
  if (row.paymentStatus === "paid_in_full" || row.paymentStatus === "deposit_paid") {
    return row.depositAmount;
  }
  return 0;
}

function collectedInCash(row: PaymentLedgerRow): number {
  if (row.paymentStatus !== "paid_in_full") return 0;
  return row.paymentMethod === "cash_on_collection" ? row.total : row.balanceDue;
}

export function pendingCashDue(row: PaymentLedgerRow): number {
  if (row.paymentStatus === "paid_in_full") return 0;
  if (row.paymentStatus === "deposit_paid") return row.balanceDue;
  return row.total;
}

export async function getDailyFinancialBreakdown(date: string): Promise<DailyFinancialBreakdown> {
  const rows = await listPaymentLedger(date);
  return {
    collectedMfs: rows.reduce((sum, r) => sum + collectedViaMfs(r), 0),
    collectedCash: rows.reduce((sum, r) => sum + collectedInCash(r), 0),
    pendingCash: rows.reduce((sum, r) => sum + pendingCashDue(r), 0),
    orderCount: rows.length,
  };
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentLedgerRow["paymentStatus"],
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("orders").update({ payment_status: paymentStatus }).eq("id", orderId);
  if (error) throw error;
}
