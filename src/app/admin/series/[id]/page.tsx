import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { addEpisode, deleteEpisode, updateSeries } from "@/app/actions/admin";
import { formatDuration } from "@/lib/format";
import { SeriesForm } from "@/components/SeriesForm";
import { Notice } from "@/components/Notice";
import { btn, card, input, label } from "@/lib/ui";

export const metadata = { title: "Modifier la série" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ erreur?: string; ok?: string }> };

export default async function AdminSeriesPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const { erreur, ok } = await searchParams;

  const series = await prisma.series.findUnique({
    where: { id },
    include: { episodes: { orderBy: { number: "asc" } } },
  });
  if (!series) notFound();
  const nextNumber = (series.episodes.at(-1)?.number ?? 0) + 1;

  return (
    <div className="grid gap-8">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-gold">← Tableau de bord</Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="font-display text-3xl">{series.title}</h1>
          <Link href={`/serie/${series.slug}`} className="text-sm text-gold hover:underline">Voir la page publique ↗</Link>
        </div>
      </div>
      {erreur && <Notice kind="error">{erreur}</Notice>}
      {ok && <Notice kind="ok">{ok}</Notice>}

      <section className={card}>
        <h2 className="mb-3 font-display text-xl">Épisodes ({series.episodes.length})</h2>
        {series.episodes.length > 0 && (
          <ol className="mb-6 divide-y divide-line rounded-xl border border-line">
            {series.episodes.map((ep) => (
              <li key={ep.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="w-6 text-center font-display text-muted">{ep.number}</span>
                <span className="flex-1">
                  {ep.title}
                  <span className="block text-xs text-muted">
                    {ep.videoId ? `Bunny : ${ep.videoId}` : ep.videoUrl}
                    {ep.number <= series.freeEpisodes && " · gratuit"}
                  </span>
                </span>
                <span className="text-xs text-muted">{formatDuration(ep.durationSec)}</span>
                <form action={deleteEpisode}>
                  <input type="hidden" name="id" value={ep.id} />
                  <button className="text-xs text-bad hover:underline">Supprimer</button>
                </form>
              </li>
            ))}
          </ol>
        )}

        <h3 className="mb-3 font-semibold">Ajouter un épisode</h3>
        <form action={addEpisode} className="grid gap-3 sm:grid-cols-6">
          <input type="hidden" name="seriesId" value={series.id} />
          <div className="sm:col-span-1">
            <label className={label} htmlFor="number">N°</label>
            <input id="number" name="number" type="number" min={1} required defaultValue={nextNumber} className={input} />
          </div>
          <div className="sm:col-span-5">
            <label className={label} htmlFor="ep-title">Titre</label>
            <input id="ep-title" name="title" required className={input} />
          </div>
          <div className="sm:col-span-3">
            <label className={label} htmlFor="videoId">ID vidéo Bunny Stream</label>
            <input id="videoId" name="videoId" placeholder="ex. 3f2a…-…" className={input} />
          </div>
          <div className="sm:col-span-3">
            <label className={label} htmlFor="videoUrl">ou lien direct .mp4</label>
            <input id="videoUrl" name="videoUrl" type="url" placeholder="https://…" className={input} />
          </div>
          <div className="sm:col-span-1">
            <label className={label} htmlFor="minutes">Min</label>
            <input id="minutes" name="minutes" type="number" min={0} defaultValue={1} className={input} />
          </div>
          <div className="sm:col-span-1">
            <label className={label} htmlFor="seconds">Sec</label>
            <input id="seconds" name="seconds" type="number" min={0} max={59} defaultValue={30} className={input} />
          </div>
          <div className="flex items-end sm:col-span-4">
            <button className={btn}>Ajouter l&apos;épisode</button>
          </div>
        </form>
      </section>

      <section className={card}>
        <h2 className="mb-4 font-display text-xl">Informations de la série</h2>
        <SeriesForm action={updateSeries} series={series} submitLabel="Enregistrer" />
      </section>
    </div>
  );
}
