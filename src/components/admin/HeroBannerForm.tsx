"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { HeroBannerInput } from "@/lib/admin/heroBannerAdmin";

export function HeroBannerForm({ initial }: { initial: HeroBannerInput }) {
  const [values, setValues] = useState<HeroBannerInput>(initial);
  const [isClickable, setIsClickable] = useState(Boolean(initial.linkUrl));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof HeroBannerInput>(key: K, value: HeroBannerInput[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/hero-banner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          linkUrl: isClickable ? values.linkUrl : null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <p className="font-body text-sm text-brand-chocolate/60">
        One large image shown at the top of the homepage. No cake name or
        text is overlaid on it — it&apos;s shown exactly as uploaded.
      </p>

      <ImageUploadField
        label="Hero image"
        value={values.imageUrl}
        onChange={(url) => set("imageUrl", url)}
      />

      <div>
        <label className="mb-2 flex items-center gap-2 font-body text-sm text-brand-chocolate">
          <input
            type="checkbox"
            checked={isClickable}
            onChange={(e) => setIsClickable(e.target.checked)}
          />
          Make it a clickable link
        </label>
        {isClickable ? (
          <input
            placeholder="/browse?event=eid_festive or https://…"
            value={values.linkUrl ?? ""}
            onChange={(e) => set("linkUrl", e.target.value)}
            className="input-field"
          />
        ) : (
          <p className="font-body text-xs text-brand-chocolate/50">
            Static image — visitors can&apos;t click through anywhere.
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 font-body text-sm text-brand-chocolate">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
        />
        Show on the homepage
      </label>

      {error && <p className="font-body text-sm text-red-600">{error}</p>}
      {saved && <p className="font-body text-sm text-green-700">Saved.</p>}

      <div>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
