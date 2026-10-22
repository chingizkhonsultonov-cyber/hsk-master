import type { MetadataRoute } from "next";
import { BASE } from "@/lib/base";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HSK Master",
    short_name: "HSK Master",
    description: "HSK 1–6 exam preparation: official word lists, grammar, character writing, listening and speaking.",
    start_url: `${BASE}/`,
    display: "standalone",
    background_color: "#f4f5f2",
    theme_color: "#161c22",
    icons: [
      { src: `${BASE}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${BASE}/icon-512.png`, sizes: "512x512", type: "image/png" },
      { src: `${BASE}/icon-512-maskable.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
