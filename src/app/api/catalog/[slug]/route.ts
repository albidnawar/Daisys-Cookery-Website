import { NextResponse } from "next/server";
import { getCachedCakeBySlug } from "@/lib/catalog/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const cake = await getCachedCakeBySlug(slug);

  if (!cake) {
    return NextResponse.json({ error: "Cake not found" }, { status: 404 });
  }

  return NextResponse.json({ cake });
}
