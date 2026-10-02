import { createServiceRoleClient } from "@/lib/supabase/server";
import { DEFAULT_FOCAL, type FocalPoint } from "@/lib/image/focal";

export type AdminReview = {
  id: string;
  customerName: string;
  reviewText: string;
  cakeImageUrl: string | null;
  cakeImageFocal: FocalPoint;
  rating: number;
  reviewDate: string;
  cakeId: string | null;
  cakeName: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type ReviewInput = {
  customerName: string;
  reviewText: string;
  cakeImageUrl: string | null;
  cakeImageFocal: FocalPoint;
  rating: number;
  reviewDate: string;
  cakeId: string | null;
  isActive: boolean;
  sortOrder: number;
};

export async function listAllReviewsAdmin(): Promise<AdminReview[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, customer_name, review_text, cake_image_url, cake_image_focal_x, cake_image_focal_y, rating, review_date, cake_id, is_active, sort_order, cakes ( name )",
    )
    .order("sort_order");
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    reviewText: row.review_text,
    cakeImageUrl: row.cake_image_url,
    cakeImageFocal: { x: Number(row.cake_image_focal_x), y: Number(row.cake_image_focal_y) },
    rating: row.rating,
    reviewDate: row.review_date,
    cakeId: row.cake_id,
    cakeName: row.cakes?.name ?? null,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }));
}

export async function getReviewForEdit(id: string): Promise<ReviewInput & { id: string } | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, customer_name, review_text, cake_image_url, cake_image_focal_x, cake_image_focal_y, rating, review_date, cake_id, is_active, sort_order",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    customerName: data.customer_name,
    reviewText: data.review_text,
    cakeImageUrl: data.cake_image_url,
    cakeImageFocal: { x: Number(data.cake_image_focal_x), y: Number(data.cake_image_focal_y) },
    rating: data.rating,
    reviewDate: data.review_date,
    cakeId: data.cake_id,
    isActive: data.is_active,
    sortOrder: data.sort_order,
  };
}

function toRow(input: ReviewInput) {
  return {
    customer_name: input.customerName,
    review_text: input.reviewText,
    cake_image_url: input.cakeImageUrl,
    cake_image_focal_x: input.cakeImageFocal?.x ?? DEFAULT_FOCAL.x,
    cake_image_focal_y: input.cakeImageFocal?.y ?? DEFAULT_FOCAL.y,
    rating: input.rating,
    review_date: input.reviewDate,
    cake_id: input.cakeId,
    is_active: input.isActive,
    sort_order: input.sortOrder,
  };
}

export async function createReview(input: ReviewInput): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("reviews")
    .insert(toRow(input))
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateReview(id: string, input: ReviewInput): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("reviews").update(toRow(input)).eq("id", id);
  if (error) throw error;
}

export async function deleteReview(id: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}
