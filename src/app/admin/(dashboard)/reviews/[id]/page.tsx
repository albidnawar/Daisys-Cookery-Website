import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/admin/ReviewForm";
import { getReviewForEdit } from "@/lib/admin/reviewsAdmin";
import { listAllCakesAdmin } from "@/lib/admin/catalogAdmin";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [review, cakes] = await Promise.all([getReviewForEdit(id), listAllCakesAdmin()]);
  if (!review) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">
        Edit review
      </h1>
      <ReviewForm cakes={cakes} initial={review} reviewId={id} />
    </div>
  );
}
