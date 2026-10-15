import { NextResponse, type NextRequest } from "next/server";
import { createPendingCustomDraft, getDraftOrder } from "@/lib/draftOrders/store";

/** Creates the draft behind the public order-form's "Custom design"
 * path — no catalog cake, no price yet. Counterpart to POST
 * /api/draft-order, which always resolves a real catalog cakeSlug. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const customCakeName = body.customCakeName;

  if (!customCakeName || typeof customCakeName !== "string") {
    return NextResponse.json({ error: "customCakeName is required" }, { status: 400 });
  }

  const id = await createPendingCustomDraft(customCakeName);
  const draft = await getDraftOrder(id);
  return NextResponse.json({ draft }, { status: 201 });
}
