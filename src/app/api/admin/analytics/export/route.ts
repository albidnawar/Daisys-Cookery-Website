import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { getSalesReportRows } from "@/lib/admin/analytics";
import { todayKey } from "@/lib/dates";

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: NextRequest) {
  try {
    await requireModule("overview");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }

  const params = request.nextUrl.searchParams;
  const today = todayKey();
  const from = params.get("from") ?? today.slice(0, 8) + "01";
  const to = params.get("to") ?? today;

  const rows = await getSalesReportRows(from, to);

  const header = [
    "Date",
    "Order number",
    "Customer",
    "Phone",
    "Status",
    "Channel",
    "Payment method",
    "Payment status",
    "Fulfilment",
    "Flavor(s)",
    "Weight",
    "Subtotal",
    "Extras total",
    "Delivery fee",
    "Total",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.date,
        row.orderNumber,
        row.customerName,
        row.contactPhone,
        row.status,
        row.channel,
        row.paymentMethod,
        row.paymentStatus,
        row.fulfilmentType,
        row.flavors,
        row.weight,
        row.subtotal,
        row.extrasTotal,
        row.deliveryFee,
        row.total,
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  // A leading BOM so Excel renders the Bangla text in customer names and
  // icing messages correctly instead of garbling it as Latin-1.
  const csv = "﻿" + lines.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sales_report_${from}_to_${to}.csv"`,
    },
  });
}
