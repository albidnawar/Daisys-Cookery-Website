import { randomUUID } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { calculatePrice } from "@/lib/pricing/calculatePrice";
import { toDepositConfig } from "@/lib/pricing/deposit";
import { getStoreSettings } from "@/lib/settings/store";
import { getCakeBySlug } from "@/lib/catalog/queries";
import { getFixtureCakeDetail } from "@/lib/catalog/fixtures";
import { readJson, withFileLock, writeJson } from "@/lib/devStore/fileStore";
import type { DraftOrder, DraftOrderSpec, PriceBreakdown } from "@/lib/types/domain";

// Dev fallback so the Customiser works before a Supabase project exists —
// see src/lib/devStore/fileStore.ts for why this is file-backed rather
// than a module-level Map.
const STORE_NAME = "draft-orders";

async function readAll(): Promise<Record<string, DraftOrder>> {
  return readJson<Record<string, DraftOrder>>(STORE_NAME, {});
}

async function writeOne(draft: DraftOrder): Promise<void> {
  await withFileLock(STORE_NAME, async () => {
    const all = await readAll();
    all[draft.id] = draft;
    await writeJson(STORE_NAME, all);
  });
}

export async function resolveCake(cakeSlug: string) {
  if (isSupabaseConfigured()) {
    return getCakeBySlug(await createServiceRoleClient(), cakeSlug);
  }
  return getFixtureCakeDetail(cakeSlug);
}

export async function createDraftOrder(cakeSlug: string): Promise<DraftOrder> {
  const cake = await resolveCake(cakeSlug);
  if (!cake) throw new Error(`Unknown cake: ${cakeSlug}`);

  const now = new Date().toISOString();
  const draft: DraftOrder = {
    id: randomUUID(),
    cakeSlug,
    customCakeName: null,
    spec: {},
    computedPrice: null,
    fulfilmentType: null,
    zoneId: null,
    deliveryAddress: null,
    slotId: null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .from("draft_orders")
      .insert({ id: draft.id, cake_id: cake.id, spec: draft.spec })
      .select()
      .single();
    if (error) throw error;
    return rowToDraft(data, cakeSlug);
  }

  await writeOne(draft);
  return draft;
}

/** A minimal draft_orders row that exists purely so a manually-entered
 * admin order (Module 1) has something real for slot_holds.draft_order_id
 * to reference — that FK is what makes the M4 capacity-locking machinery
 * work, and manual orders draw from the exact same slot capacity as web
 * ones. cakeId is null for a fully custom design with no catalog match. */
export async function createAdminHoldDraft(cakeId: string | null): Promise<string> {
  const id = randomUUID();
  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { error } = await supabase.from("draft_orders").insert({ id, cake_id: cakeId });
    if (error) throw error;
    return id;
  }

  const now = new Date().toISOString();
  await writeOne({
    id,
    cakeSlug: null,
    customCakeName: null,
    spec: {},
    computedPrice: null,
    fulfilmentType: null,
    zoneId: null,
    deliveryAddress: null,
    slotId: null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

/** The draft a customer lands on when they open their quote link (Module
 * 5): no catalog cake, a fixed admin-set price standing in for
 * calculatePrice()'s output, and the reference photo/notes carried into
 * spec so they still show up on the kitchen slip like any other order.
 * price is also created null — see createPendingCustomDraft() below, which
 * is the same shape before an admin has set a price yet. */
export async function createCustomQuoteDraft(
  customCakeName: string,
  spec: DraftOrderSpec,
  price: PriceBreakdown | null,
): Promise<string> {
  const id = randomUUID();
  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { error } = await supabase.from("draft_orders").insert({
      id,
      cake_id: null,
      custom_cake_name: customCakeName,
      spec,
      computed_price: price,
    });
    if (error) throw error;
    return id;
  }

  const now = new Date().toISOString();
  await writeOne({
    id,
    cakeSlug: null,
    customCakeName,
    spec,
    computedPrice: price,
    fulfilmentType: null,
    zoneId: null,
    deliveryAddress: null,
    slotId: null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

/** The draft the public order-form's "Custom design" path creates: no
 * catalog cake and no price yet — the admin fills in a price from the
 * order detail page once it's placed (see setOrderPrice() in
 * lib/admin/orderDetail.ts), unlike createCustomQuoteDraft()'s own callers
 * which always already know the price by the time they create one. */
export async function createPendingCustomDraft(customCakeName: string): Promise<string> {
  return createCustomQuoteDraft(customCakeName, {}, null);
}

export async function getDraftOrder(id: string): Promise<DraftOrder | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .from("draft_orders")
      .select("*, cakes(slug)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToDraft(data, data.cakes?.slug ?? null);
  }
  const all = await readAll();
  return all[id] ?? null;
}

export async function updateDraftOrderSpec(
  id: string,
  specPatch: Partial<DraftOrderSpec>,
  fulfilmentType?: DraftOrder["fulfilmentType"],
): Promise<DraftOrder> {
  const existing = await getDraftOrder(id);
  if (!existing) throw new Error(`Draft order not found: ${id}`);

  const spec = { ...existing.spec, ...specPatch };
  const cake = existing.cakeSlug ? await resolveCake(existing.cakeSlug) : null;
  const computedPrice = cake
    ? calculatePrice(cake, spec, toDepositConfig(await getStoreSettings()))
    : null;

  const updated: DraftOrder = {
    ...existing,
    spec,
    computedPrice,
    fulfilmentType: fulfilmentType ?? existing.fulfilmentType,
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { error } = await supabase
      .from("draft_orders")
      .update({
        spec,
        computed_price: computedPrice,
        fulfilment_type: updated.fulfilmentType,
        updated_at: updated.updatedAt,
      })
      .eq("id", id);
    if (error) throw error;
    return updated;
  }

  await writeOne(updated);
  return updated;
}

export async function updateDraftOrderFulfilment(
  id: string,
  patch: {
    fulfilmentType?: DraftOrder["fulfilmentType"];
    zoneId?: string | null;
    deliveryAddress?: Record<string, unknown> | null;
    slotId?: string | null;
  },
): Promise<DraftOrder> {
  const existing = await getDraftOrder(id);
  if (!existing) throw new Error(`Draft order not found: ${id}`);

  const updated: DraftOrder = {
    ...existing,
    fulfilmentType: patch.fulfilmentType ?? existing.fulfilmentType,
    zoneId: patch.zoneId !== undefined ? patch.zoneId : existing.zoneId,
    deliveryAddress:
      patch.deliveryAddress !== undefined
        ? patch.deliveryAddress
        : existing.deliveryAddress,
    slotId: patch.slotId !== undefined ? patch.slotId : existing.slotId,
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { error } = await supabase
      .from("draft_orders")
      .update({
        fulfilment_type: updated.fulfilmentType,
        zone_id: updated.zoneId,
        delivery_address: updated.deliveryAddress,
        slot_id: updated.slotId,
        updated_at: updated.updatedAt,
      })
      .eq("id", id);
    if (error) throw error;
    return updated;
  }

  await writeOne(updated);
  return updated;
}

/** Marks a draft as converted once its order has been created — the draft
 * itself is never deleted (it's the order's audit trail back to how the
 * cake was configured), just flagged so it's no longer "in progress". */
export async function markDraftOrderConverted(id: string): Promise<void> {
  const existing = await getDraftOrder(id);
  if (!existing) throw new Error(`Draft order not found: ${id}`);

  const updated: DraftOrder = {
    ...existing,
    status: "converted",
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { error } = await supabase
      .from("draft_orders")
      .update({ status: "converted", updated_at: updated.updatedAt })
      .eq("id", id);
    if (error) throw error;
    return;
  }

  await writeOne(updated);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDraft(row: any, cakeSlug: string | null): DraftOrder {
  return {
    id: row.id,
    cakeSlug,
    customCakeName: row.custom_cake_name ?? null,
    spec: row.spec ?? {},
    computedPrice: row.computed_price ?? null,
    fulfilmentType: row.fulfilment_type ?? null,
    zoneId: row.zone_id ?? null,
    deliveryAddress: row.delivery_address ?? null,
    slotId: row.slot_id ?? null,
    status: row.status ?? "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
