import Link from "next/link";
import { SimpleModeToggle } from "@/components/ship-fx/SimpleModeToggle";

export type TabKey = "inicio" | "agenda" | "refeicoes" | "mapa" | "mais";

const TABS: { key: TabKey; href: string; label: string; icon: string }[] = [
  { key: "inicio", href: "/", label: "Início", icon: "◉" },
  { key: "agenda", href: "/cronograma", label: "Agenda", icon: "▤" },
  { key: "refeicoes", href: "/refeicoes", label: "Refeições", icon: "◍" },
  { key: "mapa", href: "/mapa", label: "Mapa", icon: "⌖" },
  { key: "mais", href: "/mais", label: "Mais", icon: "☰" },
];

/** Layout do voluntário no celular: uma tela por vez, barra de abas inferior. */
export function AppShell({ title, active, children, right }: { title: string; active: TabKey; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col px-4 pb-28 pt-5">
      <header className="mb-4 flex items-center justify-between gap-2">
        <h1 className="font-display text-lg uppercase tracking-wide text-nave-gold fx-glow-text">{title}</h1>
        <div className="flex items-center gap-2">
          {right}
          <SimpleModeToggle />
        </div>
      </header>
      <div className="flex flex-col gap-4">{children}</div>
      <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-nave-bezel bg-nave-panel/95 backdrop-blur">
        <ul className="mx-auto grid max-w-md grid-cols-5 md:max-w-2xl">
          {TABS.map((t) => {
            const isActive = t.key === active;
            return (
              <li key={t.key}>
                <Link
                  href={t.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 font-mono text-[11px] uppercase tracking-wide ${
                    isActive ? "text-nave-gold" : "text-nave-text-secondary"
                  }`}
                >
                  <span aria-hidden="true" className="text-lg leading-none">
                    {t.icon}
                  </span>
                  {t.label}
                  {isActive && <span className="sr-only">(atual)</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function QgShell({ title, children, back = "/qg" }: { title: string; children: React.ReactNode; back?: string }) {
  return (
    <div className="flex min-h-screen flex-col gap-4 px-4 py-5">
      <header className="flex items-center justify-between gap-2">
        <h1 className="font-display text-lg uppercase tracking-wide text-nave-orange">{title}</h1>
        <Link href={back} className="tap-target flex items-center rounded border border-nave-gold-dim px-3 font-mono text-xs uppercase text-nave-text-secondary">
          ← Voltar
        </Link>
      </header>
      {children}
    </div>
  );
}
