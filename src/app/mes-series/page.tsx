import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Cover } from "@/components/Cover";

export const metadata = { title: "Mes séries" };

export default async function MySeriesPage() {
  const user = await requireUser("/mes-series");
  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { series: { include: { _count: { select: { episodes: true } } } } },
  });

  return (
    <>
      <h1 className="mb-6 font-display text-3xl">Mes séries</h1>
      {purchases.length === 0 ? (
        <p className="text-muted">
          Vous n&apos;avez encore acheté aucune série.{" "}
          <Link href="/" className="text-gold hover:underline">Voir le catalogue</Link>
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {purchases.map(({ series }) => (
            <li key={series.id}>
              <Link href={`/serie/${series.slug}`} className="group block">
                <Cover title={series.title} url={series.coverUrl} />
                <h3 className="mt-2 font-semibold group-hover:text-gold">{series.title}</h3>
                <p className="text-sm text-muted">{series._count.episodes} épisodes</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
