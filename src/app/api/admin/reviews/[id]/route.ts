import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import {
  deleteReview,
  getReviewForEdit,
  updateReview,
  type ReviewInput,
} from "@/lib/admin/reviewsAdmin";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const review = await getReviewForEdit(id);
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ review });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const input = (await request.json()) as ReviewInput;
  await updateReview(id, input);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  await deleteReview(id);
  return NextResponse.json({ ok: true });
}
