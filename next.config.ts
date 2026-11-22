import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Pas d'optimiseur d'images Next (le site utilise des <img> simples) : moins de surface d'attaque.
  images: { unoptimized: true },
};

export default nextConfig;
