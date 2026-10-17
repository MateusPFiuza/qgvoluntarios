import { requireVolunteerPage } from "@/lib/server/guard";
import { getNow } from "@/lib/server/clock";
import { listLocations, listTeamSchedule, listTeams, searchVolunteersByNormalizedName } from "@/lib/server/repo";
import { normalizeForSearch, shouldShowResults } from "@/lib/rules/name-search";
import { probableLocation } from "@/lib/rules/mission";
import { formatHM } from "@/lib/rules/time";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function BuscarPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireVolunteerPage();
  const q = (searchParams.q ?? "").slice(0, 100);
  const now = await getNow();
  const show = shouldShowResults(q);
  const [results, teams, slots, locations] = await Promise.all([
    show ? searchVolunteersByNormalizedName(normalizeForSearch(q)) : Promise.resolve([]),
    listTeams(),
    listTeamSchedule(),
    listLocations(),
  ]);

  return (
    <AppShell title="Buscar voluntário" active="mais">
      <form role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          Nome do voluntário
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Digite 3 letras ou mais" autoComplete="off" className="tap-target min-w-0 flex-1 rounded border border-nave-gold-dim bg-nave-bg px-3 text-base text-nave-text" />
        <button className="tap-target rounded bg-nave-gold px-4 font-mono text-sm uppercase text-nave-bg">Buscar</button>
      </form>
      {q && !show && <p className="text-nave-text-secondary">Digite pelo menos 3 letras.</p>}
      {show && results.length === 0 && <p className="text-nave-text-secondary">Ninguém encontrado com esse nome.</p>}
      <ul className="flex flex-col gap-2">
        {results.map((v) => {
          const loc = probableLocation(slots, v.team_id, now);
          return (
            <li key={v.id} className="painel flex gap-3 p-4">
              <Avatar name={v.full_name} />
              <div className="min-w-0">
                <p className="text-lg">
                  {v.full_name}
                  {v.is_leader && <span className="ml-2 rounded border border-nave-gold px-1 text-xs text-nave-gold">★ Líder</span>}
                </p>
                <p className="text-sm text-nave-text-secondary">{teams.find((t) => t.id === v.team_id)?.name ?? "Sem equipe"}</p>
                <p className="mt-1 text-sm">
                  {loc.kind === "sem_escala" && "Sem escala disponível."}
                  {loc.kind === "fora_de_turno" && "Equipe sem turno neste horário."}
                  {loc.kind === "local" && (
                    <>
                      {loc.isBreak ? "⏸ Em intervalo: " : "⌖ "}
                      {locations.find((l) => l.id === loc.locationId)?.name ?? "Local a definir"} · {loc.activity} (até {formatHM(loc.until)})
                    </>
                  )}
                </p>
                <p className="text-xs text-nave-text-secondary">Local previsto pela escala, pode ter mudado.</p>
              </div>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
