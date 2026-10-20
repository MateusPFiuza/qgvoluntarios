import Link from "next/link";
import { LogoG26 } from "@/components/brand/Logo";
import { StripeDivider } from "@/components/brand/StripeDivider";

export type TabKey = "inicio" | "agenda" | "qr" | "refeicoes" | "mais";

const ICONS: Record<TabKey, React.ReactNode> = {
  inicio: <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  agenda: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  refeicoes: <path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 2-2 6 0 8v10" />,
  qr: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" />,
  mais: <path d="M4 7h16M4 12h16M4 17h16" />,
};

const TABS: { key: TabKey; href: string; label: string }[] = [
  { key: "inicio", href: "/", label: "Início" },
  { key: "agenda", href: "/cronograma", label: "Agenda" },
  { key: "qr", href: "/minha-identificacao", label: "Meu QR" },
  { key: "refeicoes", href: "/refeicoes", label: "Refeições" },
  { key: "mais", href: "/mais", label: "Mais" },
];

/** Layout do voluntário no celular: uma tela por vez, barra de abas inferior. */
export function AppShell({
  title,
  active,
  children,
  right,
  brand = false,
}: {
  title: string;
  active: TabKey;
  children: React.ReactNode;
  right?: React.ReactNode;
  brand?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 pb-32 pt-6">
      <header className={`flex items-center justify-between gap-3 ${brand ? "mb-3" : "mb-6"}`}>
        <div className="min-w-0">
          {brand ? <LogoG26 priority className="mb-3 h-9 w-auto" /> : <p className="label-mono">G&apos;26 Voluntários</p>}
          <h1 className="font-display text-2xl text-nave-text">{title}</h1>
        </div>
        {right}
      </header>
      {brand && <StripeDivider className="mb-6 w-40" />}
      <div className="flex flex-col gap-5">{children}</div>
      <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-nave-bezel bg-nave-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid max-w-md grid-cols-5 md:max-w-2xl">
          {TABS.map((t) => {
            const isActive = t.key === active;
            if (t.key === "qr") {
              return (
                <li key={t.key} className="flex justify-center">
                  <Link
                    href={t.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`-mt-4 flex min-h-[64px] w-[72px] flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold shadow-lg ${
                      isActive ? "bg-nave-text text-nave-bg ring-2 ring-nave-gold" : "bg-nave-gold text-nave-bg"
                    }`}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {ICONS[t.key]}
                    </svg>
                    {t.label}
                  </Link>
                </li>
              );
            }
            return (
              <li key={t.key}>
                <Link
                  href={t.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-xs ${isActive ? "text-nave-gold" : "text-nave-text-secondary"}`}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[t.key]}
                  </svg>
                  {t.label}
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
    <div className="flex min-h-screen flex-col gap-5 px-5 py-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="label-mono text-nave-orange">Área do QG</p>
          <h1 className="font-display text-2xl text-nave-text">{title}</h1>
        </div>
        <Link href={back} className="tap-target flex items-center rounded-lg px-3 text-sm text-nave-text-secondary hover:text-nave-gold">
          ← Voltar
        </Link>
      </header>
      {children}
    </div>
  );
}
