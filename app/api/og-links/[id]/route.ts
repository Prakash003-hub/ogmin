import { NextRequest, NextResponse } from "next/server";
import { deleteLink, getLinkById, updateLink } from "@/lib/store";
import { deleteOgImage, saveOgImage } from "@/lib/images";
import { isValidSlugFormat, slugify } from "@/lib/slug";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const link = await getLinkById(params.id);
  if (!link) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ link });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await getLinkById(params.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const form = await req.formData();
  const title = form.get("title") != null ? String(form.get("title")).trim() : undefined;
  const description = form.get("description") != null ? String(form.get("description")).trim() : undefined;
  const targetUrl = form.get("targetUrl") != null ? String(form.get("targetUrl")).trim() : undefined;
  const rawSlug = form.get("slug") != null ? String(form.get("slug")).trim() : undefined;
  const image = form.get("image");

  if (targetUrl) {
    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: "Target URL must be a valid, absolute URL." }, { status: 400 });
    }
  }

  if (rawSlug && !isValidSlugFormat(slugify(rawSlug))) {
    return NextResponse.json(
      { error: "Slug must be 3-64 characters: lowercase letters, numbers, and hyphens." },
      { status: 400 }
    );
  }

  let imageUrl: string | undefined;
  if (image instanceof File && image.size > 0) {
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
  }

  try {
    const updated = await updateLink(params.id, {
      title,
      description,
      targetUrl,
      slug: rawSlug,
      image: imageUrl
    });

    // Only remove the old image after a successful update, and only if it was replaced.
    if (imageUrl && existing.image && existing.image !== imageUrl) {
      await deleteOgImage(existing.image);
    }

    return NextResponse.json({ link: updated });
  } catch (err: any) {
    if (err?.message === "SLUG_TAKEN") {
      return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not update the link." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await getLinkById(params.id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await deleteLink(params.id);
  await deleteOgImage(existing.image);

  return NextResponse.json({ ok: true });
}
