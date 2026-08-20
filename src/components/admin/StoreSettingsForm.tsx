"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { StoreSettings } from "@/lib/settings/store";

export function StoreSettingsForm({ initial }: { initial: StoreSettings }) {
  const [values, setValues] = useState({
    ...initial,
    depositPercent: String(Math.round(initial.depositRate * 100)),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const depositRate = Number(values.depositPercent) / 100;
      if (!Number.isFinite(depositRate) || depositRate <= 0 || depositRate > 1) {
        throw new Error("Deposit % must be a number between 1 and 100.");
      }
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositRate,
          shopAddress: values.shopAddress,
          shopHours: values.shopHours,
          shopPhone: values.shopPhone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <Field label="Deposit percentage" hint="Applies to every new price calculation site-wide, going forward.">
        <input
          type="number"
          min={1}
          max={100}
          value={values.depositPercent}
          onChange={(e) => set("depositPercent", e.target.value)}
          className="input-field"
        />
      </Field>

      <Field label="Shop address" hint="Shown on the confirmation page, pickup option, and Our Shop page.">
        <textarea
          rows={2}
          value={values.shopAddress}
          onChange={(e) => set("shopAddress", e.target.value)}
          className="input-field"
        />
      </Field>

      <Field label="Opening hours">
        <input
          value={values.shopHours}
          onChange={(e) => set("shopHours", e.target.value)}
          className="input-field"
        />
      </Field>

      <Field label="Shop phone" hint="Shown wherever customers are told to call for >5lb custom orders.">
        <input
          value={values.shopPhone}
          onChange={(e) => set("shopPhone", e.target.value)}
          className="input-field"
        />
      </Field>

      {error && <p className="font-body text-sm text-red-600">{error}</p>}
      {saved && <p className="font-body text-sm text-emerald-700">Saved.</p>}

      <Button type="submit" variant="primary" disabled={saving} className="w-fit">
        {saving ? "Saving…" : "Save settings"}
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
