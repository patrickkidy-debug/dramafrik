import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizePhone } from "../src/lib/phone";

try {
  process.loadEnvFile(".env");
} catch {
  // pas de .env : on utilise les variables déjà définies
}

const prisma = new PrismaClient();

const SAMPLE = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample";

async function main() {
  const phone = normalizePhone(process.env.ADMIN_PHONE ?? "");
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!phone || password.length < 6) throw new Error("Définissez ADMIN_PHONE et ADMIN_PASSWORD (6+ caractères) dans .env");

  await prisma.user.upsert({
    where: { phone },
    update: { isAdmin: true },
    create: { phone, name: process.env.ADMIN_NAME || "Admin", isAdmin: true, passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log(`✓ Compte admin : ${phone}`);

  if ((await prisma.series.count()) === 0) {
    await prisma.series.create({
      data: {
        slug: "l-heritage-de-mama-awa",
        title: "L'Héritage de Mama Awa",
        tagline: "Une fortune. Trois enfants. Un seul testament.",
        synopsis:
          "À la mort de Mama Awa, riche commerçante de Dakar, ses trois enfants découvrent que tout l'héritage revient à une inconnue venue du village. Qui est-elle vraiment ? Et que cachait leur mère ?\n\n(Série de démonstration : les vidéos sont des exemples.)",
        priceXof: 300,
        freeEpisodes: 2,
        published: true,
        episodes: {
          create: [
            { number: 1, title: "Le testament", videoUrl: `${SAMPLE}/ForBiggerBlazes.mp4`, durationSec: 15 },
            { number: 2, title: "L'inconnue du village", videoUrl: `${SAMPLE}/ForBiggerEscapes.mp4`, durationSec: 15 },
            { number: 3, title: "Le secret de la boutique", videoUrl: `${SAMPLE}/ForBiggerFun.mp4`, durationSec: 60 },
            { number: 4, title: "La trahison", videoUrl: `${SAMPLE}/ForBiggerJoyrides.mp4`, durationSec: 15 },
            { number: 5, title: "Le retour du père", videoUrl: `${SAMPLE}/ForBiggerMeltdowns.mp4`, durationSec: 15 },
          ],
        },
      },
    });
    console.log("✓ Série de démonstration créée");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
