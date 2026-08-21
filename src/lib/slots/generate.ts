import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { toDateKey } from "@/lib/dates";
import { listZones } from "@/lib/slots/store";
import {
  DAYS_AHEAD,
  DELIVERY_CAPACITY,
  DELIVERY_WINDOWS,
  PICKUP_CAPACITY,
  PICKUP_WINDOWS,
} from "@/lib/slots/store";

/** supabase/seed.sql generated exactly DAYS_AHEAD of slots ONCE, at whatever
 * moment the project was first seeded — there's no cron job or admin
 * screen that ever extends it. Once "today" walks past that fixed window,
 * every date silently returns zero slots and no one can order, with no
 * error anywhere to point at why.
 *
 * Fix: self-heal on read. Both the customer-facing availability check and
 * the admin Logistics page call ensureSlotsGenerated() before doing
 * anything else. It's a cheap no-op almost always (the horizon date
 * already has rows); the ~30-days-later moment someone next hits either
 * page, it notices the gap and re-extends the whole window in one shot —
 * so the system re-heals through ordinary usage, no external scheduler
 * required. Inserts use ignoreDuplicates so overlapping calls (or a
 * request racing an admin's page load) can never create duplicate rows —
 * the (date, start_time, fulfilment_type, zone_id) unique constraint
 * already guarantees that. */
export async function ensureSlotsGenerated(): Promise<void> {
  if (!isSupabaseConfigured()) return; // dev fallback generates its own window per-request already

  const supabase = createServiceRoleClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizonDate = new Date(today);
  horizonDate.setDate(horizonDate.getDate() + (DAYS_AHEAD - 1));
  const horizonKey = toDateKey(horizonDate);

  const { count, error: checkError } = await supabase
    .from("delivery_slots")
    .select("id", { count: "exact", head: true })
    .eq("date", horizonKey);
  if (checkError) throw checkError;
  if ((count ?? 0) > 0) return; // window already reaches far enough — nothing to do

  const zones = await listZones();
  const pickupZone = zones.find((z) => z.distanceBand === "pickup");
  const deliveryZones = zones.filter((z) => z.distanceBand !== "pickup");
  if (!pickupZone) return; // delivery_zones itself was never seeded — not this function's job to fix

  const rows: {
    date: string;
    start_time: string;
    end_time: string;
    fulfilment_type: "pickup" | "delivery";
    zone_id: string;
    capacity: number;
  }[] = [];

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateKey = toDateKey(d);

    for (const [start, end] of PICKUP_WINDOWS) {
      rows.push({
        date: dateKey,
        start_time: start,
        end_time: end,
        fulfilment_type: "pickup",
        zone_id: pickupZone.id,
        capacity: PICKUP_CAPACITY,
      });
    }
    for (const zone of deliveryZones) {
      for (const [start, end] of DELIVERY_WINDOWS) {
        rows.push({
          date: dateKey,
          start_time: start,
          end_time: end,
          fulfilment_type: "delivery",
          zone_id: zone.id,
          capacity: DELIVERY_CAPACITY,
        });
      }
    }
  }

  // Re-inserting a date that already has rows is harmless (ignoreDuplicates
  // skips them) — this only ever needs to fill the gap at the far end of
  // the window, but re-covering the whole range is what makes it safe to
  // call unconditionally without first working out exactly which dates
  // are missing.
  const { error: insertError } = await supabase
    .from("delivery_slots")
    .upsert(rows, { onConflict: "date,start_time,fulfilment_type,zone_id", ignoreDuplicates: true });
  if (insertError) throw insertError;
}
