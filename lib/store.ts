import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { OgLink, OgLinkInput } from "@/types/og-link";
import { randomSlug, slugify } from "@/lib/slug";
import { nanoid } from "nanoid";

/**
 * Storage backend
 * -----------------------------------------------------------------------
 * Vercel's serverless functions run on an ephemeral, read-only filesystem
 * (aside from /tmp, which is wiped between invocations and not shared
 * across instances). Writing to data/og-links.json works great for local
 * development, but it will NOT persist in production on Vercel.
 *
 * To keep the same code working in both places, this module auto-detects
 * its backend:
 *   - If KV_REST_API_URL / KV_REST_API_TOKEN are set (Vercel KV / Upstash
 *     Redis, added via the Vercel Storage tab), it uses that.
 *   - Otherwise it falls back to reading/writing data/og-links.json on
 *     disk, which is fine for `next dev` and for self-hosted deployments
 *     with a persistent filesystem.
 *
 * When you're ready for production on Vercel, create a KV database in the
 * Vercel dashboard, link it to the project, and redeploy - no code changes
 * needed.
 * -----------------------------------------------------------------------
 */

const DATA_FILE = path.join(process.cwd(), "data", "og-links.json");
const useKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// ---- local JSON file backend --------------------------------------------

let writeQueue: Promise<unknown> = Promise.resolve();

async function readAllLocal(): Promise<OgLink[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

async function writeAllLocal(links: OgLink[]): Promise<void> {
  // Serialize writes so concurrent admin requests can't clobber each other.
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(links, null, 2), "utf-8");
  });
  await writeQueue;
}

// ---- Vercel KV backend ----------------------------------------------------
// Keys:
//   oglink:index          -> Set of ids
//   oglink:record:{id}    -> JSON string of OgLink
//   oglink:slug:{slug}    -> id  (for O(1) slug lookup / uniqueness)

async function getKv() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

async function readAllKv(): Promise<OgLink[]> {
  const kv = await getKv();
  const ids = (await kv.smembers("oglink:index")) as string[];
  if (!ids.length) return [];
  const records = await Promise.all(ids.map((id) => kv.get<OgLink>(`oglink:record:${id}`)));
  return records.filter((r): r is OgLink => Boolean(r));
}

// ---- Public API -------------------------------------------------------

export async function listLinks(): Promise<OgLink[]> {
  const links = useKv ? await readAllKv() : await readAllLocal();
  return links.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getLinkBySlug(slug: string): Promise<OgLink | null> {
  if (useKv) {
    const kv = await getKv();
    const id = await kv.get<string>(`oglink:slug:${slug}`);
    if (!id) return null;
    return (await kv.get<OgLink>(`oglink:record:${id}`)) ?? null;
  }
  const links = await readAllLocal();
  return links.find((l) => l.slug === slug) ?? null;
}

export async function getLinkById(id: string): Promise<OgLink | null> {
  if (useKv) {
    const kv = await getKv();
    return (await kv.get<OgLink>(`oglink:record:${id}`)) ?? null;
  }
  const links = await readAllLocal();
  return links.find((l) => l.id === id) ?? null;
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await getLinkBySlug(slug);
  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;
  return true;
}

/** Generates a unique slug from an optional preferred value, retrying with random suffixes. */
export async function generateUniqueSlug(preferred?: string, titleHint?: string): Promise<string> {
  const base = slugify(preferred || titleHint || "") || randomSlug();

  if (!(await slugExists(base))) return base;

  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = `${base}-${randomSlug().slice(0, 4)}`;
    if (!(await slugExists(candidate))) return candidate;
  }
  // Extremely unlikely fallback.
  return `${base}-${nanoid(8)}`;
}

export async function createLink(input: OgLinkInput): Promise<OgLink> {
  const slug = await generateUniqueSlug(input.slug, input.title);
  const now = new Date().toISOString();
  const record: OgLink = {
    id: nanoid(12),
    slug,
    title: input.title.trim(),
    description: input.description.trim(),
    targetUrl: input.targetUrl.trim(),
    image: input.image,
    createdAt: now,
    updatedAt: now
  };

  if (useKv) {
    const kv = await getKv();
    await kv.set(`oglink:record:${record.id}`, record);
    await kv.set(`oglink:slug:${record.slug}`, record.id);
    await kv.sadd("oglink:index", record.id);
  } else {
    const links = await readAllLocal();
    links.push(record);
    await writeAllLocal(links);
  }

  return record;
}

export async function updateLink(id: string, input: Partial<OgLinkInput>): Promise<OgLink | null> {
  const existing = await getLinkById(id);
  if (!existing) return null;

  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    if (await slugExists(input.slug, id)) {
      throw new Error("SLUG_TAKEN");
    }
    slug = slugify(input.slug);
    if (!slug) throw new Error("INVALID_SLUG");
  }

  const updated: OgLink = {
    ...existing,
    slug,
    title: input.title?.trim() ?? existing.title,
    description: input.description?.trim() ?? existing.description,
    targetUrl: input.targetUrl?.trim() ?? existing.targetUrl,
    image: input.image ?? existing.image,
    updatedAt: new Date().toISOString()
  };

  if (useKv) {
    const kv = await getKv();
    if (slug !== existing.slug) {
      await kv.del(`oglink:slug:${existing.slug}`);
      await kv.set(`oglink:slug:${slug}`, id);
    }
    await kv.set(`oglink:record:${id}`, updated);
  } else {
    const links = await readAllLocal();
    const idx = links.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    links[idx] = updated;
    await writeAllLocal(links);
  }

  return updated;
}

export async function deleteLink(id: string): Promise<boolean> {
  const existing = await getLinkById(id);
  if (!existing) return false;

  if (useKv) {
    const kv = await getKv();
    await kv.del(`oglink:record:${id}`);
    await kv.del(`oglink:slug:${existing.slug}`);
    await kv.srem("oglink:index", id);
  } else {
    const links = await readAllLocal();
    const next = links.filter((l) => l.id !== id);
    await writeAllLocal(next);
  }

  return true;
}

export const storageBackend = useKv ? "vercel-kv" : "local-json";
