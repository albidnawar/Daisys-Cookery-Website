import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ResetPasswordClient } from "@/components/account/ResetPasswordClient";

// Deliberately outside both (site) and admin/ — one shared flow, since
// "forgot password" doesn't care whether the account is a customer or an
// admin login, and Supabase Auth has one users table either way.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const supabase = await createServerSupabaseClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from("admin_users").select("id").eq("id", user.id).maybeSingle();
    isAdmin = Boolean(data);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-3xl border-2 border-brand-chocolate/10 bg-white p-8">
        <h1 className="mb-1 font-display text-3xl font-semibold text-brand-chocolate">
          Daisy&apos;s Cookery
        </h1>
        <p className="mb-6 font-body text-sm text-brand-chocolate/60">
          {user ? "Set a new password" : "Reset your password"}
        </p>
        <ResetPasswordClient hasSession={Boolean(user)} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
