import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { deleteCustomQuote } from "@/lib/admin/customQuotes";

export async function POST(request: NextRequest) {
  try {
    await requireModule("custom_requests");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }

  const { ids } = (await request.json()) as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No requests selected" }, { status: 400 });
  }

  const deletedIds: string[] = [];
  const failedIds: string[] = [];
  for (const id of ids) {
    try {
      await deleteCustomQuote(id);
      deletedIds.push(id);
    } catch {
      failedIds.push(id);
    }
  }

  return NextResponse.json({ ok: true, deletedIds, failedIds });
}
