"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { AdminBanner, BannerInput } from "@/lib/admin/bannersAdmin";

const EMPTY: BannerInput = { message: "", linkUrl: null, isActive: true, sortOrder: 0 };

export function BannersManager({ initialBanners }: { initialBanners: AdminBanner[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [draft, setDraft] = useState<BannerInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/admin/banners");
    const data = await res.json();
    setBanners(data.banners ?? []);
  };

  const addBanner = async () => {
    if (!draft.message.trim()) return;
    setSaving(true);
    await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setDraft(EMPTY);
    await refresh();
    setSaving(false);
  };

  const updateBanner = async (id: string, patch: Partial<BannerInput>, current: AdminBanner) => {
    await fetch(`/api/admin/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: current.message,
        linkUrl: current.linkUrl,
        isActive: current.isActive,
        sortOrder: current.sortOrder,
        ...patch,
      }),
    });
    await refresh();
  };

  const deleteBanner = async (id: string) => {
    setConfirmingId(null);
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    await refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border-2 border-brand-chocolate/10 bg-white p-4">
        <p className="mb-3 font-display text-lg font-semibold text-brand-chocolate">
          New banner
        </p>
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="e.g. Eid pre-orders closing soon!"
            value={draft.message}
            onChange={(e) => setDraft({ ...draft, message: e.target.value })}
            className="input-field flex-1"
          />
          <input
            placeholder="Link (optional)"
            value={draft.linkUrl ?? ""}
            onChange={(e) => setDraft({ ...draft, linkUrl: e.target.value || null })}
            className="input-field w-48"
          />
          <Button type="button" variant="primary" onClick={addBanner} disabled={saving}>
            Add
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="flex items-center gap-3 rounded-2xl border-2 border-brand-chocolate/10 bg-white p-3"
          >
            <span className="flex-1 font-body text-sm text-brand-chocolate">
              {banner.message}
              {banner.linkUrl && (
                <span className="ml-2 text-brand-chocolate/50">→ {banner.linkUrl}</span>
              )}
            </span>
            <label className="flex items-center gap-1 font-body text-xs text-brand-chocolate/70">
              <input
                type="checkbox"
                checked={banner.isActive}
                onChange={(e) =>
                  updateBanner(banner.id, { isActive: e.target.checked }, banner)
                }
              />
              Active
            </label>
            <button
              type="button"
              onClick={() => setConfirmingId(banner.id)}
              className="font-body text-sm font-bold text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        ))}
        {banners.length === 0 && (
          <p className="font-body text-sm text-brand-chocolate/60">No banners yet.</p>
        )}
      </div>

      <ConfirmDialog
        open={confirmingId !== null}
        message="Delete this banner?"
        onConfirm={() => confirmingId && deleteBanner(confirmingId)}
        onCancel={() => setConfirmingId(null)}
      />
    </div>
  );
}
