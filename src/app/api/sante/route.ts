import { enabledProviders, isSimulation } from "@/lib/payments";

/**
 * Diagnostic public : dit dans quel mode de paiement tourne le site.
 * N'affiche AUCUNE clé : seulement si elles sont présentes et leur type (sandbox / live).
 */
export const dynamic = "force-dynamic";

function typeCle(v: string | undefined) {
  if (!v) return "absente";
  const s = v.trim();
  if (s.startsWith("pk_live_") || s.startsWith("sk_live_")) return "live";
  if (s.startsWith("pk_sandbox_") || s.startsWith("sk_sandbox_")) return "sandbox";
  return "présente (format inattendu)";
}

export function GET() {
  const brut = process.env.PAYMENT_MODE;
  return Response.json({
    paiement: isSimulation() ? "TEST (simulation)" : "RÉEL",
    PAYMENT_MODE_lu: brut === undefined ? "(absente)" : JSON.stringify(brut),
    moyens_de_paiement: enabledProviders().map((p) => p.id),
    geniuspay: {
      cle_publique: typeCle(process.env.GENIUSPAY_PUBLIC_KEY),
      cle_secrete: typeCle(process.env.GENIUSPAY_SECRET_KEY),
      secret_webhook: process.env.GENIUSPAY_WEBHOOK_SECRET ? "présent" : "absent",
    },
    version: (process.env.RENDER_GIT_COMMIT ?? "locale").slice(0, 7),
  });
}
