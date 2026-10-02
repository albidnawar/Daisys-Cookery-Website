"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { todayKey } from "@/lib/dates";
import type { ReviewInput } from "@/lib/admin/reviewsAdmin";

export function ReviewForm({
  cakes,
  initial,
  reviewId,
}: {
  cakes: { id: string; name: string }[];
  initial: (ReviewInput & { id: string }) | null;
  reviewId: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ReviewInput>(
    initial ?? {
      customerName: "",
      reviewText: "",
      cakeImageUrl: null,
      cakeImageFocal: { x: 0.5, y: 0.5 },
      rating: 5,
      reviewDate: todayKey(),
      cakeId: null,
      isActive: true,
      sortOrder: 0,
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ReviewInput>(key: K, value: ReviewInput[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        reviewId ? `/api/admin/reviews/${reviewId}` : "/api/admin/reviews",
        {
          method: reviewId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.push("/admin/reviews");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <Field label="Customer name">
        <input
          required
          value={values.customerName}
          onChange={(e) => set("customerName", e.target.value)}
          className="input-field"
        />
      </Field>

      <Field label="Review text">
        <textarea
          required
          rows={4}
          value={values.reviewText}
          onChange={(e) => set("reviewText", e.target.value)}
          className="input-field"
        />
      </Field>

      <ImageUploadField
        label="Cake photo (or chat screenshot)"
        value={values.cakeImageUrl}
        onChange={(url) => set("cakeImageUrl", url)}
        focal={values.cakeImageFocal}
        onFocalChange={(point) => set("cakeImageFocal", point)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Rating">
          <select
            value={values.rating}
            onChange={(e) => set("rating", Number(e.target.value))}
            className="input-field"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input
            type="date"
            required
            value={values.reviewDate}
            onChange={(e) => set("reviewDate", e.target.value)}
            className="input-field"
          />
        </Field>
      </div>

      <Field label="Tag to a cake (optional)">
        <select
          value={values.cakeId ?? ""}
          onChange={(e) => set("cakeId", e.target.value || null)}
          className="input-field"
        >
          <option value="">None</option>
          {cakes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sort order (lower shows first)">
          <input
            type="number"
            value={values.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
            className="input-field"
          />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 font-body text-sm text-brand-chocolate">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
          />
          Published (visible on the site)
        </label>
      </div>

      {error && <p className="font-body text-sm text-red-600">{error}</p>}

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Saving…" : reviewId ? "Save changes" : "Add review"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
        {label}
      </span>
      {children}
    </label>
  );
}
