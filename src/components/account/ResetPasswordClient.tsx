"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordClient({ hasSession, isAdmin }: { hasSession: boolean; isAdmin: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  const setNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-body text-sm text-brand-chocolate/80">
          Password updated. You&apos;re signed in with it now.
        </p>
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            router.push(isAdmin ? "/admin" : "/account");
            router.refresh();
          }}
        >
          Continue
        </Button>
      </div>
    );
  }

  if (hasSession) {
    return (
      <form onSubmit={setNewPassword} className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
            New password
          </span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </label>
        {error && <p className="font-body text-xs text-red-600">{error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Set new password"}
        </Button>
      </form>
    );
  }

  if (sent) {
    return (
      <p className="font-body text-sm text-brand-chocolate/80">
        If <strong>{email}</strong> has an account, we&apos;ve sent a link to reset its password.
      </p>
    );
  }

  return (
    <form onSubmit={requestLink} className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          Email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
      </label>
      {error && <p className="font-body text-xs text-red-600">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
