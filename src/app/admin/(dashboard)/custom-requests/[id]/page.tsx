import { notFound } from "next/navigation";
import { CustomQuoteForm } from "@/components/admin/CustomQuoteForm";
import { getCustomQuoteForEdit } from "@/lib/admin/customQuotes";

export default async function EditCustomQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getCustomQuoteForEdit(id);
  if (!quote) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">
        {quote.cakeTitle}
      </h1>
      <CustomQuoteForm initial={quote} quoteId={id} contactPhone={quote.contactPhone} />
    </div>
  );
}
