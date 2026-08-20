import Link from "next/link";
import { listCustomQuotes } from "@/lib/admin/customQuotes";
import { LinkButton } from "@/components/ui/Button";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-mint text-brand-chocolate",
  quoted: "bg-brand-orange/15 text-brand-orange",
  declined: "bg-brand-chocolate/10 text-brand-chocolate/60",
};

export default async function AdminCustomRequestsPage() {
  const quotes = await listCustomQuotes();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-brand-chocolate">
          Custom quote requests
        </h1>
        <LinkButton href="/admin/custom-requests/new" variant="primary">
          + Log a request
        </LinkButton>
      </div>

      <div className="flex flex-col gap-3">
        {quotes.map((quote) => (
          <Link
            key={quote.id}
            href={`/admin/custom-requests/${quote.id}`}
            className="flex items-center gap-4 rounded-2xl border-2 border-brand-chocolate/10 bg-white p-4 hover:border-brand-orange/30"
          >
            <div className="h-16 w-16 flex-none overflow-hidden rounded-xl bg-cream">
              {quote.referenceImageUrls[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={quote.referenceImageUrls[0]} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-display text-lg font-semibold text-brand-chocolate">
                  {quote.cakeTitle}
                </p>
                <span className={`rounded-full px-2 py-0.5 font-body text-xs font-bold ${STATUS_STYLES[quote.status]}`}>
                  {quote.status}
                </span>
              </div>
              <p className="font-body text-sm text-brand-chocolate/60">
                {quote.contactName} &middot; {quote.contactPhone}
              </p>
            </div>
            {quote.quotedPrice != null && (
              <p className="font-body text-sm font-bold text-brand-chocolate">
                ৳{quote.quotedPrice.toLocaleString("en-BD")}
              </p>
            )}
          </Link>
        ))}
        {quotes.length === 0 && (
          <p className="font-body text-sm text-brand-chocolate/60">
            No custom requests logged yet — add your first one above.
          </p>
        )}
      </div>
    </div>
  );
}
