import { notFound } from "next/navigation";
import { CustomQuoteForm } from "@/components/admin/CustomQuoteForm";
import { getCustomQuoteForEdit } from "@/lib/admin/customQuotes";
import { toDepositConfig } from "@/lib/pricing/deposit";
import { getStoreSettings } from "@/lib/settings/store";
import { requireModulePage } from "@/lib/admin/auth";

export default async function EditCustomQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModulePage("custom_requests");
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
        deposit={toDepositConfig(settings)}
      />
    </div>
  );
}
