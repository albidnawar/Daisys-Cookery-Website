import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Lands both Google OAuth and email-confirmation-link redirects — both
 * arrive as a PKCE `?code=` to exchange for a session (createBrowserClient/
 * createServerClient default to the pkce flow). Only a route handler (not
 * a Server Component render) can actually write the resulting session
 * cookies, which is why this exists as its own route. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const safeNext = next && next.startsWith("/") ? next : "/account";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await supabase.from("customer_profiles").upsert(
        { id: data.user.id },
        { onConflict: "id", ignoreDuplicates: true },
      );
    }
  }

  return NextResponse.redirect(new URL(safeNext, request.url));
}
