"use client";

import { useState } from "react";
import type { OgLink } from "@/types/og-link";
import OgLinkForm from "@/components/OgLinkForm";
import OgLinkList from "@/components/OgLinkList";
import CopyButton from "@/components/CopyButton";

export default function AdminDashboard({ initialLinks }: { initialLinks: OgLink[] }) {
  const [links, setLinks] = useState<OgLink[]>(initialLinks);
  const [editing, setEditing] = useState<OgLink | null>(null);
  const [lastCreated, setLastCreated] = useState<OgLink | null>(null);

  function handleSaved(link: OgLink, mode: "create" | "update") {
    if (mode === "create") {
      setLinks((prev) => [link, ...prev]);
      setLastCreated(link);
    } else {
      setLinks((prev) => prev.map((l) => (l.id === link.id ? link : l)));
      setEditing(null);
    }
  }

  function handleDeleted(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    if (editing?.id === id) setEditing(null);
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Admin · OG Link Generator</p>
        <h1 className="mt-1 font-display text-3xl">Shareable links with custom previews</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">
          Upload an image, write a title and description, and point it at any URL. Share the generated{" "}
          <code className="rounded bg-line/60 px-1.5 py-0.5 font-mono text-[13px]">/go/{"{slug}"}</code> link -
          WhatsApp, Facebook, LinkedIn, Telegram, X, and Discord will all show your custom preview before
          the visitor lands on the target page.
        </p>
      </header>

      {lastCreated && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-accent2/30 bg-accent2/5 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-accent2">Link generated</p>
            <p className="truncate font-mono text-sm text-ink">{`${origin}/go/${lastCreated.slug}`}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <CopyButton value={`${origin}/go/${lastCreated.slug}`} />
            <button
              onClick={() => setLastCreated(null)}
              className="focus-ring rounded-md px-2 py-1.5 text-xs text-ink/40 hover:text-ink"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <OgLinkForm editing={editing} onSaved={handleSaved} onCancelEdit={() => setEditing(null)} />
        <OgLinkList links={links} onEdit={setEditing} onDeleted={handleDeleted} />
      </div>
    </div>
  );
}
