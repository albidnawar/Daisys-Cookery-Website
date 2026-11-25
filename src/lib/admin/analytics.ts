import { createServiceRoleClient } from "@/lib/supabase/server";
import { listOptionValuesAdmin } from "@/lib/admin/optionValuesAdmin";
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

export type OverviewRangeStats = {
  revenue: number;
  orderCount: number;
  webOrderCount: number;
  manualOrderCount: number;
  topFlavors: RankedStat[];
  topWeights: RankedStat[];
  topKeywords: RankedStat[];
};

const WEIGHT_LABELS: Record<string, string> = {
  "1": "1 lb",
  "2": "2 lb",
  "3": "3 lb",
  "4": "4 lb",
  "5": "5 lb",
  other: "Custom (>5 lb)",
};

function topN(counts: Map<string, number>, n = 8): RankedStat[] {
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

// Generic words that show up constantly in cake names, icing messages, and
// theme notes but carry no information about what makes an order distinct
// ("Happy Birthday" tells you nothing a hundred other orders didn't also
// say) — filtered out so the keyword ranking surfaces actual themes
// ("unicorn", "wedding", "football") instead of this filler.
const KEYWORD_STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "is",
  "it", "this", "that", "please", "want", "wanted", "need", "needed", "like",
  "would", "could", "can", "make", "making", "also", "just", "some", "any",
  "thanks", "thank", "you", "your", "our", "we", "order", "ordering", "cake",
  "custom", "design", "flavor", "flavour", "bean", "happy", "dear", "from",
  "will", "all", "are", "have", "has", "but", "not", "one", "two", "lb",
  "same", "add", "name", "years",
  // Romanized-Bengali grammatical connectors (e.g. "hobe"/"thakbe" = "will
  // be", "likha"/"lekha" = "written", "upore" = "on top") that show up
  // constantly in Banglish instructions — grammar, not theme content.
  "hobe", "hobee", "hbe", "likha", "lekha", "upore", "thakbe",
]);

function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length >= 3 && !KEYWORD_STOPWORDS.has(word)),
  );
}

/** Revenue, order mix, and top sellers for an arbitrary admin-chosen date
 * range — all keyed off the order's *due* date (its delivery/pickup slot
 * date), the same axis getSalesSummary() uses, so a custom range composes
 * sensibly with the fixed "today"/"this month" cards above it. `from`/`to`
 * are inclusive "YYYY-MM-DD" keys. */
export async function getOverviewRangeStats(from: string, to: string): Promise<OverviewRangeStats> {
  const supabase = createServiceRoleClient();
  const [{ data: orders, error: ordersError }, spongeValues] = await Promise.all([
    supabase
      .from("orders")
      .select("total, order_source, cake_snapshot, delivery_slots!inner ( date )")
      .neq("status", "cancelled")
      .gte("delivery_slots.date", from)
      .lte("delivery_slots.date", to),
    listOptionValuesAdmin("sponge"),
  ]);
  if (ordersError) throw ordersError;

  const spongeLabelByCode = new Map(spongeValues.map((v) => [v.valueCode, v.label]));

  const stats: OverviewRangeStats = {
    revenue: 0,
    orderCount: 0,
    webOrderCount: 0,
    manualOrderCount: 0,
    topFlavors: [],
    topWeights: [],
    topKeywords: [],
  };

  const flavorCounts = new Map<string, number>();
  const weightCounts = new Map<string, number>();
  const keywordCounts = new Map<string, number>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (orders ?? []) as any[]) {
    stats.revenue += Number(row.total);
    stats.orderCount += 1;
    if (row.order_source === "web") stats.webOrderCount += 1;
    else stats.manualOrderCount += 1;

    const snap = row.cake_snapshot as CakeSnapshot;
    const spec = snap.spec ?? {};

    // Flavor became a multi-select array after shipping as a single
    // string — a frozen cake_snapshot from before that change can still
    // hold the old shape (same legacy-shape concern as specLabels.ts).
    const rawSponge = spec.sponge as string[] | string | undefined;
    const spongeCodes = Array.isArray(rawSponge) ? rawSponge : rawSponge ? [rawSponge] : [];
    for (const code of spongeCodes) {
      const label = spongeLabelByCode.get(code) ?? code;
      flavorCounts.set(label, (flavorCounts.get(label) ?? 0) + 1);
    }

    const sizeCode = spec.sizeCode;
    if (sizeCode) {
      const label = WEIGHT_LABELS[sizeCode] ?? sizeCode;
      weightCounts.set(label, (weightCounts.get(label) ?? 0) + 1);
    }

    // "Popular design" used to group by the literal cake name, but most
    // orders are customized "Build your own cake" ones that all carry the
    // same placeholder name (see customise/[slug]/page.tsx and
    // orders/store.ts) — grouping by exact name mostly just counted that
    // placeholder. Instead, pull keywords out of every bit of freeform
    // text an order actually carries (the cake's own name/title, the
    // on-cake icing message, and the customer's theme notes) so recurring
    // themes surface regardless of which path the order came through.
    const keywordText = [snap.name, spec.message, spec.instructions].filter(Boolean).join(" ");
    for (const keyword of extractKeywords(keywordText)) {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) ?? 0) + 1);
    }
  }

  stats.topFlavors = topN(flavorCounts);
  stats.topWeights = topN(weightCounts);
  stats.topKeywords = topN(keywordCounts);

  return stats;
}
