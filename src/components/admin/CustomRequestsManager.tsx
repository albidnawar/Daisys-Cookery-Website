"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { CustomQuoteSummary } from "@/lib/types/domain";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-mint text-brand-chocolate",
  quoted: "bg-brand-orange/15 text-brand-orange",
  declined: "bg-brand-chocolate/10 text-brand-chocolate/60",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "quoted", label: "Quoted" },
  { value: "declined", label: "Declined" },
];

export function CustomRequestsManager({
  quotes,
  initialStatus,
  initialSearch,
}: {
  quotes: CustomQuoteSummary[];
  initialStatus: string;
  initialSearch: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState(initialSearch);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushFilters = (nextStatus: string, nextSearch: string) => {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (nextSearch) params.set("q", nextSearch);
    router.replace(`/admin/custom-requests${params.toString() ? `?${params}` : ""}`);
  };

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => pushFilters(status, search), 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  const allSelected = quotes.length > 0 && selectedIds.size === quotes.length;

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => (prev.size === quotes.length ? new Set() : new Set(quotes.map((q) => q.id))));
  };

  const bulkDelete = async () => {
    setConfirmingBulkDelete(false);
    setBulkDeleting(true);
    setBulkError(null);
    const res = await fetch("/api/admin/custom-quotes/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selectedIds] }),
    });
    const data = await res.json().catch(() => ({}));
    setBulkDeleting(false);
    if (!res.ok) {
      setBulkError(data.error ?? "Couldn't delete those requests.");
      return;
    }
    if (data.failedIds?.length) {
      const total = data.deletedIds.length + data.failedIds.length;
      setBulkError(`Deleted ${data.deletedIds.length} of ${total}. Some failed — try again.`);
    }
    setSelectedIds(new Set());
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input-field w-auto"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by request ID, name, phone, or title"
          className="input-field w-full max-w-sm"
        />
        <label className="ml-auto flex items-center gap-2 font-body text-sm text-brand-chocolate/70">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Select all
        </label>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-brand-orange/30 bg-brand-orange/5 p-3">
          <span className="font-body text-sm font-bold text-brand-chocolate">
            {selectedIds.size} selected
          </span>
          <button
            type="button"
            onClick={() => setConfirmingBulkDelete(true)}
            disabled={bulkDeleting}
            className="font-body text-sm font-bold text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {bulkDeleting ? "Deleting…" : "Delete selected"}
          </button>
          {bulkError && <span className="font-body text-xs text-red-600">{bulkError}</span>}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {quotes.map((quote) => (
          <div
            key={quote.id}
            className="flex items-center gap-4 rounded-2xl border-2 border-brand-chocolate/10 bg-white p-4 hover:border-brand-orange/30"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(quote.id)}
              onChange={() => toggleOne(quote.id)}
              className="flex-none"
            />
            <Link href={`/admin/custom-requests/${quote.id}`} className="flex flex-1 items-center gap-4">
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
                <p className="font-body text-xs text-brand-chocolate/40">{quote.id}</p>
              </div>
              {quote.quotedPrice != null && (
                <p className="font-body text-sm font-bold text-brand-chocolate">
                  ৳{quote.quotedPrice.toLocaleString("en-BD")}
                </p>
              )}
            </Link>
            <DeleteButton
              url={`/api/admin/custom-quotes/${quote.id}`}
              confirmText={`Permanently delete the request from "${quote.contactName}"? This can't be undone.`}
            />
          </div>
        ))}
        {quotes.length === 0 && (
          <p className="font-body text-sm text-brand-chocolate/60">
            No custom requests match those filters.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmingBulkDelete}
        message={`Permanently delete ${selectedIds.size} selected request(s)? This can't be undone.`}
        onConfirm={bulkDelete}
        onCancel={() => setConfirmingBulkDelete(false)}
      />
    </div>
  );
}
