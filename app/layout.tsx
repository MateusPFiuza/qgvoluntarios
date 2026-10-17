import type { Metadata } from "next";
import "./globals.css";
import { SimpleModeProvider } from "@/components/ship-fx/SimpleModeProvider";
import { ShipChrome } from "@/components/ship-fx/ShipChrome";
import { BootSequence } from "@/components/ship-fx/BootSequence";
import { DemoBanner } from "@/components/DemoBanner";
import { isDemoMode } from "@/lib/server/env";

export const metadata: Metadata = {
  title: "G'26 Voluntários",
  description: "Plataforma de gestão dos voluntários do Geração Atômika 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const demoMode = isDemoMode();

  return (
    <html lang="pt-BR">
      <body className="relative min-h-screen bg-nave-bg text-nave-text">
        <SimpleModeProvider>
          <DemoBanner demoMode={demoMode} />
          <ShipChrome />
          <BootSequence />
          <main className="relative z-10 mx-auto min-h-screen w-full max-w-md md:max-w-2xl">
            {children}
          </main>
        </SimpleModeProvider>
      </body>
    </html>
  );
}
