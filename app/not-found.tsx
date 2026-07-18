import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-warn">404</p>
      <h1 className="font-display text-2xl">This link doesn't exist, or it's been removed.</h1>
      <Link href="/" className="focus-ring text-sm underline underline-offset-4">
        Back home
      </Link>
    </main>
  );
}
