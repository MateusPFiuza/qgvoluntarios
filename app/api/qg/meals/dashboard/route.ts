import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { requireAdminApi } from "@/lib/server/guard";
import { getNow } from "@/lib/server/clock";
import { computeMealDashboard, pickDefaultMeal } from "@/lib/rules/meals";
import { dayKey, formatHM } from "@/lib/rules/time";
import { listActiveVolunteersWithDiet, listCheckins, listEventDays, listMeals, listTeams } from "@/lib/server/repo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdminApi(request, "adm");
  if (guard.error) return guard.error;
  if (!config.mealsEnabled()) return NextResponse.json({ error: "Módulo de refeições desligado." }, { status: 404 });

  const [meals, teams, volunteers, checkins, days, now] = await Promise.all([
    listMeals(),
    listTeams(),
    listActiveVolunteersWithDiet(),
    listCheckins(),
    listEventDays(),
    getNow(),
  ]);

  const requested = new URL(request.url).searchParams.get("mealId");
  const meal = meals.find((m) => m.id === requested) ?? pickDefaultMeal(meals, now);
  if (!meal) return NextResponse.json({ error: "Nenhuma refeição cadastrada." }, { status: 404 });

  const dashboard = computeMealDashboard({ meal, checkins, volunteers, teams });
  const dayTotals = days.map((d) => {
    const dayMeals = meals.filter((m) => dayKey(m.starts_at) === d.date);
    const ids = new Set(dayMeals.map((m) => m.id));
    return {
      label: d.label,
      consumed: checkins.filter((c) => ids.has(c.meal_id)).length,
      prepared: dayMeals.reduce((sum, m) => sum + m.total_prepared, 0),
    };
  });

  return NextResponse.json(
    {
      meal: { id: meal.id, label: meal.label, time: `${formatHM(meal.starts_at)}–${formatHM(meal.ends_at)}`, isMock: meal.is_mock },
      meals: meals.map((m) => ({ id: m.id, label: m.label })),
      dashboard,
      dayTotals,
      updatedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
