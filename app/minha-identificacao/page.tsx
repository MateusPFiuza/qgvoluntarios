import { requireVolunteerPage } from "@/lib/server/guard";
import { getNow } from "@/lib/server/clock";
import { config } from "@/lib/config";
import { getVolunteerById, listCheckins, listMeals, listTeams } from "@/lib/server/repo";
import { qrMealStatus } from "@/lib/rules/home";
import { toDate } from "@/lib/rules/time";
import { PersonalQr } from "@/components/PersonalQr";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function MinhaIdentificacaoPage() {
  const session = await requireVolunteerPage();
  const now = await getNow();
  const [volunteer, teams, meals, checkins] = await Promise.all([
    getVolunteerById(session.sub),
    listTeams(),
    config.mealsEnabled() ? listMeals() : Promise.resolve([]),
    config.mealsEnabled() ? listCheckins({ volunteerId: session.sub }) : Promise.resolve([]),
  ]);
  const team = teams.find((t) => t.id === volunteer?.team_id);
  const consumed = new Map(checkins.filter((c) => toDate(c.created_at) <= now).map((c) => [c.meal_id, c.created_at]));
  const mealStatus = config.mealsEnabled() ? qrMealStatus(meals, consumed, now) : null;

  return (
    <AppShell title="Minha identificação" active="qr">
      <div className="painel flex flex-col gap-4 p-5">
        <div className="text-center">
          <p className="text-xl text-nave-text">{session.name}</p>
          <p className="font-mono text-sm uppercase text-nave-text-secondary">
            {team?.name ?? "Sem equipe"}
            {session.isLeader ? " · Líder" : ""}
          </p>
        </div>
        <PersonalQr mealStatus={mealStatus} />
      </div>
    </AppShell>
  );
}
