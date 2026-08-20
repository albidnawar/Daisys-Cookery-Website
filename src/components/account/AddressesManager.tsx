"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { CustomerAddress } from "@/lib/types/domain";

export function AddressesManager({ addresses }: { addresses: CustomerAddress[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [text, setText] = useState("");
  const [isDefault, setIsDefault] = useState(addresses.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const addAddress = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, text, isDefault }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't save that address");
        return;
      }
      setLabel("");
      setText("");
      setIsDefault(false);
      router.refresh();
    });
  };

  const removeAddress = (id: string) => {
    startTransition(async () => {
      await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {addresses.length > 0 && (
        <div className="flex flex-col gap-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="flex items-start justify-between gap-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5"
            >
              <div>
                <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
                  {address.label} {address.isDefault && "· Default"}
                </p>
                <p className="font-body text-sm text-brand-chocolate/80">{address.text}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => removeAddress(address.id)}
                className="font-body text-xs font-bold text-brand-chocolate/50 hover:text-red-600 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addAddress();
        }}
        className="flex flex-col gap-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6"
      >
        <p className="font-display text-lg font-semibold text-brand-chocolate">Add a new address</p>
        <label className="flex flex-col gap-2 font-body text-sm text-brand-chocolate">
          Label
          <input
            type="text"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input-field"
            placeholder="Home, Office…"
          />
        </label>
        <label className="flex flex-col gap-2 font-body text-sm text-brand-chocolate">
          Full address
          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input-field"
            rows={3}
          />
        </label>
        <label className="flex items-center gap-2 font-body text-sm text-brand-chocolate">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Use as default delivery address
        </label>
        {error && <p className="font-body text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Saving…" : "Save address"}
        </Button>
      </form>
    </div>
  );
}
