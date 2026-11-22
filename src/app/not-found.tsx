import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="font-display text-5xl text-gold">404</p>
      <p className="mt-3 text-muted">Cette page n&apos;existe pas.</p>
      <Link href="/" className="mt-6 inline-block text-gold hover:underline">← Retour aux séries</Link>
    </div>
  );
}
