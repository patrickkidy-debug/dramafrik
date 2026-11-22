import type { PaymentProvider } from "./types";

// Documentation : https://docs.wave.com/checkout
const API = "https://api.wave.com/v1";

function headers() {
  return {
    Authorization: `Bearer ${process.env.WAVE_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export const wave: PaymentProvider = {
  id: "wave",
  label: "Payer avec Wave",
  hint: "Validation dans l'appli Wave",

  async createPayment({ order, baseUrl }) {
    const back = `${baseUrl}/paiement/retour?commande=${order.id}`;
    const res = await fetch(`${API}/checkout/sessions`, {
      method: "POST",
      headers: headers(),
      cache: "no-store",
      body: JSON.stringify({
        amount: String(order.amountXof),
        currency: process.env.CURRENCY ?? "XOF",
        client_reference: order.id,
        success_url: back,
        error_url: back,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.wave_launch_url) {
      throw new Error(`Wave ${res.status}: ${JSON.stringify(json)}`);
    }
    return { paymentUrl: json.wave_launch_url as string, providerRef: json.id as string };
  },

  async checkStatus(order) {
    if (!order.providerRef) return "PENDING";
    const res = await fetch(`${API}/checkout/sessions/${encodeURIComponent(order.providerRef)}`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Wave ${res.status}`);
    const s = await res.json();
    if (s.client_reference && s.client_reference !== order.id) return "FAILED";
    if (s.payment_status === "succeeded") {
      return Number(s.amount) >= order.amountXof ? "PAID" : "FAILED";
    }
    if (s.checkout_status === "expired" || s.payment_status === "cancelled") return "FAILED";
    return "PENDING";
  },
};
