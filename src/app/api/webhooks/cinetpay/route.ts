import { syncOrder } from "@/lib/orders";

/**
 * CinetPay prévient ici quand un paiement change de statut.
 * On ne croit pas le contenu du message : on redemande le statut réel à CinetPay (syncOrder).
 * Un faux message ne peut donc pas débloquer une série.
 */
export async function POST(req: Request) {
  let orderId: string | null = null;
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    orderId = body?.cpm_trans_id ?? null;
  } else {
    const form = await req.formData().catch(() => null);
    orderId = form?.get("cpm_trans_id")?.toString() ?? null;
  }
  if (orderId) await syncOrder(orderId);
  return new Response("OK");
}

// CinetPay vérifie que l'adresse répond
export async function GET() {
  return new Response("OK");
}
