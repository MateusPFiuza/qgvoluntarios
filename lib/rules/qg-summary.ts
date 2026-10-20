import { pickDefaultMeal, type MealLike } from "./meals";
import { isOverdue, openCheckouts, type RadioCheckoutLike } from "./radios";

export type QgSummary = {
  meal: { label: string; consumed: number; prepared: number } | null;
  radios: { out: number; total: number; notReturned: number };
  praise: { open: boolean; name: string | null };
};

/** Números da entrada da Área do QG (prompt de ajustes, item 7). */
export function summarizeQg(params: {
  meals: MealLike[];
  checkins: { meal_id: string }[];
  radios: { id: string }[];
  checkouts: RadioCheckoutLike[];
  openWindow: { name: string } | null;
  now: Date;
}): QgSummary {
  const meal = pickDefaultMeal(params.meals, params.now);
  const open = openCheckouts(params.checkouts);
  return {
    meal: meal ? { label: meal.label, consumed: params.checkins.filter((c) => c.meal_id === meal.id).length, prepared: meal.total_prepared } : null,
    radios: { out: open.length, total: params.radios.length, notReturned: open.filter((c) => isOverdue(c, params.now)).length },
    praise: { open: Boolean(params.openWindow), name: params.openWindow?.name ?? null },
  };
}
