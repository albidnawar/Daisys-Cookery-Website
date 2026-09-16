import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { listDateCapacityRows, upsertDateCapacitySetting } from "@/lib/admin/logistics";
import type { DateCapacitySetting } from "@/lib/admin/logistics";

async function guard() {
  try {
    await requireModule("logistics");
    return null;
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  const rows = await listDateCapacityRows(from, to);
  return NextResponse.json({ rows });
}

export async function POST(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const input = (await request.json()) as DateCapacitySetting;
  await upsertDateCapacitySetting(input);
  return NextResponse.json({ ok: true });
}
