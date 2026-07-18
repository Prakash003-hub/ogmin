import { customAlphabet } from "nanoid";

// Lowercase letters + digits, no ambiguous chars (0/O, 1/l/I) -> friendly, short, URL-safe slugs.
const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
const generate = customAlphabet(alphabet, 7);

/** Turn a human title into a URL-safe base slug, e.g. "Big Sale! 50% Off" -> "big-sale-50-off" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** A short random slug, used when no title-derived slug is available or as a fallback suffix. */
export function randomSlug(): string {
  return generate();
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlugFormat(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 64 && SLUG_PATTERN.test(slug);
}
