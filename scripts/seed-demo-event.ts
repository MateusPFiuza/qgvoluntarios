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
import { hashPassword } from "../lib/rules/credential";

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

// ---------------------------------------------------------------- Rádios (M2)
export const radios = Array.from({ length: 20 }, (_, i) => ({
  id: id("40000000", i + 1),
  number: i + 1,
  status: i + 1 === 8 ? "defeito" : "ok",
  notes: i + 1 === 8 ? "Antena quebrada (exemplo)" : null,
  is_mock: true,
}));

let coSeq = 0;
const co = (radioNo: number, volIdx: number, outAt: string, ret?: { at: string; battery: string; condition: string }) => ({
  id: id("50000000", ++coSeq),
  radio_id: radios[radioNo - 1].id,
  volunteer_id: volunteers[volIdx].id,
  checked_out_at: new Date(outAt).toISOString(),
  checked_out_by: qgAdminId,
  signature_path: null,
  returned_at: ret ? new Date(ret.at).toISOString() : null,
  returned_by: ret ? qgAdminId : null,
  returned_by_volunteer_id: ret ? volunteers[volIdx].id : null,
  battery_state: ret ? ret.battery : null,
  condition: ret ? ret.condition : null,
  is_mock: true,
});

export const radioCheckouts = [
  // Sexta: devolvidos ao fim do dia, um parcialmente carregado, um com defeito.
  co(7, 3, at(FRI, "16:30"), { at: at(FRI, "22:40"), battery: "parcial", condition: "ok" }),
  co(10, 4, at(FRI, "16:35"), { at: at(FRI, "22:45"), battery: "carregado", condition: "ok" }),
  co(8, 5, at(FRI, "16:40"), { at: at(FRI, "22:50"), battery: "descarregado", condition: "defeito" }),
  // Sexta: não devolvido.
  co(9, 6, at(FRI, "16:45")),
  // Sábado: retirados de manhã.
  ...[1, 2, 3, 4, 5, 6].map((n, i) => co(n, 9 + i * 3, at(SAT, `07:${String(40 + i * 3).padStart(2, "0")}`))),
];

write("radios.json", radios);
write("radio_checkouts.json", radioCheckouts);

// ------------------------------------------------- Cronograma, mapa e escala (M3)
// O cronograma vem da planilha oficial: npm run import:cronograma.

const LOC: [string, string, number, number, string][] = [
  ["Palco principal", "palco", 50, 14, "Arena das sessões"],
  ["Capela", "oracao", 16, 18, "Adoração e confissões"],
  ["Sala de oração", "oracao", 84, 18, "Intercessão"],
  ["Banheiros", "banheiro", 14, 44, "Masculino e feminino"],
  ["Refeitório", "refeitorio", 86, 44, "Refeições dos voluntários"],
  ["Enfermaria", "enfermaria", 14, 62, "Primeiros socorros"],
  ["QG dos Voluntários", "qg", 86, 62, "Rádios, achados e perdidos, apoio"],
  ["Loja", "loja", 34, 74, "Produtos do evento"],
  ["Espaço kids", "kids", 66, 74, "Crianças acompanhadas"],
  ["Acolhida", "acolhida", 22, 86, "Recepção dos participantes"],
  ["Chapelaria", "servico", 78, 86, "Guarda-volumes"],
  ["Portão principal", "portao", 50, 94, "Entrada e check-in"],
  ["Corredores", "servico", 50, 46, "Circulação e apoio"],
];
export const locations = LOC.map(([name, kind, x, y, description], i) => ({
  id: id("70000000", i + 1),
  name,
  kind,
  description,
  map_x: x,
  map_y: y,
  is_mock: true,
}));
const loc = (name: string) => locations.find((l) => l.name === name)!.id;

const TEAM_POST: Record<string, [string, string]> = {
  Acolhida: ["Acolhida", "Recepção dos participantes"],
  "Check In": ["Portão principal", "Check-in de pulseiras"],
  Chapelaria: ["Chapelaria", "Guarda-volumes"],
  Space: ["Palco principal", "Apoio de palco"],
  Rahamim: ["Capela", "Acolhimento na capela"],
  Spoleta: ["Corredores", "Apoio volante"],
  "Anástasis": ["Sala de oração", "Intercessão"],
  "Alimentação": ["Refeitório", "Preparo e serviço"],
  "QG dos Voluntários": ["QG dos Voluntários", "Plantão do QG"],
};

const DAY_BLOCKS: Record<string, [string, string, boolean][]> = {
  [FRI]: [["16:00", "19:00", false], ["19:00", "22:30", false]],
  [SAT]: [["07:30", "12:05", false], ["12:05", "14:00", true], ["14:00", "16:10", false], ["16:10", "16:40", true], ["16:40", "18:40", false], ["18:40", "19:30", true], ["19:30", "22:30", false]],
  [SUN]: [["07:30", "12:05", false], ["12:05", "13:35", true], ["13:35", "15:30", false], ["15:30", "16:00", true]],
};

let tsSeq = 0;
export const teamSchedule = teams.flatMap((t) =>
  Object.entries(DAY_BLOCKS).flatMap(([date, blocks]) =>
    blocks.map(([s, e, isBreak]) => {
      const [post, activity] = TEAM_POST[t.name] ?? ["Corredores", "Apoio"];
      const staysOnPost = t.name === "Alimentação" || t.name === "QG dos Voluntários";
      const onBreak = isBreak && !staysOnPost;
      return {
        id: id("80000000", ++tsSeq),
        team_id: t.id,
        day_id: dayId(date),
        starts_at: at(date, s),
        ends_at: at(date, e),
        location_id: onBreak ? loc("Refeitório") : loc(post),
        activity: onBreak ? "Intervalo (refeição no horário da equipe)" : isBreak && t.name === "Alimentação" ? "Servindo refeições" : activity,
        is_break: onBreak,
        is_mock: true,
      };
    }),
  ),
);

write("locations.json", locations);
write("team_schedule.json", teamSchedule);

// ------------------------------------------------------- Elogios e pins (M4)
export const praiseWindows = [
  { id: id("90000000", 1), name: "Sexta à noite", is_open: false, opened_at: new Date(at(FRI, "21:00")).toISOString(), closed_at: new Date(at(FRI, "23:00")).toISOString(), opened_by: qgAdminId, is_mock: true },
  { id: id("90000000", 2), name: "Sábado", is_open: true, opened_at: new Date(at(SAT, "09:00")).toISOString(), closed_at: null, opened_by: qgAdminId, is_mock: true },
];
const TRAITS = ["feliz", "facilitador", "por_inteiro"];
let prSeq = 0;
function seedPraises(windowIdx: number, count: number, seed: number) {
  const seen = new Set<string>();
  const out = [];
  for (let k = 0; out.length < count && k < count * 10; k++) {
    const s = volunteers[Math.floor(rand(seed + k * 3) * volunteers.length)];
    // Alguns voluntários recebem mais, para o ranking ter destaque.
    const r = volunteers[Math.floor(Math.pow(rand(seed + k * 7), 2) * volunteers.length)];
    const trait = TRAITS[Math.floor(rand(seed + k * 11) * 3)];
    const key = `${s.id}|${r.id}|${trait}`;
    if (s.id === r.id || seen.has(key)) continue;
    seen.add(key);
    out.push({ id: id("91000000", ++prSeq), window_id: praiseWindows[windowIdx].id, sender_id: s.id, receiver_id: r.id, trait, is_mock: true });
  }
  return out;
}
export const praises = [...seedPraises(0, 120, 500), ...seedPraises(1, 45, 900)];

export const pinAwards = [
  { id: id("92000000", 1), volunteer_id: volunteers[0].id, trait: "feliz", awarded_by: qgAdminId, awarded_at: new Date(at(FRI, "23:10")).toISOString(), delivered_at: new Date(at(SAT, "08:30")).toISOString(), is_mock: true },
  { id: id("92000000", 2), volunteer_id: volunteers[1].id, trait: "facilitador", awarded_by: qgAdminId, awarded_at: new Date(at(FRI, "23:12")).toISOString(), delivered_at: null, is_mock: true },
  { id: id("92000000", 3), volunteer_id: volunteers[2].id, trait: "por_inteiro", awarded_by: qgAdminId, awarded_at: new Date(at(FRI, "23:15")).toISOString(), delivered_at: null, is_mock: true },
];

write("praise_windows.json", praiseWindows);
write("praises.json", praises);
write("pin_awards.json", pinAwards);

write("event_days.json", eventDays);
write("meals.json", meals);
write("team_meal_windows.json", teamMealWindows);
write("meal_checkins.json", mealCheckins);

async function ensureRadioManager() {
  const accounts = adminAccounts as { volunteer_id: string; role?: string }[];
  if (accounts.some((a) => a.role === "radios")) return;
  const diego = volunteers.find((v) => v.full_name === "Diego Lima")!;
  accounts.push({
    volunteer_id: diego.id,
    password_hash: await hashPassword("radios2026"),
    can_manage_radios: true,
    role: "radios",
    locked_until: null,
  } as never);
  write("admin_accounts.json", accounts);
}

ensureRadioManager().then(() => console.log("Gestor de rádios: Diego Lima (senha radios2026)"));

console.log(`Refeições: ${meals.length}, janelas: ${teamMealWindows.length}, check-ins: ${mealCheckins.length}`);
