import { createServiceRoleClient } from "@/lib/supabase/server";
import { listCustomerEventTags } from "@/lib/admin/customerEventTags";
import { listOptionValuesAdmin } from "@/lib/admin/optionValuesAdmin";
import { categorizeOrderEvent } from "@/lib/admin/orderEventCategory";
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
export type WeekdayStat = { weekday: string; count: number };

export type OverviewRangeStats = {
  revenue: number;
  orderCount: number;
  webOrderCount: number;
  manualOrderCount: number;
  topFlavors: RankedStat[];
  topWeights: RankedStat[];
  topKeywords: RankedStat[];
  topOccasions: RankedStat[];
  // Cancellations, counted over the same due-date range but reported
  // against (orderCount + cancelledCount) — the denominator a "what
  // fraction of bookings fall through" rate actually needs, since
  // orderCount itself already excludes cancellations.
  cancelledCount: number;
  cancellationRatePct: number;
  // How much notice orders actually give the kitchen: the gap between
  // when an order was placed and its due date. "Rush" = under 24 hours.
  avgLeadDays: number;
  medianLeadDays: number;
  rushOrderCount: number;
  rushOrderRatePct: number;
  // Demand by day of week the cake is due — a staffing/prep signal, kept
  // in calendar order (Sun–Sat) rather than ranked by count.
  ordersByWeekday: WeekdayStat[];
  // What share of this range's revenue came from customers who have
  // ordered more than once *lifetime* (not just within this range) —
  // the retention story the Customers CRM's "Repeat" badge already
  // tracks, rolled up to a single number here.
  repeatRevenue: number;
  repeatRevenueSharePct: number;
};

const WEIGHT_LABELS: Record<string, string> = {
  "1": "1 lb",
  "2": "2 lb",
  "3": "3 lb",
  "4": "4 lb",
  "5": "5 lb",
  other: "Custom (>5 lb)",
};

/** n omitted returns every entry (sorted, highest first) rather than
 * truncating — used for lists that are naturally small and complete
 * (every flavor the kitchen offers, every occasion category that exists)
 * where cutting off at a fixed count would quietly hide real entries. */
function topN(counts: Map<string, number>, n?: number): RankedStat[] {
  const sorted = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  return n === undefined ? sorted : sorted.slice(0, n);
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

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** UTC midnight (ms) for a "YYYY-MM-DD" date key — used as a fixed point
 * of reference for both the weekday and lead-time math below, independent
 * of the server's local timezone (going through `new Date(dateKey)`
 * directly parses it as UTC midnight too, but reading the weekday back
 * with `.getDay()` instead of `.getUTCDay()` would then shift by a day in
 * any timezone behind UTC). */
function utcMidnight(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function weekdayOf(dateKey: string): number {
  return new Date(utcMidnight(dateKey)).getUTCDay();
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Revenue, order mix, and top sellers for an arbitrary admin-chosen date
 * range — all keyed off the order's *due* date (its delivery/pickup slot
 * date), the same axis getSalesSummary() uses, so a custom range composes
 * sensibly with the fixed "today"/"this month" cards above it. `from`/`to`
 * are inclusive "YYYY-MM-DD" keys. */
export async function getOverviewRangeStats(from: string, to: string): Promise<OverviewRangeStats> {
  const supabase = createServiceRoleClient();
  const [{ data: orders, error: ordersError }, { data: lifetimeOrders, error: lifetimeError }, spongeValues, manualTags] =
    await Promise.all([
      supabase
        .from("orders")
        .select("total, order_source, status, created_at, cake_snapshot, contact_phone, delivery_slots!inner ( date )")
        .gte("delivery_slots.date", from)
        .lte("delivery_slots.date", to),
      // Unbounded — "repeat customer" is a lifetime status, not something
      // scoped to this range, so working out who qualifies needs every
      // order the phone number has ever placed, not just this window's.
      supabase.from("orders").select("contact_phone").neq("status", "cancelled"),
      listOptionValuesAdmin("sponge"),
      listCustomerEventTags(),
    ]);
  if (ordersError) throw ordersError;
  if (lifetimeError) throw lifetimeError;

  const spongeLabelByCode = new Map(spongeValues.map((v) => [v.valueCode, v.label]));

  const lifetimeOrderCounts = new Map<string, number>();
  for (const row of lifetimeOrders ?? []) {
    lifetimeOrderCounts.set(row.contact_phone, (lifetimeOrderCounts.get(row.contact_phone) ?? 0) + 1);
  }

  const stats: OverviewRangeStats = {
    revenue: 0,
    orderCount: 0,
    webOrderCount: 0,
    manualOrderCount: 0,
    topFlavors: [],
    topWeights: [],
    topKeywords: [],
    topOccasions: [],
    cancelledCount: 0,
    cancellationRatePct: 0,
    avgLeadDays: 0,
    medianLeadDays: 0,
    rushOrderCount: 0,
    rushOrderRatePct: 0,
    ordersByWeekday: WEEKDAY_LABELS.map((weekday) => ({ weekday, count: 0 })),
    repeatRevenue: 0,
    repeatRevenueSharePct: 0,
  };

  const flavorCounts = new Map<string, number>();
  const weightCounts = new Map<string, number>();
  const keywordCounts = new Map<string, number>();
  const occasionCounts = new Map<string, number>();
  const leadDaysByOrder: number[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (orders ?? []) as any[]) {
    if (row.status === "cancelled") {
      stats.cancelledCount += 1;
      continue;
    }

    stats.revenue += Number(row.total);
    stats.orderCount += 1;
    if (row.order_source === "web") stats.webOrderCount += 1;
    else stats.manualOrderCount += 1;

    if ((lifetimeOrderCounts.get(row.contact_phone) ?? 0) >= 2) {
      stats.repeatRevenue += Number(row.total);
    }

    const slotDate: string = row.delivery_slots.date;
    stats.ordersByWeekday[weekdayOf(slotDate)].count += 1;

    const leadDays = (utcMidnight(slotDate) - Date.parse(row.created_at)) / 86_400_000;
    leadDaysByOrder.push(leadDays);
    if (leadDays < 1) stats.rushOrderCount += 1;

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

    // Same occasion tagging the Customers CRM shows per order (see
    // customersCrm.ts) — the keyword matcher first, falling back to
    // whatever manual tag the owner assigned this customer's phone number.
    const occasion = categorizeOrderEvent(keywordText) ?? manualTags.get(row.contact_phone) ?? null;
    if (occasion) occasionCounts.set(occasion, (occasionCounts.get(occasion) ?? 0) + 1);
  }

  stats.topFlavors = topN(flavorCounts);
  stats.topWeights = topN(weightCounts, 8);
  stats.topKeywords = topN(keywordCounts, 8);
  stats.topOccasions = topN(occasionCounts);

  const bookedCount = stats.orderCount + stats.cancelledCount;
  stats.cancellationRatePct = bookedCount > 0 ? (stats.cancelledCount / bookedCount) * 100 : 0;
  stats.rushOrderRatePct = stats.orderCount > 0 ? (stats.rushOrderCount / stats.orderCount) * 100 : 0;
  stats.avgLeadDays =
    leadDaysByOrder.length > 0 ? leadDaysByOrder.reduce((a, b) => a + b, 0) / leadDaysByOrder.length : 0;
  stats.medianLeadDays = median([...leadDaysByOrder].sort((a, b) => a - b));
  stats.repeatRevenueSharePct = stats.revenue > 0 ? (stats.repeatRevenue / stats.revenue) * 100 : 0;

  return stats;
}

export type SalesReportRow = {
  date: string;
  orderNumber: string;
  customerName: string;
  contactPhone: string;
  status: string;
  channel: string;
  paymentMethod: string;
  paymentStatus: string;
  fulfilmentType: string;
  flavors: string;
  weight: string;
  subtotal: number;
  extrasTotal: number;
  deliveryFee: number;
  total: number;
};

/** One row per order due within the range, for the Overview's "Export
 * CSV" button — every status is included (not just non-cancelled) since
 * an admin downloading a sales report wants the full picture, same as
 * what they'd get exporting from a spreadsheet-driven business. */
export async function getSalesReportRows(from: string, to: string): Promise<SalesReportRow[]> {
  const supabase = createServiceRoleClient();
  const [{ data: orders, error }, spongeValues] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "order_number, contact_name, contact_phone, status, order_source, payment_method, payment_status, fulfilment_type, subtotal, extras_total, delivery_fee, total, cake_snapshot, delivery_slots!inner ( date )",
      )
      .gte("delivery_slots.date", from)
      .lte("delivery_slots.date", to)
      .order("date", { foreignTable: "delivery_slots", ascending: true }),
    listOptionValuesAdmin("sponge"),
  ]);
  if (error) throw error;

  const spongeLabelByCode = new Map(spongeValues.map((v) => [v.valueCode, v.label]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (orders ?? []).map((row: any) => {
    const snap = row.cake_snapshot as CakeSnapshot;
    const spec = snap.spec ?? {};
    const rawSponge = spec.sponge as string[] | string | undefined;
    const spongeCodes = Array.isArray(rawSponge) ? rawSponge : rawSponge ? [rawSponge] : [];
    const flavors = spongeCodes.map((code) => spongeLabelByCode.get(code) ?? code).join(", ");
    const weight = spec.sizeCode ? (WEIGHT_LABELS[spec.sizeCode] ?? spec.sizeCode) : "";

    return {
      date: row.delivery_slots.date,
      orderNumber: row.order_number,
      customerName: row.contact_name,
      contactPhone: row.contact_phone,
      status: row.status,
      channel: row.order_source,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      fulfilmentType: row.fulfilment_type,
      flavors,
      weight,
      subtotal: Number(row.subtotal),
      extrasTotal: Number(row.extras_total),
      deliveryFee: Number(row.delivery_fee),
      total: Number(row.total),
    };
  });
}
