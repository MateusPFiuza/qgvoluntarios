import Link from "next/link";
import { config } from "@/lib/config";
import { requireAdminPage } from "@/lib/server/guard";
import { getNow } from "@/lib/server/clock";
import { listMeals } from "@/lib/server/repo";
import { pickDefaultMeal } from "@/lib/rules/meals";
import { formatHM } from "@/lib/rules/time";
import { QgShell } from "@/components/AppShell";
import { CheckinConsole } from "@/components/qg/CheckinConsole";

export const dynamic = "force-dynamic";

export default async function QgRefeicoesPage() {
  await requireAdminPage("adm");
  if (!config.mealsEnabled()) {
    return (
      <QgShell title="Check-in de refeição">
        <p className="painel p-4">Módulo de refeições desligado por configuração (FEATURE_MEALS=false).</p>
      </QgShell>
    );
  }
  const [meals, now] = await Promise.all([listMeals(), getNow()]);
  const def = pickDefaultMeal(meals, now);

  return (
    <QgShell title="Check-in de refeição">
      <Link href="/qg/refeicoes/painel" className="tap-target flex items-center justify-center rounded border border-nave-gold-dim font-mono text-sm uppercase text-nave-gold">
        Ver painel da refeição →
      </Link>
      <CheckinConsole
        meals={meals.map((m) => ({ id: m.id, label: m.label, time: `${formatHM(m.starts_at)}–${formatHM(m.ends_at)}` }))}
        defaultMealId={def?.id ?? meals[0]?.id ?? ""}
      />
    </QgShell>
  );
}
