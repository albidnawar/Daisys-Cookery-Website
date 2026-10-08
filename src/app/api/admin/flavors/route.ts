import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { createFlavorAdmin, listFlavorsAdmin, TaxonomyInUseError } from "@/lib/admin/taxonomyAdmin";

export async function GET() {
  try {
    await requireModule("content_media");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const flavors = await listFlavorsAdmin();
  return NextResponse.json({ flavors });
}

export async function POST(request: NextRequest) {
  try {
    await requireModule("content_media");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const { name } = (await request.json()) as { name: string };
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  try {
    const id = await createFlavorAdmin(name.trim());
    revalidateTag("catalog", { expire: 0 });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof TaxonomyInUseError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
