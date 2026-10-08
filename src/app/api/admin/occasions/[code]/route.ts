import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { deleteOccasion, updateOccasionLabel, TaxonomyInUseError } from "@/lib/admin/taxonomyAdmin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    await requireModule("content_media");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const { code } = await params;
  const { label } = (await request.json()) as { label: string };
  if (!label?.trim()) return NextResponse.json({ error: "Label is required" }, { status: 400 });
  await updateOccasionLabel(code, label.trim());
  revalidateTag("catalog", { expire: 0 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    await requireModule("content_media");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const { code } = await params;
  try {
    await deleteOccasion(code);
    revalidateTag("catalog", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TaxonomyInUseError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
