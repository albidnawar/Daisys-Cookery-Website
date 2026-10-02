"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { CustomerProfile } from "@/lib/types/domain";

export function ProfileForm({ profile }: { profile: CustomerProfile }) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [allergenText, setAllergenText] = useState(profile.allergenDefaults.join(", "));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const allergenDefaults = allergenText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, phone, allergenDefaults }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save your profile");
        return;
      }
      setSaved(true);
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex max-w-lg flex-col gap-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6"
    >
      <label className="flex flex-col gap-2 font-body text-sm text-brand-chocolate">
        Email
        <input type="email" value={profile.email} disabled className="input-field opacity-60" />
      </label>
      <label className="flex flex-col gap-2 font-body text-sm text-brand-chocolate">
        Name
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="input-field"
        />
      </label>
      <label className="flex flex-col gap-2 font-body text-sm text-brand-chocolate">
        Phone
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input-field"
          placeholder="01XXXXXXXXX"
        />
      </label>
      <label className="flex flex-col gap-2 font-body text-sm text-brand-chocolate">
        Allergies / dietary notes
        <input
          type="text"
          value={allergenText}
          onChange={(e) => setAllergenText(e.target.value)}
          className="input-field"
          placeholder="no nuts, no eggs"
        />
        <span className="font-body text-xs text-brand-chocolate/50">Comma-separated, shown to us as a default note on new orders.</span>
      </label>
      {error && <p className="font-body text-sm text-red-600">{error}</p>}
      {saved && <p className="font-body text-sm text-emerald-700">Saved.</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
