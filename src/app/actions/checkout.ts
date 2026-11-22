"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ownsSeries } from "@/lib/access";
import { appUrl, getEnabledProvider, isSimulation } from "@/lib/payments";
import { markOrderPaid } from "@/lib/orders";

export async function startCheckout(formData: FormData) {
  const seriesId = String(formData.get("seriesId") ?? "");
  const providerId = String(formData.get("provider") ?? "");

  const series = await prisma.series.findUnique({ where: { id: seriesId } });
  if (!series || !series.published) redirect("/");
  const seriesPage = `/serie/${series.slug}`;

  const user = await getCurrentUser();
  if (!user) redirect(`/inscription?suite=${encodeURIComponent(seriesPage)}`);
  if (await ownsSeries(user, series.id)) redirect(seriesPage);

  const provider = getEnabledProvider(providerId);
  if (!provider) redirect(`${seriesPage}?erreur=${encodeURIComponent("Moyen de paiement indisponible.")}`);

  const order = await prisma.order.create({
    data: { userId: user.id, seriesId: series.id, amountXof: series.priceXof, provider: provider.id },
  });

  const result = await provider
    .createPayment({ order, series, user, baseUrl: appUrl() })
    .catch((e) => {
      console.error(`[paiement] échec du démarrage (${provider.id}) pour ${order.id}`, e);
      return null;
    });

  if (!result) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    redirect(
      `${seriesPage}?erreur=${encodeURIComponent("Le paiement n'a pas pu démarrer. Réessayez dans un instant.")}`
    );
  }

  if (result.providerRef) {
    await prisma.order.update({ where: { id: order.id }, data: { providerRef: result.providerRef } });
  }
  redirect(result.paymentUrl);
}

/* ── Mode test uniquement ─────────────────────────────────────────── */

async function ownTestOrder(formData: FormData) {
  if (!isSimulation()) redirect("/");
  const user = await getCurrentUser();
  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!user || !order || order.userId !== user.id || order.provider !== "simulation") redirect("/");
  return order;
}

export async function simulatePaid(formData: FormData) {
  const order = await ownTestOrder(formData);
  await markOrderPaid(order.id);
  redirect(`/paiement/retour?commande=${order.id}`);
}

export async function simulateFailed(formData: FormData) {
  const order = await ownTestOrder(formData);
  await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
  redirect(`/paiement/retour?commande=${order.id}`);
}
