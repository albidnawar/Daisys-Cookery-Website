import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { getDailyFinancialBreakdown, listPaymentLedger, listPendingTrxMatches } from "@/lib/admin/paymentsLedger";
import { todayKey } from "@/lib/dates";

export async function GET(request: NextRequest) {
  try {
    await requireModule("payments");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }

  const date = request.nextUrl.searchParams.get("date");
  const [ledger, pendingMatches, breakdown] = await Promise.all([
    listPaymentLedger(date ?? undefined),
    listPendingTrxMatches(),
    getDailyFinancialBreakdown(date ?? todayKey()),
  ]);

  return NextResponse.json({ ledger, pendingMatches, breakdown });
}
