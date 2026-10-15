"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { StoreSettings } from "@/lib/settings/store";

export function StoreSettingsForm({ initial }: { initial: StoreSettings }) {
  const [values, setValues] = useState({
    ...initial,
    depositPercent: String(Math.round(initial.depositRate * 100)),
    depositFixedAmountText: initial.depositFixedAmount != null ? String(initial.depositFixedAmount) : "",
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
      if (values.depositMode === "percentage" && (!Number.isFinite(depositRate) || depositRate <= 0 || depositRate > 1)) {
        throw new Error("Deposit % must be a number between 1 and 100.");
      }
      const depositFixedAmount = Number(values.depositFixedAmountText);
      if (values.depositMode === "fixed" && (!Number.isFinite(depositFixedAmount) || depositFixedAmount <= 0)) {
        throw new Error("Fixed advance must be a number greater than 0.");
      }
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositRate,
          depositMode: values.depositMode,
          depositFixedAmount: values.depositMode === "fixed" ? depositFixedAmount : null,
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
      <Field label="Deposit / advance" hint="Applies to every new price calculation site-wide, going forward.">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => set("depositMode", "percentage")}
            className={`rounded-full border-2 px-4 py-2 font-body text-sm font-bold ${
              values.depositMode === "percentage"
                ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                : "border-brand-chocolate/10 bg-white text-brand-chocolate"
            }`}
          >
            Percentage of total
          </button>
          <button
            type="button"
            onClick={() => set("depositMode", "fixed")}
            className={`rounded-full border-2 px-4 py-2 font-body text-sm font-bold ${
              values.depositMode === "fixed"
                ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                : "border-brand-chocolate/10 bg-white text-brand-chocolate"
            }`}
          >
            Fixed amount
          </button>
        </div>
        {values.depositMode === "percentage" ? (
          <input
            type="number"
            min={1}
            max={100}
            value={values.depositPercent}
            onChange={(e) => set("depositPercent", e.target.value)}
            placeholder="e.g. 30"
            className="input-field mt-3"
          />
        ) : (
          <input
            type="number"
            min={1}
            value={values.depositFixedAmountText}
            onChange={(e) => set("depositFixedAmountText", e.target.value)}
            placeholder="e.g. 500"
            className="input-field mt-3"
          />
        )}
        <span className="mt-1 block font-body text-xs text-brand-chocolate/50">
          {values.depositMode === "percentage"
            ? "Customers pay this % of their order total up front."
            : "Customers pay this flat amount up front, regardless of order size (never more than the order total)."}
        </span>
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
