"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      setPassword("");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
      <p className="font-display text-lg font-semibold text-brand-chocolate">Change my password</p>
      <label className="block">
        <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          New password
        </span>
        <input
          required
          minLength={6}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
      </label>
      {error && <p className="font-body text-sm text-red-600">{error}</p>}
      {saved && <p className="font-body text-sm text-emerald-700">Password updated.</p>}
      <Button type="submit" variant="secondary" disabled={saving} className="w-fit">
        {saving ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
