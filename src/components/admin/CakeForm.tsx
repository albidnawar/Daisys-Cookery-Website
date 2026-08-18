"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { EVENT_OPTIONS } from "@/lib/catalog/events";
import { DIETARY_OPTIONS } from "@/lib/catalog/dietary";
import type { AdminCakeDetail, CakeInput } from "@/lib/admin/catalogAdmin";
import type { Flavor } from "@/lib/types/domain";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const AVAILABILITY_OPTIONS: { value: CakeInput["availability"]; label: string }[] = [
  { value: "in_stock", label: "In stock" },
  { value: "sold_out", label: "Sold out" },
  { value: "pre_order", label: "Pre-order only" },
];

export function CakeForm({
  flavors,
  initial,
  cakeId,
}: {
  flavors: Flavor[];
  initial: AdminCakeDetail | null;
  cakeId: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<CakeInput>(
    initial ?? {
      slug: "",
      name: "",
      description: "",
      shortDescription: "",
      basePrice: 0,
      primaryFlavorId: flavors[0]?.id ?? null,
      heroImageUrl: null,
      galleryImageUrls: [],
      isCustomisable: true,
      isActive: true,
      availability: "in_stock",
      isFeaturedHome: false,
      featuredSortOrder: 0,
      dietaryTags: [],
      events: [],
    },
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CakeInput>(key: K, value: CakeInput[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const toggleDietary = (tag: CakeInput["dietaryTags"][number]) => {
    set(
      "dietaryTags",
      values.dietaryTags.includes(tag)
        ? values.dietaryTags.filter((t) => t !== tag)
        : [...values.dietaryTags, tag],
    );
  };

  const toggleEvent = (code: CakeInput["events"][number]) => {
    set(
      "events",
      values.events.includes(code)
        ? values.events.filter((c) => c !== code)
        : [...values.events, code],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(cakeId ? `/api/admin/cakes/${cakeId}` : "/api/admin/cakes", {
        method: cakeId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.push("/admin/catalog");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input
            required
            value={values.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
            className="input-field"
          />
        </Field>
        <Field label="Slug">
          <input
            required
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
            className="input-field"
          />
        </Field>
      </div>

      <Field label="Short description (card blurb)">
        <input
          required
          value={values.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
          className="input-field"
        />
      </Field>

      <Field label="Full description (detail page)">
        <textarea
          required
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className="input-field"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Base price (৳ per lb)">
          <input
            type="number"
            min={0}
            required
            value={values.basePrice}
            onChange={(e) => set("basePrice", Number(e.target.value))}
            className="input-field"
          />
        </Field>
        <Field label="Primary flavor">
          <select
            value={values.primaryFlavorId ?? ""}
            onChange={(e) => set("primaryFlavorId", e.target.value || null)}
            className="input-field"
          >
            {flavors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploadField
          label="Hero image (detail page main photo)"
          value={values.heroImageUrl}
          onChange={(url) => set("heroImageUrl", url)}
        />
        <ImageUploadField
          label="Add a gallery photo"
          value={values.galleryImageUrls[values.galleryImageUrls.length - 1]}
          onChange={(url) => set("galleryImageUrls", [...values.galleryImageUrls, url])}
        />
      </div>
      {values.galleryImageUrls.length > 0 && (
        <div>
          <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
            Gallery ({values.galleryImageUrls.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {values.galleryImageUrls.map((url, i) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "galleryImageUrls",
                      values.galleryImageUrls.filter((_, idx) => idx !== i),
                    )
                  }
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-chocolate text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <span className="mb-2 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          Dietary tags
        </span>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map(({ tag, label }) => (
            <Chip
              key={tag}
              active={values.dietaryTags.includes(tag)}
              onClick={() => toggleDietary(tag)}
            >
              {label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          Occasions
        </span>
        <div className="flex flex-wrap gap-2">
          {EVENT_OPTIONS.map(({ code, label }) => (
            <Chip key={code} active={values.events.includes(code)} onClick={() => toggleEvent(code)}>
              {label}
            </Chip>
          ))}
        </div>
      </div>

      <hr className="border-brand-chocolate/10" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Availability">
          <select
            value={values.availability}
            onChange={(e) => set("availability", e.target.value as CakeInput["availability"])}
            className="input-field"
          >
            {AVAILABILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 font-body text-sm text-brand-chocolate">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
          />
          Visible on the site
        </label>
      </div>

      <div className="rounded-2xl border-2 border-brand-chocolate/10 p-4">
        <p className="mb-3 font-display text-lg font-semibold text-brand-chocolate">
          Where this photo shows up
        </p>
        <label className="mb-2 flex items-center gap-2 font-body text-sm text-brand-chocolate">
          <input
            type="checkbox"
            checked={values.isFeaturedHome}
            onChange={(e) => set("isFeaturedHome", e.target.checked)}
          />
          Show in homepage &quot;Shop by flavor&quot; grid
        </label>
        {values.isFeaturedHome && (
          <Field label="Position (lower shows first)">
            <input
              type="number"
              value={values.featuredSortOrder}
              onChange={(e) => set("featuredSortOrder", Number(e.target.value))}
              className="input-field w-24"
            />
          </Field>
        )}
        <p className="mt-3 font-body text-xs text-brand-chocolate/50">
          The homepage hero image is managed separately under{" "}
          <span className="font-bold">Hero Banner</span>.
        </p>
      </div>

      {error && <p className="font-body text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving…" : cakeId ? "Save changes" : "Create cake"}
        </Button>
      </div>
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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 px-3 py-1 font-body text-xs font-bold ${
        active
          ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
          : "border-brand-chocolate/10 bg-white text-brand-chocolate"
      }`}
    >
      {children}
    </button>
  );
}
