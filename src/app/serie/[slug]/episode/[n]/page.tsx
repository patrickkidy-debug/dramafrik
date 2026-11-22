import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isFreeEpisode, ownsSeries } from "@/lib/access";
import { playbackFor } from "@/lib/video";
import { BuyBox } from "@/components/BuyBox";
import { btnGhost } from "@/lib/ui";

type Props = { params: Promise<{ slug: string; n: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, n } = await params;
  const s = await prisma.series.findUnique({ where: { slug }, select: { title: true } });
  return s ? { title: `${s.title} · Épisode ${n}` } : {};
}

export default async function EpisodePage({ params }: Props) {
  const { slug, n } = await params;
  const number = Number(n);
  if (!Number.isInteger(number) || number < 1) notFound();

  const user = await getCurrentUser();
  const series = await prisma.series.findUnique({
    where: { slug },
    include: { episodes: { orderBy: { number: "asc" }, select: { number: true } } },
  });
  if (!series || (!series.published && !user?.isAdmin)) notFound();

  const episode = await prisma.episode.findUnique({
    where: { seriesId_number: { seriesId: series.id, number } },
  });
  if (!episode) notFound();

  const owned = await ownsSeries(user, series.id);
  const canWatch = owned || isFreeEpisode(number, series.freeEpisodes);
  const playback = canWatch ? playbackFor(episode) : null;

  const idx = series.episodes.findIndex((e) => e.number === number);
  const prev = series.episodes[idx - 1];
  const next = series.episodes[idx + 1];
  const base = `/serie/${series.slug}`;

  return (
    <div className="mx-auto max-w-md">
      <Link href={base} className="text-sm text-muted hover:text-gold">← {series.title}</Link>
      <h1 className="mb-4 mt-2 font-display text-2xl">
        Épisode {episode.number} · {episode.title}
      </h1>

      {canWatch ? (
        <div className="aspect-[9/16] w-full overflow-hidden rounded-2xl border border-line bg-black">
          {playback?.kind === "iframe" && (
            <iframe
              src={playback.src}
              title={episode.title}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          )}
          {playback?.kind === "video" && (
            <video
              src={playback.src}
              controls
              autoPlay
              playsInline
              preload="metadata"
              controlsList="nodownload"
              className="h-full w-full object-contain"
            />
          )}
          {!playback && <p className="p-6 text-center text-muted">Vidéo bientôt disponible.</p>}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-panel p-6 text-center">
          <p className="text-4xl">🔒</p>
          <p className="mt-3 font-display text-xl">La suite vous attend…</p>
          <p className="mt-2 text-sm text-muted">
            Débloquez tous les épisodes de <strong className="text-sand">{series.title}</strong> en un seul paiement.
          </p>
          <div className="mt-5 text-left">
            <BuyBox seriesId={series.id} priceXof={series.priceXof} episodeCount={series.episodes.length} loggedIn={!!user} />
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        {prev ? <Link href={`${base}/episode/${prev.number}`} className={`${btnGhost} flex-1`}>← Épisode {prev.number}</Link> : <span className="flex-1" />}
        {next && <Link href={`${base}/episode/${next.number}`} className={`${btnGhost} flex-1`}>Épisode {next.number} →</Link>}
      </div>
    </div>
  );
}
