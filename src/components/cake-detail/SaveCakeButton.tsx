"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function SaveCakeButton({ cakeId }: { cakeId: string }) {
  const router = useRouter();
  const [savedId, setSavedId] = useState<string | null | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/account/saved-cakes?cakeId=${cakeId}`)
      .then((res) => (res.ok ? res.json() : { saved: false, savedId: null }))
      .then((data) => {
        if (!cancelled) setSavedId(data.saved ? data.savedId : null);
      });
    return () => {
      cancelled = true;
    };
  }, [cakeId]);

  const toggle = () => {
    startTransition(async () => {
      if (savedId) {
        await fetch(`/api/account/saved-cakes/${savedId}`, { method: "DELETE" });
        setSavedId(null);
      } else {
        const res = await fetch("/api/account/saved-cakes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cakeId }),
        });
        if (res.status === 401) {
          router.push(`/account/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        if (res.ok) {
          const data = await fetch(`/api/account/saved-cakes?cakeId=${cakeId}`).then((r) => r.json());
          setSavedId(data.savedId);
        }
      }
    });
  };

  if (savedId === undefined) return null;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={toggle}
      className={`inline-flex w-fit items-center gap-2 rounded-full border-2 px-5 py-2.5 font-body text-sm font-bold transition-colors disabled:opacity-50 ${
        savedId
          ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
          : "border-brand-chocolate/15 text-brand-chocolate hover:border-brand-chocolate/30"
      }`}
    >
      {savedId ? "♥ Saved" : "♡ Save to my account"}
    </button>
  );
}
