import Image from "next/image";
import type { Review } from "@/lib/types/domain";

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2.5l2.9 6.5 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.6l7.1-.6z" />
    </svg>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="flex w-80 flex-none flex-col gap-3 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-4 shadow-sm">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border-2 border-brand-chocolate/10 bg-cream">
        {review.cakeImageUrl && (
          <Image
            src={review.cakeImageUrl}
            alt={`Cake ordered by ${review.customerName}`}
            fill
            className="object-cover"
          />
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <p className="font-display text-lg font-semibold text-brand-chocolate">
          {review.customerName}
        </p>
        <div className="flex gap-0.5 text-brand-orange">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} filled={i < review.rating} />
          ))}
        </div>
      </div>
      <p className="font-body text-sm leading-relaxed text-brand-chocolate/75">
        &ldquo;{review.reviewText}&rdquo;
      </p>
      <p className="font-body text-xs text-brand-chocolate/45">
        {new Date(`${review.reviewDate}T00:00:00`).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
