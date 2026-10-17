import Link from "next/link";
import { config } from "@/lib/config";
import { requireVolunteerPage } from "@/lib/server/guard";
import { getNow, isClockSimulated } from "@/lib/server/clock";
import { isDemoMode } from "@/lib/server/env";
import { getAdminSession } from "@/lib/server/session";
import {
  getAdminAccountByVolunteerId,
  getVolunteerById,
  listCheckins,
  listLocations,
  listMeals,
  listScheduleItems,
  listTeamMealWindows,
  listTeamSchedule,
  listTeams,
} from "@/lib/server/repo";
import { currentAndNext, eventPhase, teamSlotAt } from "@/lib/rules/mission";
import { nextMealForVolunteer } from "@/lib/rules/meals";
import { formatCountdown, formatHM, isWithin, toDate, weekdayName } from "@/lib/rules/time";
import { AppShell } from "@/components/AppShell";
import { ClockControl } from "@/components/ClockControl";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireVolunteerPage();
  const now = await getNow();
  const [volunteer, teams, schedule, teamSlots, meals, windows, myCheckins, locations, adminAccount, adminSession, simulated] = await Promise.all([
    getVolunteerById(session.sub),
    listTeams(),
    listScheduleItems(),
    listTeamSchedule(),
    listMeals(),
    listTeamMealWindows(),
    listCheckins({ volunteerId: session.sub }),
    listLocations(),
    getAdminAccountByVolunteerId(session.sub),
    getAdminSession(),
    isClockSimulated(),
  ]);

  const teamId = volunteer?.team_id ?? null;
  const team = teams.find((t) => t.id === teamId);
  const phase = eventPhase(now, config.eventStart, config.eventEnd);
  const { current, next } = currentAndNext(schedule, now);
  const slot = teamSlotAt(teamSlots, teamId, now);
  const teamHasSchedule = teamSlots.some((s) => s.team_id === teamId);
  const slotLocation = slot?.location_id ? locations.find((l) => l.id === slot.location_id) : null;

  // Com relógio simulado, registros "do futuro" da semente não contam.
  const consumed = new Set(myCheckins.filter((c) => toDate(c.created_at) <= now).map((c) => c.meal_id));
  const currentMeal = meals.find((m) => isWithin(now, m.starts_at, m.ends_at));
  const currentMealDone = currentMeal ? consumed.has(currentMeal.id) : false;
  const nextMeal = nextMealForVolunteer(meals, consumed, now);
  const nextMealWindow = nextMeal ? windows.find((w) => w.meal_id === nextMeal.id && w.team_id === teamId) : null;
  const showClock = isDemoMode() || Boolean(adminSession);

  return (
    <AppShell title="Painel de missão" active="inicio">
      <div className="painel p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-nave-text-secondary">Tripulante</p>
        <p className="mt-1 text-xl text-nave-text fx-glow-text">{session.name}</p>
        <p className="text-sm text-nave-text-secondary">
          {team?.name ?? "Sem equipe"}
          {session.isLeader && <span className="ml-2 rounded border border-nave-gold px-1 text-nave-gold">★ Líder</span>}
        </p>
      </div>

      <section className="painel p-5" aria-labelledby="agora">
        <h2 id="agora" className="font-mono text-xs uppercase tracking-wide text-nave-text-secondary">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-nave-success" aria-hidden="true" /> Agora no evento
        </h2>
        {phase === "antes" && (
          <p className="mt-2 text-lg">
            Decolagem em <strong className="font-mono text-nave-gold">{formatCountdown(toDate(config.eventStart).getTime() - now.getTime())}</strong>
            <span className="block text-sm text-nave-text-secondary">Sexta, 11 de dezembro, abertura dos portões às {formatHM(config.eventStart)}</span>
          </p>
        )}
        {phase === "depois" && <p className="mt-2 text-lg">Missão cumprida! Obrigado por servir no Geração Atômika 2026.</p>}
        {phase === "durante" && (
          <div className="mt-2 flex flex-col gap-1">
            {current ? (
              <p className="text-lg fx-cursor">
                {weekdayName(now)}, {current.session_label}: {current.title}
              </p>
            ) : (
              <p className="text-lg">{weekdayName(now)}: fora da programação</p>
            )}
            {next && (
              <p className="text-sm text-nave-text-secondary">
                Próximo: {next.title} às <span className="font-mono">{formatHM(next.starts_at)}</span>
              </p>
            )}
            {schedule[0]?.is_mock && <span className="selo-exemplo self-start">cronograma de exemplo</span>}
          </div>
        )}
      </section>

      <section className="painel p-5" aria-labelledby="minha-equipe">
        <h2 id="minha-equipe" className="font-mono text-xs uppercase tracking-wide text-nave-text-secondary">Onde sua equipe deve estar</h2>
        {!teamHasSchedule ? (
          <p className="mt-2">Escala da sua equipe ainda não publicada.</p>
        ) : slot ? (
          <div className="mt-2">
            <p className="text-lg">{slot.activity}</p>
            <p className="text-sm text-nave-text-secondary">
              {slotLocation?.name ?? "Local a definir"} · até <span className="font-mono">{formatHM(slot.ends_at)}</span>
            </p>
            {slot.is_mock && <span className="selo-exemplo mt-1">escala de exemplo</span>}
          </div>
        ) : (
          <p className="mt-2">Sem turno da equipe neste horário.</p>
        )}
      </section>

      {config.mealsEnabled() && (
        <section className="painel p-5" aria-labelledby="refeicao">
          <h2 id="refeicao" className="font-mono text-xs uppercase tracking-wide text-nave-text-secondary">Sua próxima refeição</h2>
          {currentMeal && currentMealDone && <p className="mt-2 text-nave-success">✔ {currentMeal.label}: refeição registrada</p>}
          {nextMeal ? (
            <div className="mt-2">
              <p className="text-lg">
                {isWithin(now, nextMeal.starts_at, nextMeal.ends_at) ? (
                  <>
                    {nextMeal.label} sendo servido até <span className="font-mono">{formatHM(nextMeal.ends_at)}</span>
                  </>
                ) : (
                  <>
                    {nextMeal.label} em <strong className="font-mono text-nave-gold">{formatCountdown(toDate(nextMeal.starts_at).getTime() - now.getTime())}</strong>
                  </>
                )}
              </p>
              {nextMealWindow && (
                <p className="text-sm text-nave-text-secondary">
                  Horário da sua equipe: <span className="font-mono">{formatHM(nextMealWindow.starts_at)}–{formatHM(nextMealWindow.ends_at)}</span>
                  {nextMealWindow.is_mock && <span className="selo-exemplo ml-2">exemplo</span>}
                </p>
              )}
              <Link href="/minha-identificacao" className="tap-target mt-3 flex items-center justify-center rounded border border-nave-gold font-mono text-sm uppercase text-nave-gold">
                Mostrar meu QR
              </Link>
            </div>
          ) : (
            <p className="mt-2">Não há mais refeições no evento.</p>
          )}
        </section>
      )}

      <nav className="grid grid-cols-2 gap-3" aria-label="Atalhos">
        <Shortcut href="/cronograma" label="Cronograma" />
        <Shortcut href="/buscar" label="Buscar voluntário" />
        <Shortcut href="/elogios" label="Elogios" />
        <Shortcut href="/mapa" label="Mapa" />
      </nav>

      {adminAccount && (
        <Link href="/qg" className="tap-target flex items-center justify-center rounded border border-nave-orange font-mono text-sm uppercase tracking-wide text-nave-orange">
          Área do QG
        </Link>
      )}

      {showClock && <ClockControl current={`${weekdayName(now)} ${formatHM(now)}`} simulated={simulated} />}
    </AppShell>
  );
}

function Shortcut({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="painel tap-target flex items-center justify-center p-4 text-center font-mono text-sm uppercase tracking-wide text-nave-text hover:border-nave-gold">
      {label}
    </Link>
  );
}
