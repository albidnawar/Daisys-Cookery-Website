import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import {
  deleteOptionValueAdmin,
  updateOptionValueAdmin,
  OptionValueError,
} from "@/lib/admin/optionValuesAdmin";

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
  const { label, priceDelta } = (await request.json()) as { label: string; priceDelta?: number };
  if (!label?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  try {
    await updateOptionValueAdmin(id, label.trim(), priceDelta ?? 0);
    revalidateTag("catalog", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OptionValueError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
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
  await deleteOptionValueAdmin(id);
  revalidateTag("catalog", { expire: 0 });
  return NextResponse.json({ ok: true });
}
