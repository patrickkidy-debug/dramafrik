import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "./actions/auth";

export const metadata: Metadata = {
  title: { default: "DRAMAFRIK · Séries drama africaines", template: "%s · DRAMAFRIK" },
  description:
    "Séries drama africaines à regarder sur votre téléphone. Premiers épisodes gratuits, la série complète dès 300 FCFA avec Wave, Orange Money, MTN, Moov ou carte.",
};

export const viewport: Viewport = { themeColor: "#100c09", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b border-line bg-ink/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link href="/" className="font-display text-xl font-bold tracking-wide">
              DRAMA<span className="text-gold">FRIK</span>
            </Link>
            <nav className="ml-auto flex items-center gap-4 text-sm">
              {user ? (
                <>
                  <Link href="/mes-series" className="hover:text-gold">Mes séries</Link>
                  {user.isAdmin && <Link href="/admin" className="text-gold hover:underline">Admin</Link>}
                  <form action={logout}>
                    <button className="text-muted hover:text-sand">Déconnexion</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/connexion" className="hover:text-gold">Connexion</Link>
                  <Link href="/inscription" className="rounded-lg bg-gold px-3 py-1.5 font-semibold text-ink">
                    Créer un compte
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          DRAMAFRIK · Paiement sécurisé par Wave, Orange Money, MTN, Moov et carte bancaire
        </footer>
      </body>
    </html>
  );
}
