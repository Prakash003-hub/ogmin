import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">OG Link Generator</p>
      <h1 className="max-w-xl font-display text-3xl leading-snug">
        Create shareable links with custom social previews.
      </h1>
      <Link
        href="/admin/og-generator"
        className="focus-ring mt-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:bg-ink/85"
      >
        Open admin dashboard
      </Link>
    </main>
  );
}
