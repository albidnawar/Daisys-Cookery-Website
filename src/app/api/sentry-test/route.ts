import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

// Temporary — added only to verify the Sentry wiring actually reports
// errors, then removed. Not part of the app.
export async function GET() {
  Sentry.captureMessage("Sentry verification: manual test message from Claude");
  throw new Error("Sentry verification: manual test server error from Claude");
  // eslint-disable-next-line no-unreachable
  return NextResponse.json({ ok: true });
}
