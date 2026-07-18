"use client";

import { useState } from "react";

export default function CopyButton({ value, label = "Copy link" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API can fail (permissions/insecure context) - fail silently, link is still selectable.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="focus-ring rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:border-ink/30"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
