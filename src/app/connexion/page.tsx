import Link from "next/link";
import { login } from "../actions/auth";
import { safeNext } from "@/lib/auth";
import { Notice } from "@/components/Notice";
import { btn, card, input, label } from "@/lib/ui";

export const metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erreur?: string; suite?: string }> }) {
  const { erreur, suite } = await searchParams;
  const next = safeNext(suite);

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 font-display text-3xl">Connexion</h1>
      {erreur && <Notice kind="error">{erreur}</Notice>}
      <form action={login} className={`${card} grid gap-4`}>
        <input type="hidden" name="suite" value={next} />
        <div>
          <label htmlFor="phone" className={label}>Numéro de téléphone</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="77 123 45 67" className={input} />
        </div>
        <div>
          <label htmlFor="password" className={label}>Mot de passe</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
        </div>
        <button className={btn}>Se connecter</button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link href={`/inscription?suite=${encodeURIComponent(next)}`} className="text-gold hover:underline">Créer un compte</Link>
      </p>
    </div>
  );
}
