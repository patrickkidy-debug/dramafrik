import type { PaymentProvider } from "./types";

// Documentation : https://geniuspay.ci/docs/api
// Clés sandbox (pk_sandbox_… / sk_sandbox_…) ou live (pk_live_… / sk_live_…) : même adresse d'API.
function api() {
  return (process.env.GENIUSPAY_API_URL ?? "https://geniuspay.ci/api/v1/merchant").replace(/\/+$/, "");
}

function headers() {
  return {
    "X-API-Key": process.env.GENIUSPAY_PUBLIC_KEY!,
    "X-API-Secret": process.env.GENIUSPAY_SECRET_KEY!,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export const geniuspay: PaymentProvider = {
  id: "geniuspay",
  label: "Wave, Orange Money, MTN, Moov, carte",
  hint: "Tous les moyens de paiement, via GeniusPay",

  async createPayment({ order, series, user, baseUrl }) {
    // Pas de payment_method : GeniusPay affiche sa page où le client choisit son moyen de paiement.
    const back = `${baseUrl}/api/paiement/retour?commande=${order.id}`;
    const res = await fetch(`${api()}/payments`, {
      method: "POST",
      headers: headers(),
      cache: "no-store",
      body: JSON.stringify({
        amount: order.amountXof,
        currency: process.env.CURRENCY ?? "XOF",
        description: `DRAMAFRIK · ${series.title}`.slice(0, 500),
        customer: { name: user.name, phone: user.phone },
        success_url: back,
        error_url: back,
        metadata: { order_id: order.id, series: series.slug },
      }),
    });
    const json = await res.json().catch(() => null);
    const data = json?.data;
    const url = data?.checkout_url ?? data?.payment_url;
    if (!res.ok || !json?.success || !url || !data?.reference) {
      throw new Error(`GeniusPay ${res.status}: ${JSON.stringify(json?.error ?? json)}`);
    }
    return { paymentUrl: url as string, providerRef: data.reference as string };
  },

  async checkStatus(order) {
    if (!order.providerRef) return "PENDING";
    const res = await fetch(`${api()}/payments/${encodeURIComponent(order.providerRef)}`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`GeniusPay ${res.status}`);
    const t = (await res.json())?.data;
    if (!t) return "PENDING";

    // La transaction doit bien correspondre à cette commande
    if (t.metadata?.order_id && t.metadata.order_id !== order.id) return "FAILED";

    switch (t.status) {
      case "completed":
        return Number(t.amount) >= order.amountXof ? "PAID" : "FAILED";
      case "failed":
      case "expired":
      case "cancelled":
      case "refunded":
        return "FAILED";
      default: // pending, processing
        return "PENDING";
    }
  },
};
