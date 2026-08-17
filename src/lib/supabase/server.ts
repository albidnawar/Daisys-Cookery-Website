import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// See src/lib/catalog/queries.ts for why these clients are untyped for now.

/** RLS-scoped client for use in Server Components and route handlers acting
 * on behalf of the signed-in visitor (or an anonymous/public read). */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render, where cookies are
            // read-only. Session refresh for that request is handled by
            // middleware instead.
          }
        },
      },
    },
  );
}

/** Service-role client that bypasses RLS. Server-only (route handlers), and
 * only for operations that legitimately need to act across all customers'
 * rows: slot-capacity booking, order finalization, notification dispatch. */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
