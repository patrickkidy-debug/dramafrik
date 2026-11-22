import { NextResponse } from "next/server";
import { appUrl } from "@/lib/payments";

// CinetPay renvoie le client ici (parfois en POST). On le redirige vers la page de résultat.
function handle(req: Request) {
  const id = new URL(req.url).searchParams.get("commande") ?? "";
  return NextResponse.redirect(`${appUrl()}/paiement/retour?commande=${encodeURIComponent(id)}`, 303);
}

export const GET = handle;
export const POST = handle;
