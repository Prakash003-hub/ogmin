"use client";

import { useMemo, useState } from "react";
import type { OgLink } from "@/types/og-link";
import CopyButton from "@/components/CopyButton";

interface Props {
  links: OgLink[];
  onEdit: (link: OgLink) => void;
  onDeleted: (id: string) => void;
}

export default function OgLinkList({ links, onEdit, onDeleted }: Props) {
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return links;
    return links.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.slug.toLowerCase().includes(q) ||
        l.targetUrl.toLowerCase().includes(q)
    );
  }, [links, query]);

  async function handleDelete(link: OgLink) {
    if (!confirm(`Delete "${link.title}"? This can't be undone.`)) return;
    setDeletingId(link.id);
    try {
      const res = await fetch(`/api/og-links/${link.id}`, { method: "DELETE" });
      if (res.ok) onDeleted(link.id);
      else alert("Could not delete this link. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-xl2 border border-line bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg">Generated links</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, slug, or URL…"
          className="focus-ring w-full max-w-xs rounded-md border border-line px-3 py-1.5 text-sm sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-sm text-ink/45">
          {links.length === 0 ? "No links yet - generate your first one above." : "No links match your search."}
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {filtered.map((link) => {
            const shareUrl = `${origin}/go/${link.slug}`;
            return (
              <li key={link.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={link.image}
                  alt=""
                  className="h-16 w-28 shrink-0 rounded-md border border-line object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{link.title}</p>
                  <p className="truncate text-xs text-ink/55">{link.description || "No description"}</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-accent">/go/{link.slug}</p>
                  <p className="truncate text-[11px] text-ink/40">→ {link.targetUrl}</p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <CopyButton value={shareUrl} />
                  <a
                    href={`/go/${link.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:border-ink/30"
                  >
                    Preview
                  </a>
                  <button
                    type="button"
                    onClick={() => onEdit(link)}
                    className="focus-ring rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:border-ink/30"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(link)}
                    disabled={deletingId === link.id}
                    className="focus-ring rounded-md border border-warn/30 bg-warn/5 px-3 py-1.5 text-xs font-medium text-warn transition hover:border-warn/50 disabled:opacity-50"
                  >
                    {deletingId === link.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
