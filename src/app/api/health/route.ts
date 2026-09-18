import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";

// Trivial DB-reachability check for an uptime monitor (see the surge-
// readiness plan) — lets a Supabase or deploy problem be noticed via a
// failed ping instead of a customer complaint.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ status: "ok", db: "not_configured" });
  }

  const start = Date.now();
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("store_settings").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ status: "ok", db: "reachable", latencyMs: Date.now() - start });
  } catch {
    return NextResponse.json(
      { status: "error", db: "unreachable", latencyMs: Date.now() - start },
      { status: 500 },
    );
  }
}
