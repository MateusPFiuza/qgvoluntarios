import { isWithin, toDate } from "./time";

type Timed = { starts_at: string; ends_at: string };

export type EventPhase = "antes" | "durante" | "depois";

export function eventPhase(now: Date, start: string, end: string): EventPhase {
  if (now.getTime() < toDate(start).getTime()) return "antes";
  if (now.getTime() >= toDate(end).getTime()) return "depois";
  return "durante";
}

const byStart = <T extends Timed>(a: T, b: T) => toDate(a.starts_at).getTime() - toDate(b.starts_at).getTime();

/** Item atual do cronograma (o que contém "agora") e o próximo a começar. */
export function currentAndNext<T extends Timed>(items: T[], now: Date): { current: T | null; next: T | null } {
  const sorted = items.slice().sort(byStart);
  const current = sorted.find((i) => isWithin(now, i.starts_at, i.ends_at)) ?? null;
  const next = sorted.find((i) => toDate(i.starts_at).getTime() > now.getTime()) ?? null;
  return { current, next };
}

export type TeamSlot = Timed & { team_id: string; activity: string; location_id: string | null; is_break: boolean };

/** Onde a equipe deveria estar agora, segundo a escala. */
export function teamSlotAt<T extends TeamSlot>(slots: T[], teamId: string | null, now: Date): T | null {
  if (!teamId) return null;
  return slots.find((s) => s.team_id === teamId && isWithin(now, s.starts_at, s.ends_at)) ?? null;
}

export type ProbableLocation =
  | { kind: "sem_escala" }
  | { kind: "fora_de_turno" }
  | { kind: "local"; activity: string; locationId: string | null; isBreak: boolean; until: string };

/** Local provável de um voluntário pela escala da equipe (seção 7, busca). */
export function probableLocation(slots: TeamSlot[], teamId: string | null, now: Date): ProbableLocation {
  if (!teamId || !slots.some((s) => s.team_id === teamId)) return { kind: "sem_escala" };
  const slot = teamSlotAt(slots, teamId, now);
  if (!slot) return { kind: "fora_de_turno" };
  return { kind: "local", activity: slot.activity, locationId: slot.location_id, isBreak: slot.is_break, until: slot.ends_at };
}

/** Linha curta para a busca: "Refeitório, até 14:00" ou "Intervalo no Refeitório, até 14:00". */
export function shortLocationLine(loc: ProbableLocation, placeName: (id: string | null) => string, fmt: (iso: string) => string): string {
  if (loc.kind === "sem_escala") return "Sem escala disponível";
  if (loc.kind === "fora_de_turno") return "Equipe fora de turno agora";
  const place = placeName(loc.locationId);
  return `${loc.isBreak ? `Intervalo no ${place}` : place}, até ${fmt(loc.until)}`;
}
