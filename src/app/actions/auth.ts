"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, safeNext } from "@/lib/auth";
import { isValidPhone, normalizePhone } from "@/lib/phone";

function fail(page: string, message: string, next: string): never {
  redirect(`${page}?erreur=${encodeURIComponent(message)}&suite=${encodeURIComponent(next)}`);
}

export async function register(formData: FormData) {
  const next = safeNext(formData.get("suite"));
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) fail("/inscription", "Indiquez votre nom.", next);
  if (!isValidPhone(phone)) fail("/inscription", "Numéro de téléphone invalide.", next);
  if (password.length < 6) fail("/inscription", "Le mot de passe doit faire au moins 6 caractères.", next);

  const exists = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
  if (exists) fail("/connexion", "Ce numéro a déjà un compte. Connectez-vous.", next);

  const user = await prisma.user.create({
    data: { name, phone, passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession(user.id);
  redirect(next);
}

export async function login(formData: FormData) {
  const next = safeNext(formData.get("suite"));
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { phone } });
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !ok) fail("/connexion", "Numéro ou mot de passe incorrect.", next);

  await createSession(user.id);
  redirect(next);
}

export async function logout() {
  await destroySession();
  redirect("/");
}
