import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { syncOrder } from "@/lib/orders";

/**
 * GeniusPay prévient ici (payment.success, payment.failed…).
 * À déclarer dans le tableau de bord GeniusPay : https://VOTRE-SITE/api/webhooks/geniuspay
 *
 * Sécurité, à deux niveaux :
 * 1. Signature : HMAC-SHA256(timestamp + "." + corps, GENIUSPAY_WEBHOOK_SECRET), comparée à X-Webhook-Signature.
 *    Par défaut on la vérifie et on note le résultat dans les journaux. Avec GENIUSPAY_WEBHOOK_STRICT="true",
 *    les messages mal signés sont refusés (à activer après avoir vu "signature valide" sur un vrai paiement).
 * 2. Dans tous les cas, on ne croit pas le contenu du message : on redemande le statut réel à GeniusPay
 *    (syncOrder). Un faux message ne peut donc jamais débloquer une série.
 */
function signatureIsValid(raw: string, timestamp: string | null, signature: string | null, secret: string) {
  if (!timestamp || !signature) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!(age <= 300)) return false; // message de plus de 5 minutes : rejoué ?
  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  const given = signature.trim().replace(/^sha256=/, "");
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function POST(req: Request) {
  const raw = await req.text();
  const event = req.headers.get("x-webhook-event") ?? "?";

  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
  if (secret) {
    const ok = signatureIsValid(raw, req.headers.get("x-webhook-timestamp"), req.headers.get("x-webhook-signature"), secret);
    console.log(`[webhook geniuspay] ${event} : signature ${ok ? "valide" : "INVALIDE"}`);
    if (!ok && process.env.GENIUSPAY_WEBHOOK_STRICT === "true") {
      return new Response("Signature invalide", { status: 401 });
    }
  }

  let body: { data?: { reference?: unknown; metadata?: { order_id?: unknown } } } | null = null;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("OK");
  }
  const data = body?.data;

  let orderId = typeof data?.metadata?.order_id === "string" ? data.metadata.order_id : undefined;
  if (!orderId && data?.reference) {
    const order = await prisma.order.findFirst({ where: { provider: "geniuspay", providerRef: String(data.reference) } });
    orderId = order?.id;
  }
  if (orderId) await syncOrder(orderId);
  return new Response("OK");
}
