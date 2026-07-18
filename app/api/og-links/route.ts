import { NextRequest, NextResponse } from "next/server";
import { createLink, listLinks } from "@/lib/store";
import { saveOgImage } from "@/lib/images";
import { isValidSlugFormat, slugify } from "@/lib/slug";

export const runtime = "nodejs";

export async function GET() {
  const links = await listLinks();
  return NextResponse.json({ links });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();

  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const targetUrl = String(form.get("targetUrl") ?? "").trim();
  const requestedSlug = String(form.get("slug") ?? "").trim();
  const image = form.get("image");

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!targetUrl) return NextResponse.json({ error: "Target URL is required." }, { status: 400 });

  try {
    new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Target URL must be a valid, absolute URL." }, { status: 400 });
  }

  if (requestedSlug && !isValidSlugFormat(slugify(requestedSlug))) {
    return NextResponse.json(
      { error: "Slug must be 3-64 characters: lowercase letters, numbers, and hyphens." },
      { status: 400 }
    );
  }

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "An OG image is required." }, { status: 400 });
  }

  let imageUrl: string;
  try {
    const saved = await saveOgImage(image);
    imageUrl = saved.url;
  } catch (err: any) {
    const message =
      err?.message === "UNSUPPORTED_TYPE"
        ? "Image must be PNG, JPEG, WEBP, or GIF."
        : err?.message === "FILE_TOO_LARGE"
        ? "Image must be 5MB or smaller."
        : "Could not save the uploaded image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const link = await createLink({
    title,
    description,
    targetUrl,
    image: imageUrl,
    slug: requestedSlug || undefined
  });

  return NextResponse.json({ link }, { status: 201 });
}
