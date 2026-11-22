import { syncOrder } from "@/lib/orders";

/**
 * Wave prévient ici quand un paiement est terminé (événement checkout.session.completed).
 * Comme pour CinetPay, on redemande le statut réel à Wave avant de débloquer quoi que ce soit.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const orderId: string | undefined = body?.data?.client_reference;
  if (orderId) await syncOrder(orderId);
  return new Response("OK");
}
