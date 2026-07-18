interface Props {
  image: string | null;
  title: string;
  description: string;
  domain: string;
}

export default function OgPreviewCard({ image, title, description, domain }: Props) {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl2 border border-line bg-white shadow-sm">
      <div className="aspect-[1.91/1] w-full bg-line/60">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink/40">
            No image yet
          </div>
        )}
      </div>
      <div className="space-y-1 border-t border-line px-3 py-2.5">
        <p className="truncate font-mono text-[11px] uppercase tracking-wide text-ink/45">
          {domain || "your-domain.com"}
        </p>
        <p className="truncate text-sm font-semibold text-ink">{title || "Untitled link"}</p>
        <p className="line-clamp-2 text-xs text-ink/60">{description || "No description yet."}</p>
      </div>
    </div>
  );
}
