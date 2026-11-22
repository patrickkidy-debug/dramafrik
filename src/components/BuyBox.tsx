import { startCheckout } from "@/app/actions/checkout";
import { enabledProviders } from "@/lib/payments";
import { formatXof } from "@/lib/format";

export function BuyBox({
  seriesId,
  priceXof,
  episodeCount,
  loggedIn,
}: {
  seriesId: string;
  priceXof: number;
  episodeCount: number;
  loggedIn: boolean;
}) {
  const providers = enabledProviders();

  return (
    <form action={startCheckout} className="rounded-2xl border border-gold/40 bg-panel p-5">
      <input type="hidden" name="seriesId" value={seriesId} />
      <p className="text-sm text-muted">Toute la série · {episodeCount} épisodes · accès à vie</p>
      <p className="mt-1 font-display text-4xl text-gold">{formatXof(priceXof)}</p>

      {providers.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Le paiement sera bientôt disponible.</p>
      ) : (
        <div className="mt-4 grid gap-2">
          {providers.map((p) => (
            <button
              key={p.id}
              name="provider"
              value={p.id}
              className={`rounded-xl px-4 py-3 text-left font-semibold transition hover:brightness-110 ${
                p.id === "wave" ? "bg-wave text-ink" : "bg-gold text-ink"
              }`}
            >
              {p.label}
              <span className="block text-xs font-normal opacity-75">{p.hint}</span>
            </button>
          ))}
        </div>
      )}

      {!loggedIn && providers.length > 0 && (
        <p className="mt-3 text-xs text-muted">Vous créerez votre compte (nom + téléphone) en 30 secondes avant de payer.</p>
      )}
    </form>
  );
}
