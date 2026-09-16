"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/me");
    if (!res.ok) {
      await supabase.auth.signOut();
      setError("That account isn't set up as an admin.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border-2 border-brand-chocolate/10 bg-white p-8"
      >
        <h1 className="mb-1 font-display text-3xl font-semibold text-brand-chocolate">
          Daisy&apos;s Cookery
        </h1>
        <p className="mb-6 font-body text-sm text-brand-chocolate/60">Admin portal</p>

        <label className="mb-4 block">
          <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border-2 border-brand-chocolate/10 bg-white px-3 py-2 font-body text-sm text-brand-chocolate outline-none focus:border-brand-orange"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border-2 border-brand-chocolate/10 bg-white px-3 py-2 font-body text-sm text-brand-chocolate outline-none focus:border-brand-orange"
          />
        </label>

        {error && <p className="mb-4 font-body text-xs text-red-600">{error}</p>}

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <Link
          href="/reset-password"
          className="mt-4 block text-center font-body text-xs text-brand-chocolate/60 hover:text-brand-orange"
        >
          Forgot your password?
        </Link>
      </form>
    </div>
  );
}
