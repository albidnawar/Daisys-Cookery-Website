import { listCustomQuotes } from "@/lib/admin/customQuotes";
import { requireModulePage } from "@/lib/admin/auth";
import { LinkButton } from "@/components/ui/Button";
import { CustomRequestsManager } from "@/components/admin/CustomRequestsManager";
import type { CustomQuoteStatus } from "@/lib/types/domain";

export default async function AdminCustomRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireModulePage("custom_requests");
  const { status, q } = await searchParams;
  const quotes = await listCustomQuotes({
    status: status as CustomQuoteStatus | undefined,
    search: q,
  });

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

      <CustomRequestsManager quotes={quotes} initialStatus={status ?? ""} initialSearch={q ?? ""} />
    </div>
  );
}
