import { ReviewForm } from "@/components/admin/ReviewForm";
import { listAllCakesAdmin } from "@/lib/admin/catalogAdmin";
import { requireModulePage } from "@/lib/admin/auth";

export default async function NewReviewPage() {
  await requireModulePage("content_media");
  const cakes = await listAllCakesAdmin();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">
        Add a review
      </h1>
      <ReviewForm cakes={cakes} initial={null} reviewId={null} />
    </div>
  );
}
