import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isFreeEpisode, ownsSeries } from "@/lib/access";
import { formatDuration } from "@/lib/format";
import { Cover } from "@/components/Cover";
import { BuyBox } from "@/components/BuyBox";
import { Notice } from "@/components/Notice";
import { btn } from "@/lib/ui";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ erreur?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await prisma.series.findUnique({ where: { slug }, select: { title: true, tagline: true, coverUrl: true } });
  if (!s) return {};
  return { title: s.title, description: s.tagline, openGraph: s.coverUrl ? { images: [s.coverUrl] } : undefined };
}

export default async function SeriesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { erreur } = await searchParams;
  const user = await getCurrentUser();

  const series = await prisma.series.findUnique({
    where: { slug },
    include: { episodes: { orderBy: { number: "asc" }, select: { id: true, number: true, title: true, durationSec: true } } },
  });
  if (!series || (!series.published && !user?.isAdmin)) notFound();

  const owned = await ownsSeries(user, series.id);
  const first = series.episodes[0];

  return (
    <div className="grid gap-8 md:grid-cols-[280px_1fr]">
      <Cover title={series.title} url={series.coverUrl} className="mx-auto w-full max-w-[280px]" />

      <div>
        {erreur && <Notice kind="error">{erreur}</Notice>}
        {!series.published && <Notice kind="info">Brouillon : seuls les admins voient cette série.</Notice>}

        <h1 className="font-display text-3xl sm:text-4xl">{series.title}</h1>
        {series.tagline && <p className="mt-2 text-lg text-gold">{series.tagline}</p>}
        {series.synopsis && <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">{series.synopsis}</p>}

        <div className="mt-6 max-w-md">
          {owned ? (
            <div className="rounded-2xl border border-ok/40 bg-panel p-5">
              <p className="font-semibold text-ok">✓ Vous avez accès à toute la série</p>
              {first && (
                <Link href={`/serie/${series.slug}/episode/${first.number}`} className={`${btn} mt-4 w-full`}>
                  ▶ Regarder
                </Link>
              )}
            </div>
          ) : (
            <>
              {first && series.freeEpisodes > 0 && (
                <Link href={`/serie/${series.slug}/episode/${first.number}`} className={`${btn} mb-3 w-full`}>
                  ▶ Regarder l&apos;épisode 1 gratuitement
                </Link>
              )}
              <BuyBox seriesId={series.id} priceXof={series.priceXof} episodeCount={series.episodes.length} loggedIn={!!user} />
            </>
          )}
        </div>

        <h2 className="mb-3 mt-10 font-display text-xl">Épisodes</h2>
        {series.episodes.length === 0 ? (
          <p className="text-muted">Les épisodes arrivent bientôt.</p>
        ) : (
          <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {series.episodes.map((ep) => {
              const free = isFreeEpisode(ep.number, series.freeEpisodes);
              const open = owned || free;
              return (
                <li key={ep.id}>
                  <Link
                    href={`/serie/${series.slug}/episode/${ep.number}`}
                    className="flex items-center gap-3 bg-panel px-4 py-3 hover:bg-line/40"
                  >
                    <span className="w-8 shrink-0 text-center font-display text-lg text-muted">{ep.number}</span>
                    <span className="flex-1">{ep.title}</span>
                    {!owned && free && <span className="rounded bg-ok/15 px-2 py-0.5 text-xs text-ok">Gratuit</span>}
                    <span className="text-xs text-muted">{formatDuration(ep.durationSec)}</span>
                    <span aria-label={open ? "Disponible" : "Verrouillé"}>{open ? "▶" : "🔒"}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
