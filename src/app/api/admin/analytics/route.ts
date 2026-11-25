import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { getOverviewRangeStats } from "@/lib/admin/analytics";
import { todayKey } from "@/lib/dates";

export async function GET(request: NextRequest) {
  try {
    await requireModule("overview");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }

  const params = request.nextUrl.searchParams;
  const today = todayKey();
  const from = params.get("from") ?? today.slice(0, 8) + "01";
  const to = params.get("to") ?? today;

  const stats = await getOverviewRangeStats(from, to);
  return NextResponse.json(stats);
}
