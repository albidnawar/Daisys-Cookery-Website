import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCakeBySlug } from "@/lib/catalog/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const cake = await getCakeBySlug(supabase, slug);

  if (!cake) {
    return NextResponse.json({ error: "Cake not found" }, { status: 404 });
  }

  return NextResponse.json({ cake });
}
