import { requireVolunteerPage } from "@/lib/server/guard";
import { getVolunteerById, listTeams } from "@/lib/server/repo";
import { PersonalQr } from "@/components/PersonalQr";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function MinhaIdentificacaoPage() {
  const session = await requireVolunteerPage();
  const [volunteer, teams] = await Promise.all([getVolunteerById(session.sub), listTeams()]);
  const team = teams.find((t) => t.id === volunteer?.team_id);

  return (
    <AppShell title="Minha identificação" active="mais">
      <div className="painel flex flex-col gap-4 p-5">
        <div className="text-center">
          <p className="text-xl text-nave-text">{session.name}</p>
          <p className="font-mono text-sm uppercase text-nave-text-secondary">
            {team?.name ?? "Sem equipe"}
            {session.isLeader ? " · Líder" : ""}
          </p>
        </div>
        <PersonalQr />
      </div>
    </AppShell>
  );
}
