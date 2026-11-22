import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createSeries } from "@/app/actions/admin";
import { isSimulation } from "@/lib/payments";
import { formatDate, formatXof } from "@/lib/format";
import { SeriesForm } from "@/components/SeriesForm";
import { Notice } from "@/components/Notice";
import { card } from "@/lib/ui";

export const metadata = { title: "Admin" };

const STATUS: Record<string, string> = { PAID: "text-ok", PENDING: "text-gold", FAILED: "text-bad" };
const STATUS_FR: Record<string, string> = { PAID: "Payé", PENDING: "En attente", FAILED: "Échoué" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  await requireAdmin();
  const { erreur } = await searchParams;

  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [total, month, customers, series, revenueBySeries, orders] = await Promise.all([
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { amountXof: true }, _count: true }),
    prisma.order.aggregate({ where: { status: "PAID", paidAt: { gte: since } }, _sum: { amountXof: true }, _count: true }),
    prisma.user.count({ where: { isAdmin: false } }),
    prisma.series.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { episodes: true, purchases: true } } } }),
    prisma.order.groupBy({ by: ["seriesId"], where: { status: "PAID" }, _sum: { amountXof: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { user: { select: { name: true, phone: true } }, series: { select: { title: true } } },
    }),
  ]);
  const revenue = new Map(revenueBySeries.map((r) => [r.seriesId, r._sum.amountXof ?? 0]));

  return (
    <div className="grid gap-8">
      <h1 className="font-display text-3xl">Tableau de bord</h1>
      {erreur && <Notice kind="error">{erreur}</Notice>}
      {isSimulation() && (
        <Notice kind="info">
          Mode test actif : les paiements sont simulés. Mettez <code>PAYMENT_MODE=&quot;live&quot;</code> et vos clés Wave/CinetPay dans <code>.env</code> pour encaisser.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ventes totales" value={formatXof(total._sum.amountXof ?? 0)} sub={`${total._count} achats`} />
        <Stat label="30 derniers jours" value={formatXof(month._sum.amountXof ?? 0)} sub={`${month._count} achats`} />
        <Stat label="Clients inscrits" value={String(customers)} />
        <Stat label="Séries" value={String(series.length)} sub={`${series.filter((s) => s.published).length} publiées`} />
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl">Mes séries</h2>
        {series.length === 0 ? (
          <p className="text-muted">Aucune série. Créez la première ci-dessous.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-panel text-left text-muted">
                <tr>
                  <th className="px-3 py-2">Série</th>
                  <th className="px-3 py-2">Prix</th>
                  <th className="px-3 py-2">Épisodes</th>
                  <th className="px-3 py-2">Ventes</th>
                  <th className="px-3 py-2">Recettes</th>
                  <th className="px-3 py-2">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {series.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2"><Link href={`/admin/series/${s.id}`} className="font-medium text-gold hover:underline">{s.title}</Link></td>
                    <td className="px-3 py-2">{formatXof(s.priceXof)}</td>
                    <td className="px-3 py-2">{s._count.episodes}</td>
                    <td className="px-3 py-2">{s._count.purchases}</td>
                    <td className="px-3 py-2">{formatXof(revenue.get(s.id) ?? 0)}</td>
                    <td className="px-3 py-2">{s.published ? <span className="text-ok">Publiée</span> : <span className="text-muted">Brouillon</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-4 font-display text-xl">Nouvelle série</h2>
        <SeriesForm action={createSeries} submitLabel="Créer la série" />
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">Dernières commandes</h2>
        {orders.length === 0 ? (
          <p className="text-muted">Aucune commande pour l&apos;instant.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-panel text-left text-muted">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Série</th>
                  <th className="px-3 py-2">Montant</th>
                  <th className="px-3 py-2">Moyen</th>
                  <th className="px-3 py-2">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-muted">{formatDate(o.createdAt)}</td>
                    <td className="px-3 py-2">{o.user.name}<span className="block text-xs text-muted">{o.user.phone}</span></td>
                    <td className="px-3 py-2">{o.series.title}</td>
                    <td className="whitespace-nowrap px-3 py-2">{formatXof(o.amountXof)}</td>
                    <td className="px-3 py-2 capitalize">{o.provider}</td>
                    <td className={`px-3 py-2 ${STATUS[o.status] ?? ""}`}>{STATUS_FR[o.status] ?? o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-xl text-gold sm:text-2xl">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
