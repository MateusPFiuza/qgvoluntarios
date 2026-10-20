import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariablesClassName } from "./fonts";
import { Starfield } from "@/components/ship-fx/Starfield";
import { BootSequence } from "@/components/ship-fx/BootSequence";

export const metadata: Metadata = {
  title: "G'26 Voluntários",
  description: "Plataforma de gestão dos voluntários do Geração Atômika 2026",
  applicationName: "G'26 Voluntários",
  appleWebApp: { capable: true, title: "G'26", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0B0806",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fontVariablesClassName}>
      <body className="relative min-h-screen bg-nave-bg text-nave-text">
        <Starfield />
        <BootSequence />
        <main className="relative z-10 mx-auto min-h-screen w-full max-w-md md:max-w-2xl">{children}</main>
      </body>
    </html>
  );
}
