import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { listCourierMessageOrders, buildCourierMessage } from "@/lib/admin/courierMessages";
import { getCourierTemplateSettings } from "@/lib/admin/courierSettings";

export async function GET(request: NextRequest) {
  try {
    await requireModule("courier_messages");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }

  const date = request.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const [orders, template] = await Promise.all([
    listCourierMessageOrders(date),
    getCourierTemplateSettings(),
  ]);

  const messages = orders.map((order, index) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerPhone: order.customerPhone,
    hasRiderPickupTime: order.riderPickupTime !== null,
    message: buildCourierMessage(template, order, date, index + 1),
  }));

  return NextResponse.json({ messages });
}
