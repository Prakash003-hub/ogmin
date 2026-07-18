import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";

/**
 * Same rationale as lib/store.ts: Vercel's filesystem is read-only in
 * production, so uploaded OG images can't be written to /public at
 * request time. If BLOB_READ_WRITE_TOKEN is present (Vercel Blob storage,
 * added via the Vercel Storage tab), uploads go there and we get back a
 * permanent https URL. Otherwise, files are written to public/og/ for
 * local development.
 */

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const UPLOAD_DIR = path.join(process.cwd(), "public", "og");

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB - platforms like WhatsApp/FB cap OG images around this size

export interface StoredImage {
  url: string; // public URL to store on the record, e.g. "/og/xyz.jpg" or a blob URL
}

export async function saveOgImage(file: File): Promise<StoredImage> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("UNSUPPORTED_TYPE");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const filename = `${nanoid(10)}.${ext}`;

  if (useBlob) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`og/${filename}`, file, {
      access: "public",
      contentType: file.type
    });
    return { url: blob.url };
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return { url: `/og/${filename}` };
}

/** Best-effort delete; safe to ignore failures (e.g. file already gone). */
export async function deleteOgImage(url: string): Promise<void> {
  try {
    if (useBlob && url.includes("blob.vercel-storage.com")) {
      const { del } = await import("@vercel/blob");
      await del(url);
      return;
    }
    if (url.startsWith("/og/")) {
      await fs.unlink(path.join(process.cwd(), "public", url));
    }
  } catch {
    // non-fatal
  }
}
