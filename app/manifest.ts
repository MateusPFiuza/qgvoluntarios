import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "G'26 Voluntários",
    short_name: "G'26",
    description: "Voluntários do Geração Atômika 2026",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0806",
    theme_color: "#0B0806",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
