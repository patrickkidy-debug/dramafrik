import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { createHash } from "crypto";
import { prisma } from "./db";

const COOKIE = "df_session";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 jours

let warned = false;

/**
 * Clé qui signe les sessions. AUTH_SECRET si défini ; sinon une clé dérivée de
 * DATABASE_URL (secrète, stable, connue du serveur seulement), pour que le site
 * fonctionne même si AUTH_SECRET a été oublié chez l'hébergeur.
 */
function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return new TextEncoder().encode(s);

  const db = process.env.DATABASE_URL;
  if (!db) throw new Error("AUTH_SECRET (32 caractères minimum) ou DATABASE_URL doit être défini");
  if (!warned) {
    console.warn("[auth] AUTH_SECRET absent : clé de session dérivée de DATABASE_URL.");
    warned = true;
  }
  return new Uint8Array(createHash("sha256").update(`dramafrik-session:${db}`).digest());
}

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export type CurrentUser = { id: string; name: string; phone: string; isAdmin: boolean };

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const key = secretKey();
  let userId: string | undefined;
  try {
    userId = (await jwtVerify(token, key)).payload.sub;
  } catch {
    return null;
  }
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, phone: true, isAdmin: true },
  });
});

export async function requireUser(next = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/connexion?suite=/admin");
  return user;
}

/** N'accepte que des chemins internes, pour éviter les redirections vers un autre site. */
export function safeNext(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
