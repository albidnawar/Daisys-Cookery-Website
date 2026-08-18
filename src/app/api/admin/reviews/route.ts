import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/admin/auth";
import { createReview, listAllReviewsAdmin, type ReviewInput } from "@/lib/admin/reviewsAdmin";

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
  const reviews = await listAllReviewsAdmin();
  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const input = (await request.json()) as ReviewInput;
  const id = await createReview(input);
  return NextResponse.json({ id }, { status: 201 });
}
