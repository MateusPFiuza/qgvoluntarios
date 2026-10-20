import type { Config } from "tailwindcss";

// Tokens de cor da identidade G'26 (seção 3 da especificação).
// SUPOSIÇÃO: valores de partida; ajustar quando os arquivos finais de
// identidade visual (pasta "ID | G'26") estiverem disponíveis.
// Ponto único de configuração: ver docs/DECISOES.md.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        nave: {
          bg: "#0B0806",
          panel: "#15100B",
          bezel: "#201811",
          gold: "#E8B85A",
          "gold-dim": "#8A7245",
          orange: "#E5672F",
          red: "#C8232C",
          text: "#F3E6CC",
          "text-secondary": "#B89A63",
          success: "#4CAF6D",
          warn: "#E8B85A",
          danger: "#E5484D",
        },
      },
      fontFamily: {
        // Sansgeo vem de app/fonts.ts (next/font/local). Ver docs/DECISOES.md.
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        "glow-gold": "0 0 8px rgba(232, 184, 90, 0.45)",
      },
      keyframes: {
        scanlines: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 4px" },
        },
        blinkcursor: {
          "0%, 50%": { opacity: "1" },
          "50.01%, 100%": { opacity: "0" },
        },
      },
      animation: {
        scanlines: "scanlines 1s linear infinite",
        blinkcursor: "blinkcursor 1s steps(1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
