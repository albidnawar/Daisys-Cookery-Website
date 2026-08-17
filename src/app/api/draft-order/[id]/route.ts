import { NextResponse, type NextRequest } from "next/server";
import { getDraftOrder, updateDraftOrderSpec } from "@/lib/draftOrders/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const draft = await getDraftOrder(id);
  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
  return NextResponse.json({ draft });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const draft = await updateDraftOrderSpec(
      id,
      body.spec ?? {},
      body.fulfilmentType,
    );
    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
}
