import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLinkBySlug } from "@/lib/store";
import AutoRedirect from "@/components/AutoRedirect";

export const runtime = "nodejs";
// Always hit the store fresh - links are created/edited/deleted from the admin panel at any time.
export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const link = await getLinkBySlug(params.slug);

  if (!link) {
    return { title: "Link not found" };
  }

  const shareUrl = `/go/${link.slug}`;

  return {
    title: link.title,
    description: link.description,
    // Keep redirect utility pages out of search results - the target page owns SEO for its own content.
    robots: { index: false, follow: false },
    openGraph: {
      title: link.title,
      description: link.description,
      url: shareUrl,
      type: "website",
      images: [{ url: link.image }]
    },
    twitter: {
      card: "summary_large_image",
      title: link.title,
      description: link.description,
      images: [link.image]
    }
  };
}

export default async function GoPage({ params }: Props) {
  const link = await getLinkBySlug(params.slug);

  if (!link) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6 text-center text-paper">
      <AutoRedirect targetUrl={link.targetUrl} />

      <div className="h-8 w-8 animate-spin rounded-full border-2 border-paper/25 border-t-paper" />

      <div className="max-w-md space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-paper/50">Redirecting</p>
        <h1 className="font-display text-xl">{link.title}</h1>
        <p className="text-sm text-paper/70">Taking you to your destination…</p>
      </div>

      <noscript>
        <p className="text-sm">
          JavaScript is disabled.{" "}
          <a className="underline" href={link.targetUrl}>
            Continue to {link.targetUrl}
          </a>
        </p>
      </noscript>
    </main>
  );
}
