"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function SavedCakeRemoveButton({ savedCakeId }: { savedCakeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await fetch(`/api/account/saved-cakes/${savedCakeId}`, { method: "DELETE" });
          router.refresh();
        })
      }
      className="font-body text-xs font-bold text-brand-chocolate/50 hover:text-red-600 disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
