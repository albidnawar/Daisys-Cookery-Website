import Link from "next/link";
import { listAllReviewsAdmin } from "@/lib/admin/reviewsAdmin";
import { requireModulePage } from "@/lib/admin/auth";
import { LinkButton } from "@/components/ui/Button";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function AdminReviewsPage() {
  await requireModulePage("content_media");
  const reviews = await listAllReviewsAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-brand-chocolate">Reviews</h1>
        <LinkButton href="/admin/reviews/new" variant="primary">
          + Add review
        </LinkButton>
      </div>

      <div className="flex flex-col gap-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex items-start gap-4 rounded-2xl border-2 border-brand-chocolate/10 bg-white p-4"
          >
            <div className="h-16 w-16 flex-none overflow-hidden rounded-xl bg-cream">
              {review.cakeImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={review.cakeImageUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-display text-lg font-semibold text-brand-chocolate">
                  {review.customerName}
                </p>
                <span className="font-body text-xs text-brand-orange">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
                <span className="font-body text-xs text-brand-chocolate/50">
                  {new Date(`${review.reviewDate}T00:00:00`).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {!review.isActive && (
                  <span className="rounded-full bg-brand-chocolate/10 px-2 py-0.5 font-body text-xs text-brand-chocolate/60">
                    Hidden
                  </span>
                )}
                {review.cakeName && (
                  <span className="rounded-full bg-mint px-2 py-0.5 font-body text-xs text-brand-chocolate">
                    {review.cakeName}
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 font-body text-sm text-brand-chocolate/70">
                {review.reviewText}
              </p>
            </div>
            <div className="flex flex-none flex-col items-end gap-2">
              <Link
                href={`/admin/reviews/${review.id}`}
                className="font-body text-sm font-bold text-brand-orange hover:text-brand-chocolate"
              >
                Edit
              </Link>
              <DeleteButton
                url={`/api/admin/reviews/${review.id}`}
                confirmText={`Delete the review from ${review.customerName}?`}
              />
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="font-body text-sm text-brand-chocolate/60">
            No reviews yet — add your first one above.
          </p>
        )}
      </div>
    </div>
  );
}
