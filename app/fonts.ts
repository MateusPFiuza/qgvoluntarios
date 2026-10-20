import localFont from "next/font/local";

// Sansgeo (títulos e números grandes) da identidade G'26.
// PENDENTE: confirmar a licença de uso web com o design da Colo de Deus (docs/DECISOES.md).
// Andale Mono não é distribuída (licença da Microsoft): o texto técnico usa a mono do sistema.
const sansgeo = localFont({
  src: "../public/fonts/Sansgeo.otf",
  variable: "--font-display",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const fontVariablesClassName = sansgeo.variable;
