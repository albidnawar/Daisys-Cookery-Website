import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { requireModule, AdminAuthError } from "@/lib/admin/auth";
import {
  createOptionValueAdmin,
  listOptionValuesAdmin,
  OptionValueError,
  type OptionGroupCode,
} from "@/lib/admin/optionValuesAdmin";

const GROUP_CODES: OptionGroupCode[] = ["sponge", "cake_color", "extras"];

function parseGroupCode(value: string): OptionGroupCode | null {
  return (GROUP_CODES as string[]).includes(value) ? (value as OptionGroupCode) : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupCode: string }> },
) {
  try {
    await requireModule("content_media");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const { groupCode } = await params;
  const code = parseGroupCode(groupCode);
  if (!code) return NextResponse.json({ error: "Unknown option group" }, { status: 404 });
  const values = await listOptionValuesAdmin(code);
  return NextResponse.json({ values });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupCode: string }> },
) {
  try {
    await requireModule("content_media");
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    throw error;
  }
  const { groupCode } = await params;
  const code = parseGroupCode(groupCode);
  if (!code) return NextResponse.json({ error: "Unknown option group" }, { status: 404 });

  const { label, priceDelta } = (await request.json()) as { label: string; priceDelta?: number };
  if (!label?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  try {
    const id = await createOptionValueAdmin(code, label.trim(), priceDelta ?? 0);
    revalidateTag("catalog", { expire: 0 });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof OptionValueError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
