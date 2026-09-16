import { createServiceRoleClient } from "@/lib/supabase/server";
import { createCustomQuoteDraft } from "@/lib/draftOrders/store";
import { fixedPrice } from "@/lib/pricing/calculatePrice";
import { getStoreSettings } from "@/lib/settings/store";
import { normalizePhone } from "@/lib/phone";
import type { CustomQuoteDetail, CustomQuoteInput, CustomQuoteSummary } from "@/lib/types/domain";

export async function listCustomQuotes(): Promise<CustomQuoteSummary[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("custom_quotes")
    .select("id, contact_name, contact_phone, cake_title, status, quoted_price, reference_image_urls, created_at")
    .order("created_at", { ascending: false });
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
    const { depositRate } = await getStoreSettings();
    const price = fixedPrice(input.quotedPrice, depositRate);
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
