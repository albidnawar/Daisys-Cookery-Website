import { NextResponse, type NextRequest } from "next/server";
import {
  createCustomQuoteFromCustomer,
  type CustomQuoteRequestInput,
} from "@/lib/admin/customQuotes";

/** Public, unauthenticated — the self-serve counterpart to admin staff
 * logging a custom-cake inquiry by hand (src/app/api/admin/custom-quotes).
 * Reached from the from-scratch customiser once a customer has attached
 * their own reference photo (WizardShell's isFromScratch + "Get a custom
 * quote" path) — see SummaryPanel.tsx's CustomQuoteSubmit. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | (CustomQuoteRequestInput & { draftOrderId?: string | null })
    | null;

  if (!body?.contactName?.trim() || !body.contactPhone?.trim()) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const id = await createCustomQuoteFromCustomer({
    contactName: body.contactName.trim(),
    contactPhone: body.contactPhone.trim(),
    cakeTitle: body.cakeTitle?.trim() || "Custom cake design",
    themeNotes: body.themeNotes ?? null,
    quotedSizeNote: body.quotedSizeNote ?? null,
    referenceImageUrls: body.referenceImageUrls ?? [],
  });

  return NextResponse.json({ id }, { status: 201 });
}
