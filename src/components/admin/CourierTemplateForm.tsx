"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { CourierTemplateSettings } from "@/lib/admin/courierSettings";

/** The static boilerplate every courier-dispatch message shares (see
 * CourierMessagesManager) — edited rarely, so a flat form is enough. */
export function CourierTemplateForm({ initial }: { initial: CourierTemplateSettings }) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CourierTemplateSettings>(key: K, value: CourierTemplateSettings[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/admin/courier-template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      setSaving(false);
      return;
    }
    setSaved(true);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <Field label="Courier name">
        <input
          value={values.courierName}
          onChange={(e) => set("courierName", e.target.value)}
          className="input-field"
        />
      </Field>
      <Field label="Pickup point" hint="Short area/landmark name shown as পিকআপ পয়েন্ট.">
        <input
          value={values.pickupPoint}
          onChange={(e) => set("pickupPoint", e.target.value)}
          className="input-field"
        />
      </Field>
      <Field label="Your number" hint="Shown as আপনার নাম্বার.">
        <input
          value={values.senderNumber}
          onChange={(e) => set("senderNumber", e.target.value)}
          className="input-field"
        />
      </Field>
      <Field label="Your address" hint="Full address shown as আপনার ঠিকানা.">
        <textarea
          rows={2}
          value={values.senderAddress}
          onChange={(e) => set("senderAddress", e.target.value)}
          className="input-field"
        />
      </Field>
      <Field label="Your Facebook ID name" hint="Optional — left blank if you don't use one.">
        <input
          value={values.senderFacebookName}
          onChange={(e) => set("senderFacebookName", e.target.value)}
          className="input-field"
        />
      </Field>
      <Field label="Your bKash number" hint="Shown to the courier for reconciling cash collection, separate from the customer-facing advance-payment bKash number.">
        <input
          value={values.bkashNumber}
          onChange={(e) => set("bkashNumber", e.target.value)}
          className="input-field"
        />
      </Field>
      <Field label="Your page name">
        <input
          value={values.pageName}
          onChange={(e) => set("pageName", e.target.value)}
          className="input-field"
        />
      </Field>
      <Field label="Emergency number">
        <input
          value={values.emergencyNumber}
          onChange={(e) => set("emergencyNumber", e.target.value)}
          className="input-field"
        />
      </Field>
      <Field label="Liability note" hint="The standard warning shown near the bottom of every message.">
        <textarea
          rows={3}
          value={values.noteText}
          onChange={(e) => set("noteText", e.target.value)}
          className="input-field"
        />
      </Field>

      {error && <p className="font-body text-sm text-red-600">{error}</p>}
      {saved && <p className="font-body text-sm text-emerald-700">Saved.</p>}

      <Button type="submit" variant="primary" disabled={saving} className="w-fit">
        {saving ? "Saving…" : "Save template"}
      </Button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block font-body text-xs text-brand-chocolate/50">{hint}</span>}
    </label>
  );
}
