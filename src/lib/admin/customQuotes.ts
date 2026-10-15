import { createServiceRoleClient } from "@/lib/supabase/server";
import { createCustomQuoteDraft } from "@/lib/draftOrders/store";
import { fixedPrice } from "@/lib/pricing/calculatePrice";
import { toDepositConfig } from "@/lib/pricing/deposit";
import { getStoreSettings } from "@/lib/settings/store";
import { normalizePhone } from "@/lib/phone";
import type { CustomQuoteDetail, CustomQuoteInput, CustomQuoteStatus, CustomQuoteSummary } from "@/lib/types/domain";

export type CustomQuoteFilters = {
  status?: CustomQuoteStatus;
  search?: string;
};

export async function listCustomQuotes(filters: CustomQuoteFilters = {}): Promise<CustomQuoteSummary[]> {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("custom_quotes")
    .select("id, contact_name, contact_phone, cake_title, status, quoted_price, reference_image_urls, created_at")
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    query = query.or(
      `id.ilike.%${term}%,contact_name.ilike.%${term}%,contact_phone.ilike.%${term}%,cake_title.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    cakeTitle: row.cake_title,
    status: row.status,
    quotedPrice: row.quoted_price === null ? null : Number(row.quoted_price),
    referenceImageUrls: row.reference_image_urls ?? [],
    createdAt: row.created_at,
  }));
}

export async function getCustomQuoteForEdit(id: string): Promise<CustomQuoteDetail | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("custom_quotes")
    .select(
      "id, contact_name, contact_phone, cake_title, theme_notes, icing_colors, reference_image_urls, quoted_price, quoted_size_note, status, draft_order_id, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    contactName: data.contact_name,
    contactPhone: data.contact_phone,
    cakeTitle: data.cake_title,
    themeNotes: data.theme_notes,
    icingColors: data.icing_colors,
    referenceImageUrls: data.reference_image_urls ?? [],
    quotedPrice: data.quoted_price === null ? null : Number(data.quoted_price),
    quotedSizeNote: data.quoted_size_note,
    status: data.status,
    draftOrderId: data.draft_order_id,
    createdAt: data.created_at,
  };
}

export async function createCustomQuote(input: CustomQuoteInput, createdByAdminId: string): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("custom_quotes")
    .insert({
      contact_name: input.contactName,
      contact_phone: normalizePhone(input.contactPhone),
      cake_title: input.cakeTitle,
      theme_notes: input.themeNotes,
      icing_colors: input.icingColors,
      reference_image_urls: input.referenceImageUrls,
      quoted_price: input.quotedPrice,
      quoted_size_note: input.quotedSizeNote,
      status: input.status,
      created_by_admin_id: createdByAdminId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export type CustomQuoteRequestInput = {
  contactName: string;
  contactPhone: string;
  cakeTitle: string;
  themeNotes: string | null;
  quotedSizeNote: string | null;
  referenceImageUrls: string[];
};

/** Customer self-serve counterpart to createCustomQuote() — same insert,
 * but with no admin staff involved yet: status is always "new", no price,
 * created_by_admin_id left null (the column is nullable for exactly this
 * case, see 0013_custom_quotes.sql). Used by the "picture-based design"
 * path on the from-scratch customiser (WizardShell's isFromScratch mode). */
export async function createCustomQuoteFromCustomer(
  input: CustomQuoteRequestInput,
): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("custom_quotes")
    .insert({
      contact_name: input.contactName,
      contact_phone: normalizePhone(input.contactPhone),
      cake_title: input.cakeTitle,
      theme_notes: input.themeNotes,
      icing_colors: null,
      reference_image_urls: input.referenceImageUrls,
      quoted_price: null,
      quoted_size_note: input.quotedSizeNote,
      status: "new",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

/** Updates the quote's own fields, and keeps its linked draft_order in
 * sync: creates one the first time a price is set (this is what turns a
 * quote into an actual clickable checkout link), or just refreshes the
 * fixed price on the existing draft if it's edited later. */
export async function updateCustomQuote(id: string, input: CustomQuoteInput): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: existing, error: fetchError } = await supabase
    .from("custom_quotes")
    .select("draft_order_id")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  let draftOrderId = existing.draft_order_id as string | null;
  if (input.quotedPrice != null) {
    const deposit = toDepositConfig(await getStoreSettings());
    const price = fixedPrice(input.quotedPrice, deposit);
    const spec = {
      instructions: input.themeNotes ?? undefined,
      referenceImageUrl: input.referenceImageUrls[0] ?? undefined,
    };
    if (draftOrderId) {
      await supabase
        .from("draft_orders")
        .update({ computed_price: price, custom_cake_name: input.cakeTitle })
        .eq("id", draftOrderId);
    } else {
      draftOrderId = await createCustomQuoteDraft(input.cakeTitle, spec, price);
    }
  }

  const { error } = await supabase
    .from("custom_quotes")
    .update({
      contact_name: input.contactName,
      contact_phone: normalizePhone(input.contactPhone),
      cake_title: input.cakeTitle,
      theme_notes: input.themeNotes,
      icing_colors: input.icingColors,
      reference_image_urls: input.referenceImageUrls,
      quoted_price: input.quotedPrice,
      quoted_size_note: input.quotedSizeNote,
      status: input.status,
      draft_order_id: draftOrderId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

/** Permanently removes a custom quote request. Also cleans up its linked
 * draft_orders row (if a price was ever set, see updateCustomQuote()) —
 * best-effort, since custom_quotes has no FK pointing at it, so nothing
 * actually blocks the delete either way. */
export async function deleteCustomQuote(id: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: existing } = await supabase
    .from("custom_quotes")
    .select("draft_order_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("custom_quotes").delete().eq("id", id);
  if (error) throw error;

  if (existing?.draft_order_id) {
    await supabase.from("draft_orders").delete().eq("id", existing.draft_order_id);
  }
}
