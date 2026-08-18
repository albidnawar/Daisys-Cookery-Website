import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, AdminAuthError } from "@/lib/admin/auth";
import {
  CakeInUseError,
  deleteCake,
  getCakeForEdit,
  updateCake,
  type CakeInput,
} from "@/lib/admin/catalogAdmin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const { id } = await params;
  const cake = await getCakeForEdit(id);
  if (!cake) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ cake });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const { id } = await params;
  const input = (await request.json()) as CakeInput;
  await updateCake(id, input);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const { id } = await params;
  try {
    await deleteCake(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CakeInUseError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
