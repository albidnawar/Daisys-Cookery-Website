import { createBrowserClient } from "@supabase/ssr";

// See src/lib/catalog/queries.ts for why this is untyped for now.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
