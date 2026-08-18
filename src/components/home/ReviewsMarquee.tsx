import { ReviewCard } from "@/components/home/ReviewCard";
import type { Review } from "@/lib/types/domain";

export function ReviewsMarquee({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="overflow-hidden py-4">
      <div className="mx-auto mb-8 max-w-6xl px-4 sm:px-8">
        <p className="mb-2 font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
          From our customers
        </p>
        <h2 className="font-display text-3xl font-semibold text-brand-chocolate">
          What Chattogram is saying
        </h2>
      </div>

      <div
        className="group relative"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div className="animate-marquee-rtl flex w-max gap-6 group-hover:[animation-play-state:paused]">
          {[...reviews, ...reviews].map((review, i) => (
            <ReviewCard key={`${review.id}-${i}`} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
