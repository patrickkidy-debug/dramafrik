"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { MIN_PRICE, slugify } from "@/lib/format";

function fail(page: string, message: string): never {
  redirect(`${page}?erreur=${encodeURIComponent(message)}`);
}

function str(fd: FormData, key: string, max = 2000) {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}

function int(fd: FormData, key: string) {
  const n = Number(fd.get(key));
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

function readSeries(fd: FormData, page: string) {
  const title = str(fd, "title", 120);
  const slug = slugify(str(fd, "slug") || title);
  const priceXof = int(fd, "priceXof");
  const freeEpisodes = int(fd, "freeEpisodes");
  const coverUrl = str(fd, "coverUrl", 500);

  if (title.length < 2) fail(page, "Le titre est obligatoire.");
  if (!slug) fail(page, "Adresse de la série invalide.");
  if (!(priceXof >= MIN_PRICE)) fail(page, `Le prix minimum est ${MIN_PRICE} FCFA.`);
  if (priceXof % 5 !== 0) fail(page, "Le prix doit être un multiple de 5 FCFA (exigence des opérateurs).");
  if (!(freeEpisodes >= 0)) fail(page, "Nombre d'épisodes gratuits invalide.");
  if (coverUrl && !/^https?:\/\//.test(coverUrl)) fail(page, "L'image doit être un lien http(s).");

  return {
    title,
    slug,
    priceXof,
    freeEpisodes,
    coverUrl,
    tagline: str(fd, "tagline", 160),
    synopsis: str(fd, "synopsis", 4000),
    published: fd.get("published") === "on",
  };
}

function isDuplicate(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function createSeries(fd: FormData) {
  await requireAdmin();
  const data = readSeries(fd, "/admin");
  let id: string;
  try {
    id = (await prisma.series.create({ data })).id;
  } catch (e) {
    if (isDuplicate(e)) fail("/admin", "Une série utilise déjà cette adresse. Changez le titre ou l'adresse.");
    throw e;
  }
  redirect(`/admin/series/${id}?ok=${encodeURIComponent("Série créée. Ajoutez maintenant les épisodes.")}`);
}

export async function updateSeries(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const page = `/admin/series/${id}`;
  const data = readSeries(fd, page);
  try {
    await prisma.series.update({ where: { id }, data });
  } catch (e) {
    if (isDuplicate(e)) fail(page, "Une autre série utilise déjà cette adresse.");
    throw e;
  }
  redirect(`${page}?ok=${encodeURIComponent("Modifications enregistrées.")}`);
}

export async function addEpisode(fd: FormData) {
  await requireAdmin();
  const seriesId = str(fd, "seriesId");
  const page = `/admin/series/${seriesId}`;
  const number = int(fd, "number");
  const title = str(fd, "title", 160);
  const videoId = str(fd, "videoId", 100);
  const videoUrl = str(fd, "videoUrl", 500);
  const minutes = Number(fd.get("minutes") || 0);
  const seconds = Number(fd.get("seconds") || 0);

  if (!(number >= 1)) fail(page, "Numéro d'épisode invalide.");
  if (!title) fail(page, "Le titre de l'épisode est obligatoire.");
  if (!videoId && !videoUrl) fail(page, "Indiquez l'ID Bunny de la vidéo ou un lien vidéo.");
  if (videoUrl && !/^https?:\/\//.test(videoUrl)) fail(page, "Le lien vidéo doit commencer par http(s)://");

  try {
    await prisma.episode.create({
      data: {
        seriesId,
        number,
        title,
        videoId,
        videoUrl,
        durationSec: Math.max(0, Math.round(minutes * 60 + seconds)) || 0,
      },
    });
  } catch (e) {
    if (isDuplicate(e)) fail(page, `L'épisode ${number} existe déjà.`);
    throw e;
  }
  redirect(`${page}?ok=${encodeURIComponent(`Épisode ${number} ajouté.`)}`);
}

export async function deleteEpisode(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const ep = await prisma.episode.delete({ where: { id } });
  redirect(`/admin/series/${ep.seriesId}?ok=${encodeURIComponent(`Épisode ${ep.number} supprimé.`)}`);
}
