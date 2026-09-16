import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { createBanner, listAllBannersAdmin, type BannerInput } from "@/lib/admin/bannersAdmin";

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
  const banners = await listAllBannersAdmin();
  return NextResponse.json({ banners });
}

export async function POST(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const input = (await request.json()) as BannerInput;
  const id = await createBanner(input);
  return NextResponse.json({ id }, { status: 201 });
}
