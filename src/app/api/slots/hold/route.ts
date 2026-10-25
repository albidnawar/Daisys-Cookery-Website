import { NextResponse, type NextRequest } from "next/server";
import { DailyCapReachedError, DateBlockedError, holdSlot } from "@/lib/slots/store";
import { updateDraftOrderFulfilment } from "@/lib/draftOrders/store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { draftId, date, startTime, fulfilmentType, zoneId, deliveryAddress } = body;

  if (!draftId || !date || !startTime || !fulfilmentType || !zoneId) {
    return NextResponse.json(
      { error: "draftId, date, startTime, fulfilmentType and zoneId are required" },
      { status: 400 },
    );
  }

  try {
    const hold = await holdSlot({ date, startTime, fulfilmentType, zoneId, draftId });
    const draft = await updateDraftOrderFulfilment(draftId, {
      slotId: hold.slotId,
      fulfilmentType,
      zoneId,
      deliveryAddress,
    });
    return NextResponse.json({ hold, draft });
  } catch (error) {
    if (error instanceof DateBlockedError) {
      return NextResponse.json({ error: "date_blocked" }, { status: 409 });
    }
    if (error instanceof DailyCapReachedError) {
      return NextResponse.json({ error: "daily_cap_reached" }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to hold slot" }, { status: 400 });
  }
}
