import type { PaymentProvider } from "./types";

// Documentation : https://docs.cinetpay.com/api/1.0-fr/checkout/initialisation
const API = "https://api-checkout.cinetpay.com/v2";

function creds() {
  return { apikey: process.env.CINETPAY_API_KEY!, site_id: process.env.CINETPAY_SITE_ID! };
}

/** CinetPay refuse les caractères spéciaux dans certains champs. */
function clean(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 .-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export const cinetpay: PaymentProvider = {
  id: "cinetpay",
  label: "Orange Money, MTN, Moov, carte…",
  hint: "Tous les moyens de paiement, via CinetPay",

  async createPayment({ order, series, user, baseUrl }) {
    const [first, ...rest] = user.name.trim().split(/\s+/);
    const res = await fetch(`${API}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        ...creds(),
        transaction_id: order.id,
        amount: order.amountXof,
        currency: process.env.CURRENCY ?? "XOF",
        description: clean(`Serie ${series.title}`),
        notify_url: `${baseUrl}/api/webhooks/cinetpay`,
        // CinetPay peut revenir en POST : on passe par une route qui redirige proprement
        return_url: `${baseUrl}/api/paiement/retour?commande=${order.id}`,
        channels: process.env.CINETPAY_CHANNELS ?? "ALL",
        lang: "fr",
        metadata: order.id,
        customer_id: user.id,
        customer_name: clean(first || "Client"),
        customer_surname: clean(rest.join(" ") || first || "Client"),
        customer_phone_number: user.phone,
      }),
    });
    const json = await res.json().catch(() => null);
    if (String(json?.code) !== "201" || !json?.data?.payment_url) {
      throw new Error(`CinetPay: ${JSON.stringify(json)}`);
    }
    return { paymentUrl: json.data.payment_url as string, providerRef: json.data.payment_token as string };
  },

  async checkStatus(order) {
    const res = await fetch(`${API}/payment/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ ...creds(), transaction_id: order.id }),
    });
    const json = await res.json().catch(() => null);
    const status = json?.data?.status;
    if (status === "ACCEPTED") {
      return Number(json.data.amount) >= order.amountXof ? "PAID" : "FAILED";
    }
    if (status === "REFUSED" || status === "CANCELED") return "FAILED";
    return "PENDING";
  },
};
