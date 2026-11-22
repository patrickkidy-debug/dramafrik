import { prisma } from "./db";
import { providerById, type PaymentStatus } from "./payments";

/** Marque la commande payée et débloque la série. Peut être appelé plusieurs fois sans risque. */
export async function markOrderPaid(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.status !== "PAID") {
      await tx.order.update({ where: { id: orderId }, data: { status: "PAID", paidAt: new Date() } });
    }
    await tx.purchase.upsert({
      where: { userId_seriesId: { userId: order.userId, seriesId: order.seriesId } },
      update: {},
      create: { userId: order.userId, seriesId: order.seriesId, orderId },
    });
  });
}

/**
 * Vérifie auprès de Wave / CinetPay le vrai statut d'une commande et met la base à jour.
 * Appelé par les webhooks et par la page de retour, au cas où le webhook arriverait en retard.
 */
export async function syncOrder(orderId: string): Promise<PaymentStatus | null> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  if (order.status === "PAID") return "PAID";

  const provider = providerById(order.provider);
  if (!provider) return order.status as PaymentStatus;

  let status: PaymentStatus;
  try {
    status = await provider.checkStatus(order);
  } catch (e) {
    console.error(`[paiement] vérification impossible pour ${orderId}`, e);
    return order.status as PaymentStatus;
  }

  if (status === "PAID") await markOrderPaid(order.id);
  else if (status === "FAILED" && order.status !== "FAILED") {
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
  }
  return status;
}
