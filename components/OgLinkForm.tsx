"use client";

import { useEffect, useRef, useState } from "react";
import type { OgLink } from "@/types/og-link";
import OgPreviewCard from "@/components/OgPreviewCard";

function slugifyClient(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

interface Props {
  editing: OgLink | null;
  onSaved: (link: OgLink, mode: "create" | "update") => void;
  onCancelEdit: () => void;
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function OgLinkForm({ editing, onSaved, onCancelEdit }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout>>();

  const isEditing = Boolean(editing);

  // Populate the form when an "edit" is requested from the list.
  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description);
      setTargetUrl(editing.targetUrl);
      setSlug(editing.slug);
      setSlugTouched(true);
      setImageFile(null);
      setImagePreview(editing.image);
      setSlugStatus("idle");
      setError(null);
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  // Auto-derive the slug from the title until the admin edits it manually.
  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugifyClient(title));
    }
  }, [title, slugTouched]);

  // Debounced live slug-availability check.
  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    clearTimeout(slugCheckTimer.current);
    slugCheckTimer.current = setTimeout(async () => {
      setSlugStatus("checking");
      try {
        const params = new URLSearchParams({ slug });
        if (editing) params.set("excludeId", editing.id);
        const res = await fetch(`/api/slug-check?${params.toString()}`);
        const data = await res.json();
        if (data.reason === "invalid") setSlugStatus("invalid");
        else setSlugStatus(data.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 400);
    return () => clearTimeout(slugCheckTimer.current);
  }, [slug, editing]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setTargetUrl("");
    setSlug("");
    setSlugTouched(false);
    setSlugStatus("idle");
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : editing?.image ?? null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !targetUrl.trim()) {
      setError("Title and Target URL are required.");
      return;
    }
    if (!isEditing && !imageFile) {
      setError("Please upload an OG image.");
      return;
    }
    if (slugStatus === "taken") {
      setError("That slug is already taken - choose another.");
      return;
    }

    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("targetUrl", targetUrl);
    if (slug) formData.set("slug", slug);
    if (imageFile) formData.set("image", imageFile);

    setSubmitting(true);
    try {
      const res = await fetch(isEditing ? `/api/og-links/${editing!.id}` : "/api/og-links", {
        method: isEditing ? "PUT" : "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      onSaved(data.link, isEditing ? "update" : "create");
      resetForm();
    } catch {
      setError("Network error - please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const domain = typeof window !== "undefined" ? window.location.host : "your-domain.com";

  return (
    <div className="rounded-xl2 border border-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg">{isEditing ? "Edit link" : "Generate a new link"}</h2>
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="focus-ring text-xs text-ink/50 underline underline-offset-4 hover:text-ink"
          >
            Cancel edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/70">OG Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageChange}
            className="focus-ring block w-full cursor-pointer rounded-md border border-line bg-paper text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-xs file:font-medium file:text-paper"
          />
          <p className="mt-1 text-[11px] text-ink/45">
            Recommended 1200×630px. PNG, JPEG, WEBP, or GIF, up to 5MB.
            {isEditing && " Leave empty to keep the current image."}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/70">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 50% off summer sale"
            className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
            maxLength={90}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/70">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short line that shows under the title on social platforms."
            rows={3}
            className="focus-ring w-full resize-none rounded-md border border-line px-3 py-2 text-sm"
            maxLength={200}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/70">Target URL</label>
          <input
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://your-domain.com/news/123"
            className="focus-ring w-full rounded-md border border-line px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-[11px] text-ink/45">Any internal or external URL. Visitors land here after the preview.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/70">Slug</label>
          <div className="flex items-center gap-2 rounded-md border border-line px-3 py-2 font-mono text-sm">
            <span className="shrink-0 text-ink/40">/go/</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugifyClient(e.target.value));
              }}
              placeholder="auto-generated"
              className="w-full bg-transparent outline-none"
            />
          </div>
          <SlugStatusHint status={slugStatus} />
        </div>

        {error && <p className="rounded-md bg-warn/10 px-3 py-2 text-xs text-warn">{error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting || slugStatus === "checking" || slugStatus === "taken"}
            className="focus-ring rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving…" : isEditing ? "Save changes" : "Generate Link"}
          </button>
        </div>
      </form>

      <div className="mt-5 border-t border-line pt-4">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink/45">Live preview</p>
        <OgPreviewCard image={imagePreview} title={title} description={description} domain={domain} />
      </div>
    </div>
  );
}

function SlugStatusHint({ status }: { status: SlugStatus }) {
  if (status === "idle") return null;
  const copy: Record<Exclude<SlugStatus, "idle">, { text: string; className: string }> = {
    checking: { text: "Checking availability…", className: "text-ink/45" },
    available: { text: "Available", className: "text-accent2" },
    taken: { text: "Already taken - try another", className: "text-warn" },
    invalid: { text: "Use 3-64 lowercase letters, numbers, hyphens", className: "text-warn" }
  };
  const item = copy[status];
  return <p className={`mt-1 text-[11px] ${item.className}`}>{item.text}</p>;
}
