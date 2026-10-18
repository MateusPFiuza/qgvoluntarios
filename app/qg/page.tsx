import Link from "next/link";
import { config } from "@/lib/config";
import { requireAdminPage } from "@/lib/server/guard";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function QgPage() {
  const admin = await requireAdminPage("radios");
  const isAdm = admin.role === "adm";

  const items = [
    isAdm && config.mealsEnabled() && { href: "/qg/refeicoes", label: "Check-in de refeição", hint: "Ler QR ou buscar nome" },
    isAdm && config.mealsEnabled() && { href: "/qg/refeicoes/painel", label: "Painel de refeições", hint: "Consumidas, restantes, quem falta" },
    isAdm && { href: "/qg/elogios", label: "Elogios e pins", hint: "Janelas, ranking agregado, entrega de pins" },
    { href: "/qg/radios", label: "Rádios", hint: "Retirada com assinatura, devolução, painel" },
  ].filter(Boolean) as { href: string; label: string; hint: string }[];

  return (
    <div className="flex min-h-screen flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-nave-text">Área do QG</h1>
        <div className="flex gap-2">
          <Link href="/" className="tap-target flex items-center rounded border border-nave-gold-dim px-3 label-mono">
            App
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="painel p-4">
        <p className="label-mono">
          {isAdm ? "ADM conectado" : "Gestor de rádios conectado"} · sessão expira em {config.adminIdleMinutes} min sem uso
        </p>
        <p className="mt-1 text-xl text-nave-text">{admin.name}</p>
      </div>

      <nav className="flex flex-col gap-2">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="painel tap-target flex flex-col px-4 py-3 hover:border-nave-gold">
            <span className="text-base text-nave-text">{i.label}</span>
            <span className="text-sm text-nave-text-secondary">{i.hint}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
