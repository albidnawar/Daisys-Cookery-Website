/** What the customer owes up front to hold a date — either a percentage
 * of the order total, or a flat amount regardless of total, per the
 * admin's choice in Settings. Kept as its own small type (rather than
 * passing a bare number around) since the "percentage vs fixed" shape
 * has to travel everywhere a deposit is computed OR described in copy. */
export type DepositConfig = { mode: "percentage"; rate: number } | { mode: "fixed"; amount: number };

export function toDepositConfig(settings: {
  depositMode: "percentage" | "fixed";
  depositRate: number;
  depositFixedAmount: number | null;
}): DepositConfig {
  return settings.depositMode === "fixed"
    ? { mode: "fixed", amount: settings.depositFixedAmount ?? 0 }
    : { mode: "percentage", rate: settings.depositRate };
}

/** A fixed advance never exceeds the order total — e.g. a ৳500 flat
 * advance on a ৳300 cupcake order just means the whole thing is due now. */
export function computeDepositAmount(total: number, deposit: DepositConfig): number {
  if (deposit.mode === "fixed") return Math.min(Math.round(deposit.amount), Math.round(total));
  return Math.round(total * deposit.rate);
}

/** Short copy for sentences like "A {depositLabel} holds the date" —
 * "30% deposit" or "৳500 advance". The single place this phrasing lives,
 * so every page/message describing the deposit stays in sync. */
export function depositLabel(deposit: DepositConfig): string {
  return deposit.mode === "fixed"
    ? `৳${deposit.amount.toLocaleString("en-BD")} advance`
    : `${Math.round(deposit.rate * 100)}% deposit`;
}
