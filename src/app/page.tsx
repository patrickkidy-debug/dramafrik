import Link from "next/link";
import { prisma } from "@/lib/db";
import { Cover } from "@/components/Cover";
import { formatXof, MIN_PRICE } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const series = await prisma.series.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { episodes: true } } },
  });
  const fromPrice = series.length ? Math.min(...series.map((s) => s.priceXof)) : MIN_PRICE;

  return (
    <>
      <section className="mb-10 overflow-hidden rounded-2xl border border-line bg-linear-to-br from-ember/30 via-panel to-ink p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Séries drama africaines</p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-5xl">
          Amour, trahison, héritage. La série complète dès {formatXof(fromPrice)}.
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          Les premiers épisodes sont gratuits. Payez la suite avec Wave, Orange Money, MTN, Moov ou par carte, et
          regardez tout de suite sur votre téléphone.
        </p>
      </section>

      <h2 className="mb-4 font-display text-2xl">Toutes les séries</h2>
      {series.length === 0 ? (
        <p className="text-muted">Aucune série pour le moment. Revenez bientôt !</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {series.map((s) => (
            <li key={s.id}>
              <Link href={`/serie/${s.slug}`} className="group block">
                <Cover title={s.title} url={s.coverUrl} className="transition group-hover:-translate-y-1 group-hover:border-gold/60" />
                <h3 className="mt-2 font-semibold leading-tight group-hover:text-gold">{s.title}</h3>
                <p className="text-sm text-muted">
                  {s._count.episodes} épisodes · <span className="text-gold">{formatXof(s.priceXof)}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
