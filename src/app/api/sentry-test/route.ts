import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

// Temporary — added only to verify the Sentry wiring actually reports
// errors, then removed. Not part of the app.
export async function GET() {
  Sentry.captureMessage("Sentry verification #2: manual test message from Claude (post DSN fix)");
  throw new Error("Sentry verification #2: manual test server error from Claude (post DSN fix)");
  // eslint-disable-next-line no-unreachable
  return NextResponse.json({ ok: true });
}
