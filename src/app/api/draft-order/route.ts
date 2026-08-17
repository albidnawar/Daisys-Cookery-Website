import { NextResponse, type NextRequest } from "next/server";
import { createDraftOrder } from "@/lib/draftOrders/store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const cakeSlug = body.cakeSlug;

  if (!cakeSlug || typeof cakeSlug !== "string") {
    return NextResponse.json({ error: "cakeSlug is required" }, { status: 400 });
  }

  try {
    const draft = await createDraftOrder(cakeSlug);
    return NextResponse.json({ draft }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unknown cake" }, { status: 404 });
  }
}
