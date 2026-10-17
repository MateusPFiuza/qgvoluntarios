import { requireAdminPage } from "@/lib/server/guard";
import { config } from "@/lib/config";
import { countReciprocalPairs, listActiveVolunteersWithDiet, listPinAwards, listPraiseTotals, listPraiseWindows, listTeams } from "@/lib/server/repo";
import { ranking, TRAIT_INFO, TRAITS, type Trait } from "@/lib/rules/praise";
import { formatHM, weekdayName } from "@/lib/rules/time";
import { QgShell } from "@/components/AppShell";
import { PinIcon } from "@/components/PinIcon";
import { AwardPinForm, PinAwardActions, WindowControl } from "@/components/qg/PraiseAdminControls";

export const dynamic = "force-dynamic";

export default async function QgElogiosPage({ searchParams }: { searchParams: { janela?: string; equipe?: string; traco?: string } }) {
  await requireAdminPage("adm");
  const [windows, totals, volunteers, teams, awards] = await Promise.all([listPraiseWindows(), listPraiseTotals(), listActiveVolunteersWithDiet(), listTeams(), listPinAwards()]);
  const open = windows.find((w) => w.is_open) ?? null;
  const windowId = windows.some((w) => w.id === searchParams.janela) ? searchParams.janela! : null;
  const teamId = teams.some((t) => t.id === searchParams.equipe) ? searchParams.equipe! : null;
  const trait = (TRAITS as readonly string[]).includes(searchParams.traco ?? "") ? (searchParams.traco as Trait) : null;
  const receiverIds = teamId ? new Set(volunteers.filter((v) => v.team_id === teamId).map((v) => v.id)) : null;
  const rows = ranking(totals, { windowId, trait, receiverIds }).slice(0, 25);
  const vol = new Map(volunteers.map((v) => [v.id, v]));
  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? "Sem equipe";
  const reciprocal = windowId ? await countReciprocalPairs(windowId) : open ? await countReciprocalPairs(open.id) : null;
  const windowTotal = totals.filter((t) => t.window_id === (windowId ?? open?.id)).reduce((s, t) => s + t.total, 0);
  const stock = config.pinStockPerTrait();

  return (
    <QgShell title="Elogios e pins">
      <section className="painel p-4">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-wide text-nave-text-secondary">Janela de elogios</h2>
        <WindowControl open={open ? { id: open.id, name: open.name } : null} />
      </section>

      <section className="painel flex flex-col gap-3 p-4">
        <h2 className="font-mono text-xs uppercase tracking-wide text-nave-text-secondary">Ranking (só totais, nunca quem enviou)</h2>
        <form className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select name="janela" defaultValue={windowId ?? ""} aria-label="Janela" className="tap-target rounded border border-nave-gold-dim bg-nave-bg px-2 text-nave-text">
            <option value="">Todas as janelas</option>
            {windows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
                {w.is_open ? " (aberta)" : ""}
              </option>
            ))}
          </select>
          <select name="equipe" defaultValue={teamId ?? ""} aria-label="Equipe" className="tap-target rounded border border-nave-gold-dim bg-nave-bg px-2 text-nave-text">
            <option value="">Todas as equipes</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select name="traco" defaultValue={trait ?? ""} aria-label="Característica" className="tap-target rounded border border-nave-gold-dim bg-nave-bg px-2 text-nave-text">
            <option value="">Todas as características</option>
            {TRAITS.map((t) => (
              <option key={t} value={t}>
                {TRAIT_INFO[t].label}
              </option>
            ))}
          </select>
          <button className="tap-target rounded bg-nave-gold font-mono text-sm uppercase text-nave-bg sm:col-span-3">Filtrar</button>
        </form>
        {reciprocal !== null && windowTotal > 0 && (
          <p className="text-sm text-nave-text-secondary">
            ℹ Pares que se elogiaram mutuamente nesta janela: <strong>{reciprocal}</strong> (de {windowTotal} elogios). Só informativo.
          </p>
        )}
        <ol className="flex flex-col divide-y divide-nave-bezel">
          {rows.map((r, i) => {
            const v = vol.get(r.receiverId);
            return (
              <li key={r.receiverId} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0">
                  <span className="mr-2 font-mono text-nave-text-secondary">{i + 1}.</span>
                  {v?.full_name ?? "?"} <span className="text-nave-text-secondary">· {teamName(v?.team_id ?? null)}</span>
                </span>
                <span className="shrink-0 font-mono">
                  {TRAITS.map((t) => (
                    <span key={t} className={`ml-2 ${trait === t ? "text-nave-gold" : ""}`} title={TRAIT_INFO[t].label}>
                      {TRAIT_INFO[t].icon}
                      {r.byTrait[t]}
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
          {rows.length === 0 && <li className="py-2 text-nave-text-secondary">Sem elogios para este filtro.</li>}
        </ol>
      </section>

      <section className="painel flex flex-col gap-3 p-4">
        <h2 className="font-mono text-xs uppercase tracking-wide text-nave-text-secondary">Pins</h2>
        <span className="selo-exemplo self-start">correspondência pin e característica provisória, sujeita a confirmação</span>
        <ul className="grid grid-cols-3 gap-2 text-center text-xs">
          {TRAITS.map((t) => {
            const given = awards.filter((a) => a.trait === t).length;
            const delivered = awards.filter((a) => a.trait === t && a.delivered_at).length;
            return (
              <li key={t} className="flex flex-col items-center gap-1 rounded border border-nave-bezel p-2">
                <PinIcon trait={t} />
                <span>{TRAIT_INFO[t].label}</span>
                <span className="text-nave-text-secondary">{TRAIT_INFO[t].pin}</span>
                <span className="font-mono">
                  {delivered} entregues · {Math.max(0, stock - delivered)} em estoque
                </span>
                <span className="text-nave-text-secondary">{given - delivered} a entregar</span>
              </li>
            );
          })}
        </ul>
        <AwardPinForm />
        <ul className="flex flex-col divide-y divide-nave-bezel">
          {awards.map((a) => {
            const v = vol.get(a.volunteer_id);
            return (
              <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <PinIcon trait={a.trait} size={28} />
                  <span className="min-w-0">
                    {v?.full_name ?? "?"} <span className="text-nave-text-secondary">· {TRAIT_INFO[a.trait].label}</span>
                    <span className="block text-xs text-nave-text-secondary">
                      {a.delivered_at ? `✔ Entregue ${weekdayName(a.delivered_at)} ${formatHM(a.delivered_at)}` : "○ Ainda não entregue"}
                    </span>
                  </span>
                </span>
                <PinAwardActions id={a.id} delivered={Boolean(a.delivered_at)} />
              </li>
            );
          })}
        </ul>
      </section>
    </QgShell>
  );
}
