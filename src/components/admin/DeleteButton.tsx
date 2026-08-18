"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({ url, confirmText }: { url: string; confirmText: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleClick = async () => {
    if (!confirm(confirmText)) return;
    setDeleting(true);
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Couldn't delete that.");
      setDeleting(false);
      return;
    }
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={deleting}
      className="font-body text-sm font-bold text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
