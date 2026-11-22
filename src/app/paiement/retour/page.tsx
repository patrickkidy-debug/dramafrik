import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { syncOrder } from "@/lib/orders";
import { formatXof } from "@/lib/format";
import { btn, btnGhost, card } from "@/lib/ui";

export const metadata = { title: "Paiement" };

export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<{ commande?: string }> }) {
  const { commande } = await searchParams;
  if (!commande) notFound();
  const user = await requireUser(`/paiement/retour?commande=${commande}`);

  const order = await prisma.order.findUnique({ where: { id: commande }, include: { series: true } });
  if (!order || order.userId !== user.id) notFound();

  const status = (await syncOrder(order.id)) ?? "PENDING";
  const seriesPage = `/serie/${order.series.slug}`;

  return (
    <div className={`${card} mx-auto max-w-md text-center`}>
      {status === "PAID" && (
        <>
          <p className="text-5xl">🎉</p>
          <h1 className="mt-3 font-display text-2xl">Paiement réussi !</h1>
          <p className="mt-2 text-muted">
            <strong className="text-sand">{order.series.title}</strong> est maintenant à vous, en entier.
          </p>
          <Link href={`${seriesPage}/episode/1`} className={`${btn} mt-6 w-full`}>▶ Regarder maintenant</Link>
        </>
      )}

      {status === "PENDING" && (
        <>
          {/* La page se recharge toute seule jusqu'à confirmation du paiement */}
          <meta httpEquiv="refresh" content="5" />
          <p className="text-5xl">⏳</p>
          <h1 className="mt-3 font-display text-2xl">Paiement en cours de confirmation…</h1>
          <p className="mt-2 text-sm text-muted">
            Validez le paiement de {formatXof(order.amountXof)} sur votre téléphone. Cette page se met à jour toute seule.
          </p>
          <Link href={seriesPage} className={`${btnGhost} mt-6 w-full`}>Retour à la série</Link>
        </>
      )}

      {status === "FAILED" && (
        <>
          <p className="text-5xl">😕</p>
          <h1 className="mt-3 font-display text-2xl">Le paiement n&apos;a pas abouti</h1>
          <p className="mt-2 text-sm text-muted">Aucun montant n&apos;a été débité pour cette série. Vous pouvez réessayer.</p>
          <Link href={seriesPage} className={`${btn} mt-6 w-full`}>Réessayer</Link>
        </>
      )}
    </div>
  );
}
