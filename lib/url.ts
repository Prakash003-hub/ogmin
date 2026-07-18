/**
 * Resolves the canonical site URL so absolute URLs (required by social
 * crawlers for og:image, og:url, etc.) are correct in every environment:
 *  - Set NEXT_PUBLIC_SITE_URL explicitly for your production domain
 *    (recommended - custom domains aren't knowable from VERCEL_URL).
 *  - Falls back to Vercel's auto-populated VERCEL_URL on preview/prod
 *    deployments.
 *  - Falls back to localhost for local development.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
