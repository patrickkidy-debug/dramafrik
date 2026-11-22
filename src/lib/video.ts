import { createHash } from "crypto";

export type Playback = { kind: "iframe"; src: string } | { kind: "video"; src: string } | null;

/**
 * Bunny Stream : le lien de lecture est signé et expire après quelques heures.
 * Quelqu'un qui copie le lien ne peut donc pas le partager durablement.
 * Bunny adapte aussi la qualité à la connexion (utile en 3G).
 */
export function playbackFor(ep: { videoId: string; videoUrl: string }): Playback {
  const lib = process.env.BUNNY_LIBRARY_ID;
  if (ep.videoId && lib) {
    const url = new URL(`https://iframe.mediadelivery.net/embed/${lib}/${ep.videoId}`);
    const key = process.env.BUNNY_TOKEN_KEY;
    if (key) {
      const expires = Math.floor(Date.now() / 1000) + 4 * 3600;
      const token = createHash("sha256").update(key + ep.videoId + expires).digest("hex");
      url.searchParams.set("token", token);
      url.searchParams.set("expires", String(expires));
    }
    url.searchParams.set("autoplay", "true");
    url.searchParams.set("preload", "true");
    return { kind: "iframe", src: url.toString() };
  }
  if (ep.videoUrl) return { kind: "video", src: ep.videoUrl };
  return null;
}
