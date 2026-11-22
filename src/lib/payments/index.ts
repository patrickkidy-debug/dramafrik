import type { PaymentProvider, PaymentStatus } from "./types";
import { wave } from "./wave";
import { cinetpay } from "./cinetpay";
import { geniuspay } from "./geniuspay";

export type { PaymentProvider, PaymentStatus };

/** Mode test : aucun argent ne circule, un bouton simule le paiement. */
export const simulation: PaymentProvider = {
  id: "simulation",
  label: "Payer (mode test)",
  hint: "Aucun argent n'est débité",
  async createPayment({ order }) {
    return { paymentUrl: `/paiement/simulation?commande=${order.id}` };
  },
  async checkStatus(order) {
    return order.status as PaymentStatus;
  },
};

const ALL: PaymentProvider[] = [geniuspay, wave, cinetpay, simulation];

export function isSimulation() {
  return process.env.PAYMENT_MODE !== "live";
}

/** Les moyens de paiement proposés aux clients, selon les clés présentes dans .env */
export function enabledProviders(): PaymentProvider[] {
  if (isSimulation()) return [simulation];
  const list: PaymentProvider[] = [];
  if (process.env.GENIUSPAY_PUBLIC_KEY && process.env.GENIUSPAY_SECRET_KEY) list.push(geniuspay);
  if (process.env.WAVE_API_KEY) list.push(wave);
  if (process.env.CINETPAY_API_KEY && process.env.CINETPAY_SITE_ID) list.push(cinetpay);
  return list;
}

export function getEnabledProvider(id: string) {
  return enabledProviders().find((p) => p.id === id) ?? null;
}

export function providerById(id: string) {
  return ALL.find((p) => p.id === id) ?? null;
}

export function appUrl() {
  // Sur Render, RENDER_EXTERNAL_URL est fourni automatiquement (https://xxx.onrender.com)
  const url = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}
