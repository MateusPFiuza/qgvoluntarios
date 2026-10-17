import Link from "next/link";
import { config } from "@/lib/config";
import { requireVolunteerPage } from "@/lib/server/guard";
import { getNow } from "@/lib/server/clock";
import { getVolunteerById, listCheckins, listMeals, listTeamMealWindows } from "@/lib/server/repo";
import { formatHM, isWithin, toDate, weekdayName } from "@/lib/rules/time";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function RefeicoesPage() {
  const session = await requireVolunteerPage();
  const now = await getNow();
  const [volunteer, meals, windows, checkins] = await Promise.all([getVolunteerById(session.sub), listMeals(), listTeamMealWindows(), listCheckins({ volunteerId: session.sub })]);
  const done = new Map(checkins.filter((c) => toDate(c.created_at) <= now).map((c) => [c.meal_id, c]));

  return (
    <AppShell title="Refeições" active="refeicoes">
      {!config.mealsEnabled() && <p className="painel p-4">A organização ainda não ativou o registro de refeições pelo app. Use os tickets em papel.</p>}
      <Link href="/minha-identificacao" className="tap-target flex items-center justify-center rounded bg-nave-gold font-mono text-sm font-bold uppercase text-nave-bg">
        Mostrar meu QR para o QG
      </Link>
      {volunteer?.diet_notes && (
        <p className="painel p-4 text-sm">
          🍽 Sua restrição alimentar cadastrada: <strong>{volunteer.diet_notes}</strong>
          <span className="block text-xs text-nave-text-secondary">Só você e o QG veem esta informação.</span>
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {meals.map((m) => {
          const w = windows.find((x) => x.meal_id === m.id && x.team_id === volunteer?.team_id);
          const c = done.get(m.id);
          const live = isWithin(now, m.starts_at, m.ends_at);
          const past = toDate(m.ends_at).getTime() <= now.getTime();
          return (
            <li key={m.id} className={`painel flex flex-col gap-1 p-4 ${live ? "border-nave-gold" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-lg">{m.label}</p>
                {c ? (
                  <span className="shrink-0 rounded border border-nave-success px-2 text-sm text-nave-success">✔ Registrada {formatHM(c.created_at)}</span>
                ) : live ? (
                  <span className="shrink-0 rounded border border-nave-gold px-2 text-sm text-nave-gold">● Servindo</span>
                ) : past ? (
                  <span className="shrink-0 text-sm text-nave-text-secondary">Encerrada</span>
                ) : (
                  <span className="shrink-0 text-sm text-nave-text-secondary">○ Não registrada</span>
                )}
              </div>
              <p className="font-mono text-sm text-nave-text-secondary">
                {weekdayName(m.starts_at)} · {formatHM(m.starts_at)}–{formatHM(m.ends_at)}
              </p>
              {w && (
                <p className="text-sm">
                  Sua equipe: <span className="font-mono">{formatHM(w.starts_at)}–{formatHM(w.ends_at)}</span>
                </p>
              )}
              {m.menu_text && (
                <p className="text-sm text-nave-text-secondary">
                  Cardápio: {m.menu_text} {m.is_mock && <span className="selo-exemplo">exemplo</span>}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
