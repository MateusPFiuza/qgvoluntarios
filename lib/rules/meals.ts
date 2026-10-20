import { isWithin, toDate } from "./time";

export type MealLike = {
  id: string;
  kind: string;
  label: string;
  starts_at: string;
  ends_at: string;
  total_prepared: number;
};

export type TeamWindow = { team_id: string; meal_id: string; starts_at: string; ends_at: string };

export type CheckinLike = { id: string; volunteer_id: string; meal_id: string; created_at: string; checked_by: string | null };

/** Refeição padrão do check-in: a que está sendo servida; senão a próxima; senão a última que passou. */
export function pickDefaultMeal<T extends MealLike>(meals: T[], now: Date): T | null {
  if (meals.length === 0) return null;
  const sorted = meals.slice().sort((a, b) => toDate(a.starts_at).getTime() - toDate(b.starts_at).getTime());
  const current = sorted.find((m) => isWithin(now, m.starts_at, m.ends_at));
  if (current) return current;
  const next = sorted.find((m) => toDate(m.starts_at).getTime() > now.getTime());
  return next ?? sorted[sorted.length - 1];
}

/** Próxima refeição que o voluntário ainda pode fazer (não registrada e não encerrada). */
export function nextMealForVolunteer<T extends MealLike>(meals: T[], consumedMealIds: Set<string>, now: Date): T | null {
  return (
    meals
      .slice()
      .sort((a, b) => toDate(a.starts_at).getTime() - toDate(b.starts_at).getTime())
      .find((m) => toDate(m.ends_at).getTime() > now.getTime() && !consumedMealIds.has(m.id)) ?? null
  );
}

/**
 * Horário nunca bloqueia (seção 10, item 4). Devolve só se cabe mostrar o
 * aviso suave "fora do horário da equipe".
 */
export function isOutsideTeamWindow(window: TeamWindow | null | undefined, now: Date): boolean {
  if (!window) return false;
  return !isWithin(now, window.starts_at, window.ends_at);
}

export type CheckinResult =
  | { status: "liberado"; outsideTeamWindow: boolean }
  | { status: "ja_consumiu"; at: string; byName: string | null };

export function decideCheckin(params: {
  existing: CheckinLike | null;
  existingByName: string | null;
  teamWindow: TeamWindow | null | undefined;
  now: Date;
}): CheckinResult {
  if (params.existing) {
    return { status: "ja_consumiu", at: params.existing.created_at, byName: params.existingByName };
  }
  return { status: "liberado", outsideTeamWindow: isOutsideTeamWindow(params.teamWindow, params.now) };
}

export type DashboardVolunteer = { id: string; full_name: string; team_id: string | null; diet_notes: string | null };
export type DashboardTeam = { id: string; name: string };

export type MealDashboard = {
  consumed: number;
  prepared: number;
  remaining: number;
  byTeam: { teamId: string; teamName: string; total: number; ate: number; pct: number }[];
  notEaten: { id: string; fullName: string; teamId: string | null; teamName: string | null; dietNotes: string | null }[];
};

export function computeMealDashboard(params: {
  meal: MealLike;
  checkins: CheckinLike[];
  volunteers: DashboardVolunteer[];
  teams: DashboardTeam[];
}): MealDashboard {
  const ate = new Set(params.checkins.filter((c) => c.meal_id === params.meal.id).map((c) => c.volunteer_id));
  const teamName = new Map(params.teams.map((t) => [t.id, t.name]));
  const consumed = ate.size;

  const byTeam = params.teams.map((t) => {
    const members = params.volunteers.filter((v) => v.team_id === t.id);
    const ateCount = members.filter((v) => ate.has(v.id)).length;
    return {
      teamId: t.id,
      teamName: t.name,
      total: members.length,
      ate: ateCount,
      pct: members.length === 0 ? 0 : Math.round((ateCount / members.length) * 100),
    };
  }).sort((a, b) => a.pct - b.pct || a.teamName.localeCompare(b.teamName, "pt-BR"));

  const notEaten = params.volunteers
    .filter((v) => !ate.has(v.id))
    .map((v) => ({
      id: v.id,
      fullName: v.full_name,
      teamId: v.team_id,
      teamName: v.team_id ? teamName.get(v.team_id) ?? null : null,
      dietNotes: v.diet_notes,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"));

  return {
    consumed,
    prepared: params.meal.total_prepared,
    remaining: Math.max(0, params.meal.total_prepared - consumed),
    byTeam,
    notEaten,
  };
}

/**
 * Equipe atrasada no painel: depois da metade da janela da refeição, abaixo
 * do limite (padrão 50%). Antes da metade ninguém é destacado.
 */
export function isTeamLagging(pct: number, meal: Pick<MealLike, "starts_at" | "ends_at">, now: Date, thresholdPct: number): boolean {
  const start = toDate(meal.starts_at).getTime();
  const mid = start + (toDate(meal.ends_at).getTime() - start) / 2;
  return now.getTime() >= mid && pct < thresholdPct;
}
