import { createServiceRoleClient } from "@/lib/supabase/server";
import { todayKey } from "@/lib/dates";
import type { CakeSnapshot } from "@/lib/types/domain";

export type SalesSummary = {
  dailyRevenue: number;
  dailyOrderCount: number;
  monthlyRevenue: number;
  monthlyOrderCount: number;
  webOrderCount: number;
  manualOrderCount: number;
};

/** Revenue here means order value by the day it's *due* (its delivery/
 * pickup slot date) — the same "today"/"this month" the Kanban board and
 * Kitchen Batch use — not the day it was placed. A bakery routinely takes
 * orders well ahead of their delivery date, so counting by created_at
 * would mix in orders due on completely different days (the original bug
 * this fixes: "Orders today" showed every order placed today regardless
 * of when it was actually scheduled for). Cancelled orders are excluded,
 * same as Kanban. This is a different question from the Payments ledger's
 * "cash actually collected," which tracks money in hand rather than sales
 * volume. */
export async function getSalesSummary(): Promise<SalesSummary> {
  const supabase = createServiceRoleClient();
  const today = todayKey();
  const monthPrefix = today.slice(0, 7);

  // Same unbounded, filter-in-JS shape as listOrdersForKanban() — a slot
  // date can be arbitrarily far in the future (no more fixed booking
  // window), so a created_at cutoff here would wrongly exclude orders
  // placed long ago for a slot date that falls in the current day/month.
  const { data, error } = await supabase
    .from("orders")
    .select("total, order_source, delivery_slots ( date )")
    .neq("status", "cancelled");
  if (error) throw error;

  const summary: SalesSummary = {
    dailyRevenue: 0,
    dailyOrderCount: 0,
    monthlyRevenue: 0,
    monthlyOrderCount: 0,
    webOrderCount: 0,
    manualOrderCount: 0,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data ?? []) as any[]) {
    const slotDate: string | null = row.delivery_slots?.date ?? null;
    if (!slotDate || !slotDate.startsWith(monthPrefix)) continue;

    const total = Number(row.total);
    summary.monthlyRevenue += total;
    summary.monthlyOrderCount += 1;
    if (row.order_source === "web") summary.webOrderCount += 1;
    else summary.manualOrderCount += 1;
    if (slotDate === today) {
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
