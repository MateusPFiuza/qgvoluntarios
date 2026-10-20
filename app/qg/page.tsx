import Link from "next/link";
import { config } from "@/lib/config";
import { requireAdminPage } from "@/lib/server/guard";
import { LogoutButton } from "@/components/LogoutButton";
import { QgHome } from "@/components/qg/QgHome";
import { loadQgSummary } from "@/lib/server/qg-summary";

export const dynamic = "force-dynamic";

export default async function QgPage() {
  const admin = await requireAdminPage("radios");
  const isAdm = admin.role === "adm";

  const withMeals = isAdm && config.mealsEnabled();
  const cards = [
    withMeals && { href: "/qg/refeicoes", label: "Check-in de refeição", key: "meal" as const },
    withMeals && { href: "/qg/refeicoes/painel", label: "Painel de refeições", key: "mealPanel" as const },
    { href: "/qg/radios", label: "Rádios", key: "radios" as const },
    isAdm && { href: "/qg/elogios", label: "Elogios e pins", key: "praise" as const },
  ].filter((c): c is Exclude<typeof c, false> => Boolean(c));
  const summary = await loadQgSummary(withMeals);

  return (
    <div className="flex min-h-screen flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-nave-text">Área do QG</h1>
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

      <QgHome initial={summary} cards={cards} />
    </div>
  );
}
