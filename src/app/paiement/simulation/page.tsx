import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isSimulation } from "@/lib/payments";
import { simulateFailed, simulatePaid } from "@/app/actions/checkout";
import { formatXof } from "@/lib/format";
import { btn, btnGhost, card } from "@/lib/ui";

export const metadata = { title: "Paiement (test)" };

export default async function SimulationPage({ searchParams }: { searchParams: Promise<{ commande?: string }> }) {
  if (!isSimulation()) notFound();
  const { commande } = await searchParams;
  if (!commande) notFound();
  const user = await requireUser(`/paiement/simulation?commande=${commande}`);
  const order = await prisma.order.findUnique({ where: { id: commande }, include: { series: true } });
  if (!order || order.userId !== user.id) notFound();

  return (
    <div className={`${card} mx-auto max-w-md text-center`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-gold">Mode test · aucun argent débité</p>
      <h1 className="mt-3 font-display text-2xl">{order.series.title}</h1>
      <p className="mt-1 font-display text-3xl text-gold">{formatXof(order.amountXof)}</p>
      <p className="mt-3 text-sm text-muted">
        Ici, le vrai site enverra le client sur Wave ou CinetPay. Choisissez le résultat à simuler :
      </p>
      <div className="mt-6 grid gap-2">
        <form action={simulatePaid}>
          <input type="hidden" name="orderId" value={order.id} />
          <button className={`${btn} w-full`}>✓ Simuler un paiement réussi</button>
        </form>
        <form action={simulateFailed}>
          <input type="hidden" name="orderId" value={order.id} />
          <button className={`${btnGhost} w-full`}>✗ Simuler un échec</button>
        </form>
      </div>
    </div>
  );
}
