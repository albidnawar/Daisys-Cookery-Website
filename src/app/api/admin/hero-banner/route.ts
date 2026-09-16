import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import {
  getHeroBannerForEdit,
  saveHeroBanner,
  type HeroBannerInput,
} from "@/lib/admin/heroBannerAdmin";

async function guard() {
  try {
    await requireModule("content_media");
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
  const heroBanner = await getHeroBannerForEdit();
  return NextResponse.json({ heroBanner });
}

export async function PUT(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const input = (await request.json()) as HeroBannerInput;
  await saveHeroBanner(input);
  return NextResponse.json({ ok: true });
}
