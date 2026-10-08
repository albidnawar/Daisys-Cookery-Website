import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { createOccasion, listOccasionsAdmin, TaxonomyInUseError } from "@/lib/admin/taxonomyAdmin";

export async function GET() {
  try {
    await requireModule("content_media");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const occasions = await listOccasionsAdmin();
  return NextResponse.json({ occasions });
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
  const { label } = (await request.json()) as { label: string };
  if (!label?.trim()) return NextResponse.json({ error: "Label is required" }, { status: 400 });
  try {
    const code = await createOccasion(label.trim());
    revalidateTag("catalog", { expire: 0 });
    return NextResponse.json({ code }, { status: 201 });
  } catch (error) {
    if (error instanceof TaxonomyInUseError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
