import { requireVolunteerPage } from "@/lib/server/guard";
import { getNow } from "@/lib/server/clock";
import { listLocations, listTeamSchedule, listTeams } from "@/lib/server/repo";
import { isWithin } from "@/lib/rules/time";
import { AppShell } from "@/components/AppShell";
import { MapView } from "@/components/MapView";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  await requireVolunteerPage();
  const now = await getNow();
  const [locations, slots, teams] = await Promise.all([listLocations(), listTeamSchedule(), listTeams()]);
  const live = slots.filter((s) => isWithin(now, s.starts_at, s.ends_at));
  const points = locations.map((l) => ({
    id: l.id,
    name: l.name,
    kind: l.kind,
    description: l.description,
    x: l.map_x,
    y: l.map_y,
    teamsNow: live.filter((s) => s.location_id === l.id).map((s) => teams.find((t) => t.id === s.team_id)?.name ?? "?"),
  }));

  return (
    <AppShell title="Mapa" active="mapa">
      <MapView points={points} isMock={locations.some((l) => l.is_mock)} />
    </AppShell>
  );
}
