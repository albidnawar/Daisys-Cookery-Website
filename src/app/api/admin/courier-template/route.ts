import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { getCourierTemplateSettings, updateCourierTemplateSettings } from "@/lib/admin/courierSettings";
import type { CourierTemplateSettings } from "@/lib/admin/courierSettings";

export async function GET() {
  try {
    await requireModule("courier_messages");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const settings = await getCourierTemplateSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  try {
    await requireModule("courier_messages");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const input = (await request.json()) as CourierTemplateSettings;
  await updateCourierTemplateSettings(input);
  return NextResponse.json({ ok: true });
}
