export function Cover({ title, url, className = "" }: { title: string; url: string; className?: string }) {
  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-xl border border-line bg-panel ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={title} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-end bg-linear-to-br from-ember/80 via-panel to-ink p-3">
          <span className="font-display text-lg leading-tight">{title}</span>
        </div>
      )}
    </div>
  );
}
