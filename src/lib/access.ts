import { prisma } from "./db";
import type { CurrentUser } from "./auth";

export async function ownsSeries(user: CurrentUser | null, seriesId: string) {
  if (!user) return false;
  if (user.isAdmin) return true;
  const p = await prisma.purchase.findUnique({
    where: { userId_seriesId: { userId: user.id, seriesId } },
    select: { id: true },
  });
  return Boolean(p);
}

export function isFreeEpisode(episodeNumber: number, freeEpisodes: number) {
  return episodeNumber <= freeEpisodes;
}
