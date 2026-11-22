import type { Order, Series } from "@prisma/client";

export type PaymentStatus = "PAID" | "PENDING" | "FAILED";

export interface StartArgs {
  order: Order;
  series: Series;
  user: { id: string; name: string; phone: string };
  baseUrl: string;
}

export interface PaymentProvider {
  id: string;
  /** Texte du bouton */
  label: string;
  /** Petite ligne sous le bouton */
  hint: string;
  createPayment(args: StartArgs): Promise<{ paymentUrl: string; providerRef?: string }>;
  /** Demande le vrai statut au prestataire. On ne fait jamais confiance au seul webhook. */
  checkStatus(order: Order): Promise<PaymentStatus>;
}
