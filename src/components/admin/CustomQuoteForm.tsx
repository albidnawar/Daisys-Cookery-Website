"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { QuoteLinkPanel } from "@/components/admin/QuoteLinkPanel";
import type { DepositConfig } from "@/lib/pricing/deposit";
import type { CustomQuoteInput, CustomQuoteStatus } from "@/lib/types/domain";

const MAX_REFERENCE_IMAGES = 3;

const STATUS_OPTIONS: { value: CustomQuoteStatus; label: string }[] = [
  { value: "new", label: "New: not priced yet" },
  { value: "quoted", label: "Quoted: waiting on customer" },
  { value: "declined", label: "Declined" },
];

export function CustomQuoteForm({
  initial,
  quoteId,
  contactPhone,
  deposit,
}: {
  initial: CustomQuoteInput | null;
  quoteId: string | null;
  contactPhone: string | null;
  deposit: DepositConfig;
}) {
  const router = useRouter();
  const [values, setValues] = useState<CustomQuoteInput>(
    initial ?? {
      contactName: "",
      contactPhone: "",
      cakeTitle: "",
      themeNotes: "",
      icingColors: "",
      referenceImageUrls: [],
      quotedPrice: null,
      quotedSizeNote: "",
      status: "new",
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CustomQuoteInput>(key: K, value: CustomQuoteInput[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const setReferenceImage = (index: number, url: string) => {
    setValues((prev) => {
      const urls = [...prev.referenceImageUrls];
      urls[index] = url;
      return { ...prev, referenceImageUrls: urls };
    });
  };

  const removeReferenceImage = (index: number) => {
    setValues((prev) => ({
      ...prev,
      referenceImageUrls: prev.referenceImageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        quoteId ? `/api/admin/custom-quotes/${quoteId}` : "/api/admin/custom-quotes",
        {
          method: quoteId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      if (quoteId) {
        router.refresh();
        setSaving(false);
      } else {
        router.push(`/admin/custom-requests/${data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  };

  const imageSlots = Math.min(values.referenceImageUrls.length + 1, MAX_REFERENCE_IMAGES);

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <form onSubmit={handleSubmit} className="flex max-w-xl flex-1 flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer name">
            <input
              required
              value={values.contactName}
              onChange={(e) => set("contactName", e.target.value)}
              className="input-field"
            />
          </Field>
          <Field label="Customer phone / WhatsApp">
            <input
              required
              value={values.contactPhone}
              onChange={(e) => set("contactPhone", e.target.value)}
              className="input-field"
              placeholder="01XXXXXXXXX"
            />
          </Field>
        </div>

        <Field label="Cake title (what to call it on the order/slip)">
          <input
            required
            value={values.cakeTitle}
            onChange={(e) => set("cakeTitle", e.target.value)}
            className="input-field"
            placeholder="3-Tier Rose Wedding Cake"
          />
        </Field>

        <Field label="Theme / design notes">
          <textarea
            rows={4}
            value={values.themeNotes ?? ""}
            onChange={(e) => set("themeNotes", e.target.value || null)}
            className="input-field"
            placeholder="What the customer described from their reference photo…"
          />
        </Field>

        <Field label="Icing colours">
          <input
            value={values.icingColors ?? ""}
            onChange={(e) => set("icingColors", e.target.value || null)}
            className="input-field"
            placeholder="Blush pink and gold"
          />
        </Field>

        <div>
          <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
            Reference photos
          </span>
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: imageSlots }).map((_, i) => (
              <div key={i} className="relative">
                <ImageUploadField
                  label={`Photo ${i + 1}`}
                  value={values.referenceImageUrls[i]}
                  onChange={(url) => setReferenceImage(i, url)}
                />
                {values.referenceImageUrls[i] && (
                  <button
                    type="button"
                    onClick={() => removeReferenceImage(i)}
                    className="absolute right-1 top-6 rounded-full bg-white/90 px-2 py-0.5 font-body text-xs font-bold text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quoted price (৳)">
            <input
              type="number"
              min={0}
              value={values.quotedPrice ?? ""}
              onChange={(e) => set("quotedPrice", e.target.value === "" ? null : Number(e.target.value))}
              className="input-field"
              placeholder="Leave blank until you've decided"
            />
          </Field>
          <Field label="Size note (shown to the customer)">
            <input
              value={values.quotedSizeNote ?? ""}
              onChange={(e) => set("quotedSizeNote", e.target.value || null)}
              className="input-field"
              placeholder="approx 4lb, serves 25"
            />
          </Field>
        </div>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(e) => set("status", e.target.value as CustomQuoteStatus)}
            className="input-field"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        {error && <p className="font-body text-sm text-red-600">{error}</p>}

        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving…" : quoteId ? "Save changes" : "Log this request"}
        </Button>
      </form>

      {quoteId && (
        <QuoteLinkPanel
          quoteId={quoteId}
          status={values.status}
          quotedPrice={values.quotedPrice}
          contactPhone={contactPhone ?? values.contactPhone}
          cakeTitle={values.cakeTitle}
          deposit={deposit}
        />
      )}
    </div>
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
