import Link from "next/link";
import { register } from "../actions/auth";
import { safeNext } from "@/lib/auth";
import { Notice } from "@/components/Notice";
import { btn, card, input, label } from "@/lib/ui";

export const metadata = { title: "Créer un compte" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ erreur?: string; suite?: string }> }) {
  const { erreur, suite } = await searchParams;
  const next = safeNext(suite);

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-3xl">Créer un compte</h1>
      <p className="mb-6 mt-2 text-sm text-muted">Pour retrouver vos séries achetées sur n&apos;importe quel téléphone.</p>
      {erreur && <Notice kind="error">{erreur}</Notice>}
      <form action={register} className={`${card} grid gap-4`}>
        <input type="hidden" name="suite" value={next} />
        <div>
          <label htmlFor="name" className={label}>Votre nom</label>
          <input id="name" name="name" autoComplete="name" required minLength={2} className={input} />
        </div>
        <div>
          <label htmlFor="phone" className={label}>Numéro de téléphone</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="77 123 45 67" className={input} />
        </div>
        <div>
          <label htmlFor="password" className={label}>Mot de passe (6 caractères minimum)</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} className={input} />
        </div>
        <button className={btn}>Créer mon compte</button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Déjà un compte ?{" "}
        <Link href={`/connexion?suite=${encodeURIComponent(next)}`} className="text-gold hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
