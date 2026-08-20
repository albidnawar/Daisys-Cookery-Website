import { createServiceRoleClient } from "@/lib/supabase/server";
import { toDateKey, todayKey } from "@/lib/dates";
import type { CakeSnapshot } from "@/lib/types/domain";

export type SalesSummary = {
  dailyRevenue: number;
  dailyOrderCount: number;
  monthlyRevenue: number;
  monthlyOrderCount: number;
  webOrderCount: number;
  manualOrderCount: number;
};

/** Revenue here means order value by the day it was *placed* — how much
 * business came in today/this month — a different question from the
 * Payments ledger's "cash actually collected," which tracks money in hand
 * rather than sales volume. */
export async function getSalesSummary(): Promise<SalesSummary> {
  const supabase = createServiceRoleClient();
  const today = todayKey();
  const monthPrefix = today.slice(0, 7);

  // created_at is a UTC timestamp; comparing it against a bare local date
  // string at the DB level would shift results by Bangladesh's UTC+6 offset
  // (the same bug class toDateKey()/todayKey() exist to avoid elsewhere).
  // Instead, pull a UTC-safe margin wide enough to cover the whole month
  // either way, then bucket by local calendar day/month in JS.
  const cutoff = new Date(Date.now() - 35 * 86400_000).toISOString();
  const { data, error } = await supabase
    .from("orders")
    .select("total, order_source, created_at")
    .neq("status", "cancelled")
    .gte("created_at", cutoff);
  if (error) throw error;

  const summary: SalesSummary = {
    dailyRevenue: 0,
    dailyOrderCount: 0,
    monthlyRevenue: 0,
    monthlyOrderCount: 0,
    webOrderCount: 0,
    manualOrderCount: 0,
  };

  for (const row of data ?? []) {
    const localDate = toDateKey(new Date(row.created_at));
    if (!localDate.startsWith(monthPrefix)) continue;

    const total = Number(row.total);
    summary.monthlyRevenue += total;
    summary.monthlyOrderCount += 1;
    if (row.order_source === "web") summary.webOrderCount += 1;
    else summary.manualOrderCount += 1;
    if (localDate === today) {
      summary.dailyRevenue += total;
      summary.dailyOrderCount += 1;
    }
  }

  return summary;
}

export type RankedStat = { label: string; count: number };

export type TopSellerStats = {
  topFlavors: RankedStat[];
  topWeights: RankedStat[];
  topDesigns: RankedStat[];
};

const WEIGHT_LABELS: Record<string, string> = {
  "1": "1 lb",
  "2": "2 lb",
  "3": "3 lb",
  "4": "4 lb",
  "5": "5 lb",
  other: "Custom (>5 lb)",
};

function topN(counts: Map<string, number>, n = 5): RankedStat[] {
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** Flavor is resolved from the *current* catalog via the frozen snapshot's
 * slug — good enough for a top-sellers report since flavors are rarely
 * reassigned after the fact. Custom-quote orders (no slug) simply don't
 * count toward flavor stats. */
export async function getTopSellerStats(days: number): Promise<TopSellerStats> {
  const supabase = createServiceRoleClient();
  const cutoff = new Date(Date.now() - days * 86400_000).toISOString();
  const [{ data: orders, error: ordersError }, { data: cakes, error: cakesError }] = await Promise.all([
    supabase.from("orders").select("cake_snapshot").neq("status", "cancelled").gte("created_at", cutoff),
    supabase.from("cakes").select("slug, flavors ( name )"),
  ]);
  if (ordersError) throw ordersError;
  if (cakesError) throw cakesError;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flavorBySlug = new Map((cakes as any[]).map((c) => [c.slug, c.flavors?.name ?? null]));

  const flavorCounts = new Map<string, number>();
  const weightCounts = new Map<string, number>();
  const designCounts = new Map<string, number>();

  for (const row of orders ?? []) {
    const snap = row.cake_snapshot as CakeSnapshot;

    const flavor = snap.slug ? flavorBySlug.get(snap.slug) : null;
    if (flavor) flavorCounts.set(flavor, (flavorCounts.get(flavor) ?? 0) + 1);

    const sizeCode = snap.spec?.sizeCode;
    if (sizeCode) {
      const label = WEIGHT_LABELS[sizeCode] ?? sizeCode;
      weightCounts.set(label, (weightCounts.get(label) ?? 0) + 1);
    }

    designCounts.set(snap.name, (designCounts.get(snap.name) ?? 0) + 1);
  }

  return {
    topFlavors: topN(flavorCounts),
    topWeights: topN(weightCounts),
    topDesigns: topN(designCounts),
  };
}
