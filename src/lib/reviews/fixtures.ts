import type { Review } from "@/lib/types/domain";

// Dev-only stand-in for the Supabase `reviews` table — see
// lib/catalog/fixtures.ts for why this pattern exists.
export const FIXTURE_REVIEWS: Review[] = [
  {
    id: "review-1",
    customerName: "Nabila Rahman",
    reviewText:
      "Ordered the Black Forest for my daughter's birthday and it was gone in minutes. Every layer was fresh and the message piping was so neat.",
    cakeImageUrl: null,
    rating: 5,
    reviewDate: "2026-08-15",
  },
  {
    id: "review-2",
    customerName: "Tanvir Ahmed",
    reviewText:
      "Best red velvet in Chattogram, hands down. I have tried a lot of bakeries around College Road and Daisy's is the only one I keep going back to.",
    cakeImageUrl: null,
    rating: 5,
    reviewDate: "2026-08-09",
  },
  {
    id: "review-3",
    customerName: "Farzana Islam",
    reviewText:
      "We customised a two-tier cake for our Gaye Holud and they nailed the floral design from just one reference photo. Guests kept asking where we got it.",
    cakeImageUrl: null,
    rating: 5,
    reviewDate: "2026-08-02",
  },
  {
    id: "review-4",
    customerName: "Shakib Hasan",
    reviewText:
      "Delivery was right on time and the box was still cold when it arrived. The pistachio cake tastes like it is worth every taka.",
    cakeImageUrl: null,
    rating: 5,
    reviewDate: "2026-07-25",
  },
  {
    id: "review-5",
    customerName: "Ayesha Siddika",
    reviewText:
      "Ordered a last-minute eggless cake for a baby shower and they sorted it out over WhatsApp within the hour. Incredibly kind and responsive.",
    cakeImageUrl: null,
    rating: 5,
    reviewDate: "2026-07-17",
  },
  {
    id: "review-6",
    customerName: "Rafiul Karim",
    reviewText:
      "The mango cream cake was the highlight of our office anniversary party. Clean design, not too sweet, and beautifully boxed.",
    cakeImageUrl: null,
    rating: 4,
    reviewDate: "2026-07-04",
  },
];
