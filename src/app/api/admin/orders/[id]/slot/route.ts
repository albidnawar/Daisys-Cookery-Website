import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { DailyCapReachedError, DateBlockedError, rescheduleOrderSlot } from "@/lib/slots/store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireModule("live_orders");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { date, startTime } = body;
  if (!date || !startTime) {
    return NextResponse.json({ error: "A date and time are required" }, { status: 400 });
  }

  try {
    await rescheduleOrderSlot(id, date, startTime);
  } catch (error) {
    if (error instanceof DateBlockedError) {
      return NextResponse.json({ error: "That date is blocked for new orders." }, { status: 409 });
    }
    if (error instanceof DailyCapReachedError) {
      return NextResponse.json(
        { error: "That date has reached its daily order limit." },
        { status: 409 },
      );
    }
    console.error("Failed to reschedule order slot", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't save that" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
