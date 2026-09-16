import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { buildManifestCsv, listManifestForDate } from "@/lib/admin/logistics";

export async function GET(request: NextRequest) {
  try {
    await requireModule("logistics");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }

  const date = request.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const rows = await listManifestForDate(date);

  if (request.nextUrl.searchParams.get("format") === "csv") {
    const csv = buildManifestCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="delivery-manifest-${date}.csv"`,
      },
    });
  }

  return NextResponse.json({ rows });
}
