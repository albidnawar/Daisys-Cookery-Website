import { createServiceRoleClient } from "@/lib/supabase/server";
import type { CustomQuoteStatus } from "@/lib/types/domain";

export type PublicQuote = {
  id: string;
  cakeTitle: string;
  themeNotes: string | null;
  icingColors: string | null;
  referenceImageUrls: string[];
  quotedPrice: number | null;
  quotedSizeNote: string | null;
  status: CustomQuoteStatus;
  draftOrderId: string | null;
};

/** Customer-facing read of a quote link — deliberately excludes
 * contact_name/contact_phone/created_by_admin_id, none of which the
 * customer needs to see reflected back at them. */
export async function getPublicQuote(id: string): Promise<PublicQuote | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("custom_quotes")
    .select(
      "id, cake_title, theme_notes, icing_colors, reference_image_urls, quoted_price, quoted_size_note, status, draft_order_id",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    cakeTitle: data.cake_title,
    themeNotes: data.theme_notes,
    icingColors: data.icing_colors,
    referenceImageUrls: data.reference_image_urls ?? [],
    quotedPrice: data.quoted_price === null ? null : Number(data.quoted_price),
    quotedSizeNote: data.quoted_size_note,
    status: data.status,
    draftOrderId: data.draft_order_id,
  };
}
