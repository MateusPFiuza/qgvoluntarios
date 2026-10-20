import { formatHM, isWithin } from "./time";
import { nextMealForVolunteer, type MealLike } from "./meals";

const MEAL_NAME: Record<string, string> = { cafe: "Café", almoco: "Almoço", lanche: "Lanche", janta: "Janta" };

/** Nome curto da refeição ("Almoço"), sem o dia. */
export function mealShortName(meal: Pick<MealLike, "kind" | "label">): string {
  return MEAL_NAME[meal.kind] ?? meal.label;
}

export type MealCard<T extends MealLike> =
  | { state: "agora"; meal: T; title: string }
  | { state: "registrada"; meal: T; title: string; next: T | null }
  | { state: "proxima"; meal: T; title: string }
  | { state: "nenhuma"; title: string };

/**
 * Cartão principal do início (prompt de ajustes, item 3).
 * `consumed` mapeia meal_id para o horário do registro.
 */
export function mealCard<T extends MealLike>(meals: T[], consumed: Map<string, string>, now: Date): MealCard<T> {
  const current = meals.find((m) => isWithin(now, m.starts_at, m.ends_at));
  const ids = new Set(consumed.keys());
  if (current) {
    const at = consumed.get(current.id);
    if (!at) return { state: "agora", meal: current, title: `${mealShortName(current)} agora, até ${formatHM(current.ends_at)}` };
    return { state: "registrada", meal: current, title: `${mealShortName(current)} registrado às ${formatHM(at)}`, next: nextMealForVolunteer(meals, ids, now) };
  }
  const next = nextMealForVolunteer(meals, ids, now);
  if (next) return { state: "proxima", meal: next, title: mealShortName(next) };
  return { state: "nenhuma", title: "Não há mais refeições no evento." };
}

/** Texto de "Onde sua equipe deve estar" quando o turno é intervalo. */
export function teamSlotTitle(slot: { activity: string; is_break: boolean }, window: { starts_at: string } | null | undefined): string {
  if (!slot.is_break) return slot.activity;
  return window ? `Intervalo. Refeição às ${formatHM(window.starts_at)}` : "Intervalo";
}


/** Linha de status da refeição na tela do QR (prompt de ajustes, item 11). */
export function qrMealStatus<T extends MealLike>(meals: T[], consumed: Map<string, string>, now: Date): { text: string; tone: "ok" | "done" | "info" } | null {
  const card = mealCard(meals, consumed, now);
  if (card.state === "agora") return { text: `${mealShortName(card.meal)}: liberado`, tone: "ok" };
  if (card.state === "registrada") return { text: `${mealShortName(card.meal)}: já registrado às ${formatHM(consumed.get(card.meal.id)!)}`, tone: "done" };
  if (card.state === "proxima") return { text: `Próxima refeição: ${mealShortName(card.meal)} às ${formatHM(card.meal.starts_at)}`, tone: "info" };
  return null;
}
