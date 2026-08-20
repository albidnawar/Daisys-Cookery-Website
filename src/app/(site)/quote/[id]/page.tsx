import { notFound } from "next/navigation";
import { Gallery } from "@/components/cake-detail/Gallery";
import { LinkButton } from "@/components/ui/Button";
import { getPublicQuote } from "@/lib/quotes/publicQuote";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getPublicQuote(id);
  if (!quote) notFound();

  const depositAmount = quote.quotedPrice ? Math.round(quote.quotedPrice * 0.3) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
        Your custom quote
      </span>
      <h1 className="mb-8 mt-2 font-display text-4xl font-semibold text-brand-chocolate sm:text-5xl">
        {quote.cakeTitle}
      </h1>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {quote.referenceImageUrls.length > 0 ? (
          <Gallery images={quote.referenceImageUrls} />
        ) : (
          <div className="aspect-4/3 w-full rounded-3xl border-2 border-brand-chocolate/10 bg-white" />
        )}

        <div className="flex flex-col gap-4">
          {quote.themeNotes && (
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                Design notes
              </p>
              <p className="font-body text-sm leading-relaxed text-brand-chocolate/80">{quote.themeNotes}</p>
            </div>
          )}
          {quote.icingColors && (
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                Icing colours
              </p>
              <p className="font-body text-sm text-brand-chocolate/80">{quote.icingColors}</p>
            </div>
          )}
          {quote.quotedSizeNote && (
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                Size
              </p>
              <p className="font-body text-sm text-brand-chocolate/80">{quote.quotedSizeNote}</p>
            </div>
          )}

          <hr className="border-brand-chocolate/10" />

          {quote.status === "declined" ? (
            <p className="font-body text-sm text-brand-chocolate/70">
              This quote is no longer available — message us on WhatsApp if you&apos;d like a new one.
            </p>
          ) : quote.status === "quoted" && quote.quotedPrice != null && quote.draftOrderId ? (
            <>
              <div>
                <p className="font-display text-3xl font-semibold text-brand-chocolate">
                  ৳{quote.quotedPrice.toLocaleString("en-BD")}
                </p>
                <p className="font-body text-sm text-brand-chocolate/60">
                  ৳{depositAmount!.toLocaleString("en-BD")} deposit to book, balance due at pickup/delivery.
                </p>
              </div>
              <LinkButton href={`/buying-options?draft=${quote.draftOrderId}`} className="w-fit">
                Book this cake
              </LinkButton>
            </>
          ) : (
            <p className="font-body text-sm text-brand-chocolate/70">
              We&apos;re still working out a price for this one — we&apos;ll send you a message
              as soon as it&apos;s ready.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
