import { randomUUID } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { readJson, writeJson } from "@/lib/devStore/fileStore";
import type { DeliveryZone } from "@/lib/types/domain";

const HOLD_MINUTES = 10;

// Dev fallback mirroring supabase/seed.sql, so Buying Options works before
// a Supabase project exists — file-backed (see src/lib/devStore/fileStore)
// so a hold made in one request is still there on the next.
type MemSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  fulfilmentType: "pickup" | "delivery";
  zoneId: string;
};
type MemHold = { id: string; slotId: string; draftId: string; expiresAt: number };
type MemDateSetting = { isBlocked: boolean; maxOrders: number | null };

export const MEMORY_ZONES: DeliveryZone[] = [
  { id: "zone-pickup", name: "Shop pickup", distanceBand: "pickup", deliveryFee: 0 },
  { id: "zone-local", name: "Local Delivery", distanceBand: "local", deliveryFee: 0 },
];

async function loadMemSlots(): Promise<MemSlot[]> {
  return readJson<MemSlot[]>("slots", []);
}

async function saveMemSlots(slots: MemSlot[]): Promise<void> {
  await writeJson("slots", slots);
}

async function loadHolds(): Promise<MemHold[]> {
  return readJson<MemHold[]>("slot-holds", []);
}

async function saveHolds(holds: MemHold[]): Promise<void> {
  await writeJson("slot-holds", holds);
}

async function loadMemDateSettings(): Promise<Record<string, MemDateSetting>> {
  return readJson<Record<string, MemDateSetting>>("date-capacity-settings", {});
}

export async function listZones(): Promise<DeliveryZone[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("id, name, distance_band, delivery_fee")
      .eq("is_active", true);
    if (error) throw error;
    return data.map((z) => ({
      id: z.id,
      name: z.name,
      distanceBand: z.distance_band,
      deliveryFee: Number(z.delivery_fee),
    }));
  }
  return MEMORY_ZONES;
}

/** Books the customer's exact chosen date+time: creates a fresh,
 * single-use delivery_slots row (no shared capacity to check) and a
 * short-lived hold on it, after the same date-blocked / day-level
 * max_orders checks hold_slot() used to do — see book_exact_time() in
 * 0032_local_delivery_and_exact_time_booking.sql. */
export async function holdSlot(input: {
  date: string;
  startTime: string;
  fulfilmentType: "pickup" | "delivery";
  zoneId: string;
  draftId: string;
}): Promise<{ holdId: string; slotId: string; expiresAt: string }> {
  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .rpc("book_exact_time", {
        p_date: input.date,
        p_start_time: input.startTime,
        p_fulfilment_type: input.fulfilmentType,
        p_zone_id: input.zoneId,
        p_draft_id: input.draftId,
        p_hold_minutes: HOLD_MINUTES,
      })
      .single();
    if (error) {
      if (error.message?.includes("date_blocked")) throw new DateBlockedError();
      if (error.message?.includes("daily_cap_reached")) throw new DailyCapReachedError();
      throw error;
    }
    const row = data as { hold_id: string; slot_id: string; expires_at: string };
    return { holdId: row.hold_id, slotId: row.slot_id, expiresAt: row.expires_at };
  }

  return withHoldLock(async () => {
    const dateSettings = await loadMemDateSettings();
    const setting = dateSettings[input.date];
    if (setting?.isBlocked) throw new DateBlockedError();
    if (setting?.maxOrders != null) {
      const slots = await loadMemSlots();
      const dayTotal = slots.filter((s) => s.date === input.date).length;
      if (dayTotal >= setting.maxOrders) throw new DailyCapReachedError();
    }

    const slot: MemSlot = {
      id: randomUUID(),
      date: input.date,
      startTime: input.startTime,
      endTime: input.startTime,
      fulfilmentType: input.fulfilmentType,
      zoneId: input.zoneId,
    };
    const slots = await loadMemSlots();
    slots.push(slot);
    await saveMemSlots(slots);

    const expiresAt = Date.now() + HOLD_MINUTES * 60_000;
    const hold: MemHold = { id: randomUUID(), slotId: slot.id, draftId: input.draftId, expiresAt };
    const holds = await loadHolds();
    holds.push(hold);
    await saveHolds(holds);

    return { holdId: hold.id, slotId: slot.id, expiresAt: new Date(expiresAt).toISOString() };
  });
}

/** Converts a hold into a permanent booking at order finalization: just
 * deletes the slot_holds row. booked_count is already counted from when
 * the hold was created (see hold_slot() in the M4 migration) and stays
 * exactly as-is — this is what distinguishes a conversion from a release
 * (which decrements, see releaseExpiredMemHolds). */
export async function convertHold(slotId: string, draftId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { error } = await supabase
      .from("slot_holds")
      .delete()
      .eq("slot_id", slotId)
      .eq("draft_order_id", draftId);
    if (error) throw error;
    return;
  }

  await withHoldLock(async () => {
    const holds = await loadHolds();
    await saveHolds(holds.filter((h) => !(h.slotId === slotId && h.draftId === draftId)));
  });
}

// Postgres `time` columns come back as "HH:MM:SS" — normalize to "HH:MM" so
// this always matches the dev fallback's format, since downstream
// consumers (OrderSummaryCard, AddToCalendarButton) parse it with a strict
// HH:MM regex.
export function formatSlotLabel(date: string, startTime: string, endTime: string): string {
  return `${date} ${startTime.slice(0, 5)}-${endTime.slice(0, 5)}`;
}

export async function getSlotLabel(slotId: string): Promise<string | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase
      .from("delivery_slots")
      .select("date, start_time, end_time")
      .eq("id", slotId)
      .maybeSingle();
    if (!data) return null;
    return formatSlotLabel(data.date, data.start_time, data.end_time);
  }
  const slots = await loadMemSlots();
  const slot = slots.find((s) => s.id === slotId);
  return slot ? `${slot.date} ${slot.startTime}-${slot.endTime}` : null;
}

export class SlotFullError extends Error {
  constructor() {
    super("slot_full");
  }
}

export class DateBlockedError extends Error {
  constructor() {
    super("date_blocked");
  }
}

export class DailyCapReachedError extends Error {
  constructor() {
    super("daily_cap_reached");
  }
}

// The dev fallback's read-modify-write against the JSON file isn't
// atomic the way Postgres's SELECT ... FOR UPDATE is — two concurrent
// holdSlot() calls could both read the same booked_count before either
// writes back, defeating the whole point of capacity locking. This mutex
// serializes them within this process (real concurrency safety still
// comes from Postgres once a project is connected; this only matters for
// exercising the race in local dev).
let holdMutex: Promise<unknown> = Promise.resolve();

export function withHoldLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = holdMutex.then(fn, fn);
  holdMutex = result.catch(() => {});
  return result;
}
