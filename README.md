# OG Link Generator

An admin tool for creating shareable `/go/{slug}` links with custom Open
Graph metadata (image, title, description) that redirect visitors to any
target URL. Built with Next.js App Router, optimized for Vercel.

## How it works

1. An admin fills out the form at **`/admin/og-generator`**: uploads an
   image, writes a title/description, pastes any target URL, and gets an
   editable auto-generated slug.
2. Saving creates a record (`{ id, slug, title, description, targetUrl,
   image, createdAt, updatedAt }`) and a share link:
   `https://your-domain.com/go/{slug}`.
3. When that link is shared, social platforms (WhatsApp, Facebook,
   LinkedIn, Telegram, X, Discord, Slack, ...) crawl it, request the page,
   and read `<head>` metadata generated **server-side** by
   `generateMetadata()` in `app/go/[slug]/page.tsx` - no static files, no
   per-URL pages, just one dynamic route.
4. A real visitor's browser executes a small client component that
   immediately redirects to the stored target URL. Crawlers don't run
   JavaScript, so they only ever see the metadata-rich HTML; humans barely
   notice the hop. See the comment in `components/AutoRedirect.tsx` for why
   this is done client-side instead of via a server redirect.

## Folder structure

```
app/
  admin/og-generator/page.tsx   Admin dashboard (server page + client UI)
  go/[slug]/page.tsx            Dynamic OG + redirect route
  api/og-links/route.ts         GET (list) / POST (create)
  api/og-links/[id]/route.ts    GET / PUT (update) / DELETE
  api/slug-check/route.ts       Live slug-availability check
  layout.tsx                    Root layout, sets metadataBase
components/
  AdminDashboard.tsx            Client state orchestration
  OgLinkForm.tsx                Create/edit form incl. image upload + preview
  OgLinkList.tsx                Search, copy/preview/edit/delete
  OgPreviewCard.tsx             Simulated social-card preview
  AutoRedirect.tsx              Client-side redirect (see above)
  CopyButton.tsx
lib/
  store.ts                      Data layer (dual backend, see below)
  images.ts                     Image upload (dual backend, see below)
  slug.ts                       Slug generation/validation
  url.ts                        Canonical site URL resolution
types/
  og-link.ts
data/
  og-links.json                 Local dev storage (seeded as [])
public/og/                      Local dev image storage
```

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000/admin/og-generator`. Records are written to
`data/og-links.json` and images to `public/og/` - no configuration needed.

## Storage: local JSON vs. Vercel production

Vercel's serverless functions run on a **read-only, ephemeral** filesystem
(other than `/tmp`, which isn't shared across instances or requests). A
`fs.writeFile` to `data/og-links.json` at runtime works in `next dev` but
will silently fail to persist in production.

`lib/store.ts` and `lib/images.ts` handle this with an auto-detected dual
backend, so the exact same code runs in both places:

| Backend        | Used when...                                     | Records stored in            |
|-----------------|--------------------------------------------------|-------------------------------|
| Local JSON file | No KV env vars present (default, local dev)      | `data/og-links.json`          |
| Vercel KV       | `KV_REST_API_URL` + `KV_REST_API_TOKEN` are set  | Redis-compatible KV store     |

| Backend      | Used when...                          | Images stored in     |
|--------------|----------------------------------------|-----------------------|
| Local disk   | No `BLOB_READ_WRITE_TOKEN` (default)   | `public/og/`           |
| Vercel Blob  | `BLOB_READ_WRITE_TOKEN` is set         | Vercel Blob (public URL) |

**Before deploying to production on Vercel**, open the project's **Storage**
tab and add:
- **KV** (or connect any Upstash-Redis-compatible database) → env vars are
  auto-linked to the project.
- **Blob** → env var is auto-linked to the project.

No code changes are required - redeploy and the app switches backends
automatically. (If you'd rather use Postgres/Supabase/PlanetScale instead of
KV, swap the implementation inside `lib/store.ts`; every other file only
calls its exported functions like `listLinks`, `createLink`, etc.)

Also set **`NEXT_PUBLIC_SITE_URL`** to your production domain (e.g.
`https://your-domain.com`) so absolute `og:image`/`og:url` values are
correct. Without it, the app falls back to Vercel's `VERCEL_URL`.

## Verifying OG tags

After deploying, test a generated link with:
- Facebook Sharing Debugger - developers.facebook.com/tools/debug
- Twitter/X Card Validator
- LinkedIn Post Inspector
- opengraph.xyz for a quick multi-platform preview

Crawlers cache aggressively - use each platform's debugger to force a
re-scrape after editing a link.

## Notes

- Slugs are validated (`lowercase letters, numbers, hyphens`, 3-64 chars),
  auto-derived from the title, live-checked for availability as you type,
  and retried with a random suffix server-side on collision.
- `/go/{slug}` sets `robots: { index: false }` since it's a redirect
  utility, not content - the target page owns its own SEO.
- Target URLs accept anything absolute (`https://...`), internal or
  external - nothing is hardcoded.
