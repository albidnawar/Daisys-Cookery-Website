"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

function callbackUrl(next: string) {
  return `${window.location.origin}/account/auth/callback?next=${encodeURIComponent(next)}`;
}

export function AccountLoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    setCheckEmail(false);
    startTransition(async () => {
      const supabase = createClient();

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl(next) },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        if (data.session) {
          // Email confirmation is disabled on this project — already signed in.
          router.push(next);
          router.refresh();
          return;
        }
        setCheckEmail(true);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(
          signInError.message.toLowerCase().includes("email not confirmed")
            ? "Please verify your email first — check your inbox for the confirmation link."
            : signInError.message,
        );
        return;
      }
      router.push(next);
      router.refresh();
    });
  };

  const continueWithGoogle = () => {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl(next) },
      });
      if (oauthError) setError(oauthError.message);
    });
  };

  if (checkEmail) {
    return (
      <p className="font-body text-sm text-brand-chocolate/80">
        We sent a confirmation link to <strong>{email}</strong>. Click it, then come back and sign in.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 rounded-full bg-cream p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-full py-2 font-body text-sm font-bold transition-colors ${
            mode === "signin" ? "bg-white text-brand-chocolate shadow-sm" : "text-brand-chocolate/50"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-full py-2 font-body text-sm font-bold transition-colors ${
            mode === "signup" ? "bg-white text-brand-chocolate shadow-sm" : "text-brand-chocolate/50"
          }`}
        >
          Create account
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-4"
      >
        <label className="flex flex-col gap-2 font-body text-sm text-brand-chocolate">
          Email address
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-2 font-body text-sm text-brand-chocolate">
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="At least 6 characters"
          />
        </label>
        {error && <p className="font-body text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <hr className="flex-1 border-brand-chocolate/10" />
        <span className="font-body text-xs text-brand-chocolate/40">or</span>
        <hr className="flex-1 border-brand-chocolate/10" />
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={continueWithGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-brand-chocolate/15 bg-white py-3 font-body text-sm font-bold text-brand-chocolate transition-colors hover:border-brand-chocolate/30 disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.48a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.74l4-3.1z" />
          <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.6 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.63l4 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
