import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isFreeEpisode, ownsSeries } from "@/lib/access";
import { MEDIA_PREFIX } from "@/lib/video";

/**
 * Sert une vidéo du dossier privé `media/`, uniquement si l'épisode est gratuit
 * ou si le visiteur a acheté la série. Gère les requêtes partielles (Range) pour
 * que la lecture démarre vite et que l'on puisse avancer dans la vidéo.
 */
const MEDIA_DIR = path.join(process.cwd(), "media");

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const episode = await prisma.episode.findUnique({ where: { id }, include: { series: true } });
  if (!episode || !episode.videoUrl.startsWith(MEDIA_PREFIX)) return new Response("Introuvable", { status: 404 });

  const user = await getCurrentUser();
  const allowed =
    (episode.series.published || user?.isAdmin) &&
    (isFreeEpisode(episode.number, episode.series.freeEpisodes) || (await ownsSeries(user, episode.seriesId)));
  if (!allowed) return new Response("Accès réservé aux acheteurs de la série", { status: 403 });

  // Chemin du fichier, sans possibilité de sortir du dossier media/
  const fichier = path.resolve(MEDIA_DIR, episode.videoUrl.slice(MEDIA_PREFIX.length));
  if (!fichier.startsWith(MEDIA_DIR + path.sep)) return new Response("Introuvable", { status: 404 });

  let taille: number;
  try {
    taille = (await stat(fichier)).size;
  } catch {
    return new Response("Vidéo manquante", { status: 404 });
  }

  const entetes: Record<string, string> = {
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Content-Disposition": "inline",
  };

  const range = req.headers.get("range");
  const m = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (m && (m[1] || m[2])) {
    let debut = m[1] ? Number(m[1]) : taille - Number(m[2]);
    let fin = m[1] && m[2] ? Number(m[2]) : taille - 1;
    debut = Math.max(0, debut);
    fin = Math.min(fin, taille - 1);
    if (debut > fin) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${taille}` } });
    }
    const flux = Readable.toWeb(createReadStream(fichier, { start: debut, end: fin })) as ReadableStream;
    return new Response(flux, {
      status: 206,
      headers: { ...entetes, "Content-Range": `bytes ${debut}-${fin}/${taille}`, "Content-Length": String(fin - debut + 1) },
    });
  }

  const flux = Readable.toWeb(createReadStream(fichier)) as ReadableStream;
  return new Response(flux, { status: 200, headers: { ...entetes, "Content-Length": String(taille) } });
}
