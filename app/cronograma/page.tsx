import Link from "next/link";
import { requireVolunteerPage } from "@/lib/server/guard";
import { getNow } from "@/lib/server/clock";
import { getVolunteerById, listEventDays, listLocations, listScheduleItems, listTeamSchedule } from "@/lib/server/repo";
import { dayKey, formatHM, isWithin } from "@/lib/rules/time";
import { AppShell } from "@/components/AppShell";
import { groupScheduleBlocks } from "@/lib/rules/cronograma";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  portoes: "Portões",
  worship: "Worship",
  pregacao: "Pregação",
  short: "Short",
  pitch: "Pitch",
  prayer: "Oração",
  intervalo: "Intervalo",
  missa: "Missa",
  comunicacao: "Comunicação",
  outro: "Outro",
};

export default async function CronogramaPage({ searchParams }: { searchParams: { dia?: string; aba?: string } }) {
  const session = await requireVolunteerPage();
  const now = await getNow();
  const [days, items, volunteer, locations] = await Promise.all([listEventDays(), listScheduleItems(), getVolunteerById(session.sub), listLocations()]);
  const teamRows = volunteer?.team_id ? await listTeamSchedule(volunteer.team_id) : [];

  const todayKey = dayKey(now);
  const day = days.find((d) => d.date === searchParams.dia) ?? days.find((d) => d.date === todayKey) ?? days[0];
  const aba = searchParams.aba === "equipe" ? "equipe" : "geral";
  const dayItems = items.filter((i) => dayKey(i.starts_at) === day?.date);
  const blocks = groupScheduleBlocks(dayItems);
  const dayTeamRows = teamRows.filter((r) => dayKey(r.starts_at) === day?.date);
  const locName = (id: string | null) => locations.find((l) => l.id === id)?.name ?? "Local a definir";
  const href = (dia: string, a: string) => `/cronograma?dia=${dia}&aba=${a}`;

  return (
    <AppShell title="Cronograma" active="agenda">
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Dia">
        {days.map((d) => (
          <Link
            key={d.id}
            href={href(d.date, aba)}
            role="tab"
            aria-selected={d.id === day?.id}
            className={`tap-target flex items-center justify-center rounded border font-mono text-sm uppercase ${d.id === day?.id ? "border-nave-gold bg-nave-gold text-nave-bg" : "border-nave-gold-dim"}`}
          >
            {d.label}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Visão">
        {(["geral", "equipe"] as const).map((a) => (
          <Link
            key={a}
            href={href(day?.date ?? "", a)}
            role="tab"
            aria-selected={a === aba}
            className={`tap-target flex items-center justify-center rounded border text-sm ${a === aba ? "border-nave-gold text-nave-gold" : "border-nave-bezel text-nave-text-secondary"}`}
          >
            {a === "geral" ? "Evento" : "Minha equipe"}
          </Link>
        ))}
      </div>

      {aba === "geral" ? (
        <>
          {dayItems[0] && <span className="selo-exemplo self-start">{dayItems[0].is_mock ? "cronograma de exemplo" : config.scheduleVersionLabel}</span>}
          {blocks.map((b) => (
            <section key={`${b.label}-${b.items[0].starts_at}`} className="painel p-4">
              <h2 className="mb-2 label-mono">{b.label}</h2>
              <ol className="flex flex-col gap-1">
                {b.items.map((i) => {
                    const live = isWithin(now, i.starts_at, i.ends_at);
                    return (
                      <li key={i.id} aria-current={live ? "true" : undefined} className={`flex gap-3 rounded p-2 ${live ? "border border-nave-gold bg-nave-gold/10" : ""}`}>
                        <span className="w-24 shrink-0 font-mono text-sm text-nave-text-secondary">
                          {formatHM(i.starts_at)}–{formatHM(i.ends_at)}
                        </span>
                        <span className="min-w-0">
                          <span className="block">
                            {i.title}
                            {live && <strong className="ml-2 font-mono text-xs text-nave-gold">AGORA</strong>}
                          </span>
                          <span className="text-xs text-nave-text-secondary">
                            {[i.kind === "outro" ? null : KIND_LABEL[i.kind] ?? i.kind, i.performer].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                      </li>
                    );
                  })}
              </ol>
            </section>
          ))}
        </>
      ) : dayTeamRows.length === 0 ? (
        <p className="painel p-4">Escala da sua equipe ainda não publicada.</p>
      ) : (
        <section className="painel p-4">
          {dayTeamRows[0]?.is_mock && <span className="selo-exemplo mb-2">escala de exemplo</span>}
          <ol className="flex flex-col gap-1">
            {dayTeamRows.map((r) => {
              const live = isWithin(now, r.starts_at, r.ends_at);
              return (
                <li key={r.id} aria-current={live ? "true" : undefined} className={`flex gap-3 rounded p-2 ${live ? "border border-nave-gold bg-nave-gold/10" : ""}`}>
                  <span className="w-24 shrink-0 font-mono text-sm text-nave-text-secondary">
                    {formatHM(r.starts_at)}–{formatHM(r.ends_at)}
                  </span>
                  <span>
                    <span className="block">
                      {r.activity}
                      {live && <strong className="ml-2 font-mono text-xs text-nave-gold">AGORA</strong>}
                    </span>
                    <span className="text-xs text-nave-text-secondary">{locName(r.location_id)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </AppShell>
  );
}
