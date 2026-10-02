import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/types/domain";

// Untyped for the same reason as catalog/queries.ts's Client — see that
// file's comment.
type Client = SupabaseClient;

export async function listReviews(supabase: Client): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, customer_name, review_text, cake_image_url, cake_image_focal_x, cake_image_focal_y, rating, review_date",
    )
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    reviewText: row.review_text,
    cakeImageUrl: row.cake_image_url,
    cakeImageFocal: { x: Number(row.cake_image_focal_x), y: Number(row.cake_image_focal_y) },
    rating: row.rating,
    reviewDate: row.review_date,
  }));
}

// Cached for the homepage's hot path — public-read RLS table (0007_reviews.sql),
// same reasoning as catalog/queries.ts's cached variants. Admin review writes
// must call revalidateTag("reviews").
export const getCachedReviews = unstable_cache(
  () => listReviews(createServiceRoleClient()),
  ["reviews"],
  { revalidate: 300, tags: ["reviews"] },
);
