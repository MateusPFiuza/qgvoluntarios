/**
 * Gera a semente de demonstração dos módulos do evento (refeições, rádios,
 * cronograma, mapa, elogios), em supabase/seed/demo/*.json. Tudo é
 * fictício e marcado com is_mock. Depende de volunteers.json e teams.json
 * já gerados por scripts/seed-demo.ts.
 *
 * Uso: npm run seed:demo:event
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import teams from "../supabase/seed/demo/teams.json";
import volunteers from "../supabase/seed/demo/volunteers.json";
import adminAccounts from "../supabase/seed/demo/admin_accounts.json";

const outDir = path.resolve(__dirname, "../supabase/seed/demo");
const write = (name: string, data: unknown) => writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2) + "\n");

const id = (prefix: string, n: number) => `${prefix}-0000-4000-8000-${String(n).padStart(12, "0")}`;
const at = (date: string, hm: string) => `${date}T${hm}:00-03:00`;
// Pseudo-aleatório determinístico para a semente ser reproduzível.
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const FRI = "2026-12-11";
const SAT = "2026-12-12";
const SUN = "2026-12-13";

export const eventDays = [
  { id: id("10000000", 11), date: FRI, label: "Sexta" },
  { id: id("10000000", 12), date: SAT, label: "Sábado" },
  { id: id("10000000", 13), date: SUN, label: "Domingo" },
];
const dayId = (date: string) => eventDays.find((d) => d.date === date)!.id;

const MEAL_DEFS: [string, string, string, string, string, string][] = [
  [FRI, "janta", "Janta de sexta", "17:00", "19:00", "Arroz, feijão, frango assado, salada verde e pudim."],
  [SAT, "cafe", "Café de sábado", "06:30", "08:30", "Pão francês, frios, frutas, café e leite."],
  [SAT, "almoco", "Almoço de sábado", "12:05", "14:00", "Arroz, feijão, carne de panela, legumes e suco."],
  [SAT, "lanche", "Lanche de sábado", "16:10", "16:40", "Bolo de fubá, pão de queijo e café."],
  [SAT, "janta", "Janta de sábado", "18:40", "19:30", "Macarronada à bolonhesa, salada e gelatina."],
  [SUN, "cafe", "Café de domingo", "06:30", "08:30", "Pão, bolo, frutas, café e leite."],
  [SUN, "almoco", "Almoço de domingo", "12:05", "13:35", "Arroz, feijão tropeiro, frango grelhado e salada."],
  [SUN, "lanche", "Lanche de domingo", "15:30", "16:00", "Sanduíche natural e suco."],
];

export const meals = MEAL_DEFS.map(([date, kind, label, s, e, menu], i) => ({
  id: id("20000000", i + 1),
  day_id: dayId(date),
  kind,
  label,
  starts_at: at(date, s),
  ends_at: at(date, e),
  menu_text: menu,
  total_prepared: 50,
  is_mock: true,
}));

const SLOTS = 3;
export const teamMealWindows = meals.flatMap((m) => {
  const start = new Date(m.starts_at).getTime();
  const slotMs = (new Date(m.ends_at).getTime() - start) / SLOTS;
  return teams.map((t, i) => {
    const slot = i % SLOTS;
    return {
      team_id: t.id,
      meal_id: m.id,
      starts_at: new Date(start + slot * slotMs).toISOString(),
      ends_at: new Date(start + (slot + 1) * slotMs).toISOString(),
      is_mock: true,
    };
  });
});

const qgAdminId = adminAccounts[0].volunteer_id;
let checkinSeq = 0;
function seedCheckins(mealIndex: number, share: number, fromHM: string, toHM: string, date: string) {
  const meal = meals[mealIndex];
  const from = new Date(at(date, fromHM)).getTime();
  const to = new Date(at(date, toHM)).getTime();
  return volunteers
    .filter((_, i) => rand(i + mealIndex * 101) < share)
    .map((v, i) => ({
      id: id("30000000", ++checkinSeq),
      volunteer_id: v.id,
      meal_id: meal.id,
      method: rand(i + 7) < 0.8 ? "qr" : "search",
      checked_by: qgAdminId,
      created_at: new Date(from + rand(i + mealIndex) * (to - from)).toISOString(),
      is_mock: true,
    }));
}

export const mealCheckins = [
  ...seedCheckins(0, 0.85, "17:05", "18:50", FRI),
  ...seedCheckins(1, 0.7, "06:35", "08:20", SAT),
  ...seedCheckins(2, 0.35, "12:06", "12:38", SAT),
];

write("event_days.json", eventDays);
write("meals.json", meals);
write("team_meal_windows.json", teamMealWindows);
write("meal_checkins.json", mealCheckins);

console.log(`Refeições: ${meals.length}, janelas: ${teamMealWindows.length}, check-ins: ${mealCheckins.length}`);
