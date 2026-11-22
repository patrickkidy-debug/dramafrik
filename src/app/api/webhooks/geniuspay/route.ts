import { prisma } from "@/lib/db";
import { syncOrder } from "@/lib/orders";

/**
 * GeniusPay prévient ici (payment.success, payment.failed…).
 * À déclarer dans le tableau de bord GeniusPay : https://VOTRE-SITE/api/webhooks/geniuspay
 * On ne croit pas le contenu du message : on redemande le statut réel à GeniusPay (syncOrder).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const data = body?.data;

  let orderId: string | undefined = data?.metadata?.order_id;
  if (!orderId && data?.reference) {
    const order = await prisma.order.findFirst({ where: { provider: "geniuspay", providerRef: String(data.reference) } });
    orderId = order?.id;
  }
  if (orderId) await syncOrder(orderId);
  return new Response("OK");
}
