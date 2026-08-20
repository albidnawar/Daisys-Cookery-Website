import { notFound } from "next/navigation";
import { CustomQuoteForm } from "@/components/admin/CustomQuoteForm";
import { getCustomQuoteForEdit } from "@/lib/admin/customQuotes";
import { getStoreSettings } from "@/lib/settings/store";

export default async function EditCustomQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quote, settings] = await Promise.all([getCustomQuoteForEdit(id), getStoreSettings()]);
  if (!quote) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">
        {quote.cakeTitle}
      </h1>
      <CustomQuoteForm
        initial={quote}
        quoteId={id}
        contactPhone={quote.contactPhone}
        depositRate={settings.depositRate}
      />
    </div>
  );
}
