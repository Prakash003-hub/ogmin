import { NextRequest, NextResponse } from "next/server";
import { slugExists } from "@/lib/store";
import { isValidSlugFormat, slugify } from "@/lib/slug";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slugParam = req.nextUrl.searchParams.get("slug") ?? "";
  const excludeId = req.nextUrl.searchParams.get("excludeId") ?? undefined;
  const slug = slugify(slugParam);

  if (!isValidSlugFormat(slug)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const taken = await slugExists(slug, excludeId);
  return NextResponse.json({ available: !taken, slug });
}
