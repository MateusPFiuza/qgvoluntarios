import { requireVolunteerPage } from "@/lib/server/guard";
import { getNow } from "@/lib/server/clock";
import { listLocations, listTeamSchedule, listTeams, listVolunteerDirectory } from "@/lib/server/repo";
import { probableLocation, shortLocationLine } from "@/lib/rules/mission";
import { formatHM } from "@/lib/rules/time";
import { AppShell } from "@/components/AppShell";
import { BuscarList, type BuscarRow } from "@/components/BuscarList";

export const dynamic = "force-dynamic";

export default async function BuscarPage() {
  await requireVolunteerPage();
  const now = await getNow();
  const [volunteers, teams, slots, locations] = await Promise.all([listVolunteerDirectory(), listTeams(), listTeamSchedule(), listLocations()]);

  const rows: BuscarRow[] = volunteers.map((v) => {
    const loc = probableLocation(slots, v.team_id, now);
    const where = shortLocationLine(loc, (id) => locations.find((l) => l.id === id)?.name ?? "Local a definir", formatHM);
    return {
      id: v.id,
      name: v.full_name,
      searchName: v.search_name,
      team: teams.find((t) => t.id === v.team_id)?.name ?? "Sem equipe",
      isLeader: v.is_leader,
      where,
    };
  });

  return (
    <AppShell title="Buscar voluntário" active="mais">
      <BuscarList rows={rows} />
    </AppShell>
  );
}
