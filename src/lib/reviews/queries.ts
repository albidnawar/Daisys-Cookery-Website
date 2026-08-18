import type { SupabaseClient } from "@supabase/supabase-js";
import type { Review } from "@/lib/types/domain";

// Untyped for the same reason as catalog/queries.ts's Client — see that
// file's comment.
type Client = SupabaseClient;

export async function listReviews(supabase: Client): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, customer_name, review_text, cake_image_url, rating, review_date")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    reviewText: row.review_text,
    cakeImageUrl: row.cake_image_url,
    rating: row.rating,
    reviewDate: row.review_date,
  }));
}
