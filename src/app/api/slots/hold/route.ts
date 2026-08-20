import { NextResponse, type NextRequest } from "next/server";
import { DailyCapReachedError, DateBlockedError, holdSlot, SlotFullError } from "@/lib/slots/store";
import { updateDraftOrderFulfilment } from "@/lib/draftOrders/store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { draftId, slotId, fulfilmentType, zoneId } = body;

  if (!draftId || !slotId) {
    return NextResponse.json(
      { error: "draftId and slotId are required" },
      { status: 400 },
    );
  }

  try {
    const hold = await holdSlot(slotId, draftId);
    const draft = await updateDraftOrderFulfilment(draftId, {
      slotId,
      fulfilmentType,
      zoneId,
    });
    return NextResponse.json({ hold, draft });
  } catch (error) {
    if (error instanceof SlotFullError) {
      return NextResponse.json({ error: "slot_full" }, { status: 409 });
    }
    if (error instanceof DateBlockedError) {
      return NextResponse.json({ error: "date_blocked" }, { status: 409 });
    }
    if (error instanceof DailyCapReachedError) {
      return NextResponse.json({ error: "daily_cap_reached" }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to hold slot" }, { status: 400 });
  }
}
