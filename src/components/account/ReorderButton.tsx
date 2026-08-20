"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ReorderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await fetch(`/api/account/orders/${orderId}/reorder`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error ?? "Couldn't start a reorder");
              return;
            }
            router.push(`/buying-options?draft=${data.draftId}`);
          })
        }
        className="rounded-full bg-brand-orange px-4 py-2 font-body text-sm font-bold text-white shadow-md shadow-brand-orange/20 hover:bg-brand-chocolate disabled:opacity-50"
      >
        {pending ? "Preparing…" : "Reorder"}
      </button>
      {error && <p className="max-w-[200px] text-right font-body text-xs text-red-600">{error}</p>}
    </div>
  );
}
