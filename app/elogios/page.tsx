import { requireVolunteerPage } from "@/lib/server/guard";
import { getExplainerVideoUrl, getOpenPraiseWindow, getVolunteerById, listMyPraises, listTeams } from "@/lib/server/repo";
import { AppShell } from "@/components/AppShell";
import { PraiseArea } from "@/components/PraiseArea";

export const dynamic = "force-dynamic";

export default async function ElogiosPage() {
  const session = await requireVolunteerPage();
  const [window, teams, videoUrl] = await Promise.all([getOpenPraiseWindow(), listTeams(), getExplainerVideoUrl()]);
  const mine = window ? await listMyPraises(window.id, session.sub) : {};
  const initial = (
    await Promise.all(
      Object.entries(mine).map(async ([id, traits]) => {
        const v = await getVolunteerById(id);
        return v ? { id, name: v.full_name, team: teams.find((t) => t.id === v.team_id)?.name ?? null, traits } : null;
      }),
    )
  ).filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <AppShell title="Elogios" active="mais">
      <PraiseArea selfId={session.sub} windowOpen={Boolean(window)} windowName={window?.name ?? null} initial={initial} videoUrl={videoUrl} />
    </AppShell>
  );
}
