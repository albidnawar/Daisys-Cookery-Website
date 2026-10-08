import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { deleteFlavorAdmin, updateFlavorAdmin, TaxonomyInUseError } from "@/lib/admin/taxonomyAdmin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireModule("content_media");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const { id } = await params;
  const { name } = (await request.json()) as { name: string };
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  await updateFlavorAdmin(id, name.trim());
  revalidateTag("catalog", { expire: 0 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireModule("content_media");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const { id } = await params;
  try {
    await deleteFlavorAdmin(id);
    revalidateTag("catalog", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TaxonomyInUseError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
