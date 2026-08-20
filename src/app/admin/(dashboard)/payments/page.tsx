import { PaymentsLedger } from "@/components/admin/PaymentsLedger";
import { getDailyFinancialBreakdown, listPaymentLedger, listPendingTrxMatches } from "@/lib/admin/paymentsLedger";
import { todayKey } from "@/lib/dates";

export default async function AdminPaymentsPage() {
  const today = todayKey();
  const [ledger, pendingMatches, breakdown] = await Promise.all([
    listPaymentLedger(today),
    listPendingTrxMatches(),
    getDailyFinancialBreakdown(today),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">
        Payments &amp; financial ledger
      </h1>
      <PaymentsLedger
        initialLedger={ledger}
        initialPendingMatches={pendingMatches}
        initialBreakdown={breakdown}
      />
    </div>
  );
}
