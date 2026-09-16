import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/admin/ReviewForm";
import { getReviewForEdit } from "@/lib/admin/reviewsAdmin";
import { listAllCakesAdmin } from "@/lib/admin/catalogAdmin";
import { requireModulePage } from "@/lib/admin/auth";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModulePage("content_media");
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
