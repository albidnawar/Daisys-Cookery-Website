import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/admin/auth";
import { createCustomQuote, listCustomQuotes } from "@/lib/admin/customQuotes";
import type { CustomQuoteInput } from "@/lib/types/domain";

async function guard() {
  try {
    await requireAdmin();
    return null;
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const quotes = await listCustomQuotes();
  return NextResponse.json({ quotes });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const input = (await request.json()) as CustomQuoteInput;
    const id = await createCustomQuote(input, admin.id);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
}
