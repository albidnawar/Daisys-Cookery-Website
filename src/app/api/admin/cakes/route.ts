import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import { createCake, listAllCakesAdmin, type CakeInput } from "@/lib/admin/catalogAdmin";

export async function GET() {
  try {
    await requireModule("content_media");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const cakes = await listAllCakesAdmin();
  return NextResponse.json({ cakes });
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
  const input = (await request.json()) as CakeInput;
  try {
    const id = await createCake(input);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("cakes_slug_key")) {
      return NextResponse.json(
        { error: `The slug "${input.slug}" is already used by another cake.` },
        { status: 400 },
      );
    }
    throw error;
  }
}
