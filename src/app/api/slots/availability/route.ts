import { NextResponse, type NextRequest } from "next/server";
import { listAvailability } from "@/lib/slots/store";
import { ensureSlotsGenerated } from "@/lib/slots/generate";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const date = params.get("date");
  const fulfilmentType = params.get("fulfilmentType");
  const zoneId = params.get("zoneId") ?? undefined;

  if (!date || (fulfilmentType !== "pickup" && fulfilmentType !== "delivery")) {
    return NextResponse.json(
      { error: "date and fulfilmentType (pickup|delivery) are required" },
      { status: 400 },
    );
  }

  await ensureSlotsGenerated();
  const slots = await listAvailability(date, fulfilmentType, zoneId);
  return NextResponse.json({ slots });
}
