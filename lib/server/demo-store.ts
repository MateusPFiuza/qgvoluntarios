import teamsSeed from "@/supabase/seed/demo/teams.json";
import volunteersSeed from "@/supabase/seed/demo/volunteers.json";
import adminAccountsSeed from "@/supabase/seed/demo/admin_accounts.json";
import volunteersPrivateSeed from "@/supabase/seed/demo/volunteers_private.json";
import eventDaysSeed from "@/supabase/seed/demo/event_days.json";
import mealsSeed from "@/supabase/seed/demo/meals.json";
import teamMealWindowsSeed from "@/supabase/seed/demo/team_meal_windows.json";
import mealCheckinsSeed from "@/supabase/seed/demo/meal_checkins.json";
import scheduleItemsSeed from "@/supabase/seed/demo/schedule_items.json";
import locationsSeed from "@/supabase/seed/demo/locations.json";
import teamScheduleSeed from "@/supabase/seed/demo/team_schedule.json";
import radiosSeed from "@/supabase/seed/demo/radios.json";
import radioCheckoutsSeed from "@/supabase/seed/demo/radio_checkouts.json";

/**
 * Armazenamento em memória usado quando o Supabase real não está
 * configurado (por exemplo, neste ambiente de desenvolvimento, sem
 * acesso de rede a um projeto Supabase). Carrega a semente de
 * demonstração (seção 11) uma única vez por processo do servidor.
 *
 * Isto NÃO substitui o Postgres/Supabase em produção — é só o que
 * permite o M0 funcionar de ponta a ponta sem um projeto real conectado.
 * Quando SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estiverem definidos,
 * lib/server/repo.ts usa o Supabase de verdade em vez deste módulo.
 */

export type Team = {
  id: string;
  name: string;
  group_name: string | null;
  sort: number;
  is_mock: boolean;
};

export type Volunteer = {
  id: string;
  full_name: string;
  search_name: string;
  team_id: string | null;
  is_leader: boolean;
  photo_path: string | null;
  pin_hash: string | null;
  birth_dm: string | null;
  diet_notes: string | null;
  login_locked_until: string | null;
  active: boolean;
  is_mock: boolean;
};

export type AdminAccount = {
  volunteer_id: string;
  password_hash: string;
  can_manage_radios: boolean;
  role?: "adm" | "radios";
  locked_until: string | null;
};

export type LoginAttemptRow = {
  id: string;
  volunteer_id: string | null;
  kind: "volunteer" | "admin";
  ip_hash: string | null;
  ok: boolean;
  created_at: string;
};

export type VolunteerPrivate = { volunteer_id: string; cpf_enc: string; rg_enc: string | null };

export type EventDay = { id: string; date: string; label: string };

export type Meal = {
  id: string;
  day_id: string;
  kind: string;
  label: string;
  starts_at: string;
  ends_at: string;
  menu_text: string | null;
  total_prepared: number;
  is_mock: boolean;
};

export type TeamMealWindow = { team_id: string; meal_id: string; starts_at: string; ends_at: string; is_mock: boolean };

export type MealCheckin = {
  id: string;
  volunteer_id: string;
  meal_id: string;
  method: "qr" | "search";
  checked_by: string | null;
  created_at: string;
  is_mock?: boolean;
};

export type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export type Radio = { id: string; number: number; status: "ok" | "defeito" | "perdido"; notes: string | null; is_mock: boolean };

export type RadioCheckout = {
  id: string;
  radio_id: string;
  volunteer_id: string;
  checked_out_at: string;
  checked_out_by: string | null;
  signature_path: string | null;
  returned_at: string | null;
  returned_by: string | null;
  returned_by_volunteer_id: string | null;
  battery_state: "carregado" | "parcial" | "descarregado" | null;
  condition: "ok" | "defeito" | null;
  is_mock?: boolean;
};

export type ScheduleItem = {
  id: string;
  day_id: string;
  session_label: string;
  starts_at: string;
  ends_at: string;
  title: string;
  performer: string | null;
  kind: string;
  is_mock: boolean;
};

export type Location = { id: string; name: string; kind: string; description: string | null; map_x: number; map_y: number; is_mock: boolean };

export type TeamScheduleRow = {
  id: string;
  team_id: string;
  day_id: string;
  starts_at: string;
  ends_at: string;
  location_id: string | null;
  activity: string;
  is_break: boolean;
  is_mock: boolean;
};

type StoreShape = {
  teams: Team[];
  volunteers: Volunteer[];
  volunteersPrivate: VolunteerPrivate[];
  adminAccounts: AdminAccount[];
  loginAttempts: LoginAttemptRow[];
  eventDays: EventDay[];
  meals: Meal[];
  teamMealWindows: TeamMealWindow[];
  mealCheckins: MealCheckin[];
  auditLog: AuditRow[];
  scheduleItems: ScheduleItem[];
  locations: Location[];
  teamSchedule: TeamScheduleRow[];
  radios: Radio[];
  radioCheckouts: RadioCheckout[];
  /** Assinaturas em memória (data URL PNG), no lugar do bucket privado do Supabase. */
  signatures: Map<string, string>;
};

const globalForDemoStore = globalThis as unknown as { __qg26DemoStoreV4?: StoreShape };

function initStore(): StoreShape {
  return {
    teams: structuredClone(teamsSeed) as Team[],
    volunteers: structuredClone(volunteersSeed) as Volunteer[],
    volunteersPrivate: structuredClone(volunteersPrivateSeed) as VolunteerPrivate[],
    adminAccounts: structuredClone(adminAccountsSeed) as AdminAccount[],
    loginAttempts: [],
    eventDays: structuredClone(eventDaysSeed) as EventDay[],
    meals: structuredClone(mealsSeed) as Meal[],
    teamMealWindows: structuredClone(teamMealWindowsSeed) as TeamMealWindow[],
    mealCheckins: structuredClone(mealCheckinsSeed) as MealCheckin[],
    auditLog: [],
    scheduleItems: structuredClone(scheduleItemsSeed) as ScheduleItem[],
    locations: structuredClone(locationsSeed) as Location[],
    teamSchedule: structuredClone(teamScheduleSeed) as TeamScheduleRow[],
    radios: structuredClone(radiosSeed) as Radio[],
    radioCheckouts: structuredClone(radioCheckoutsSeed) as RadioCheckout[],
    signatures: new Map(),
  };
}

export function getDemoStore(): StoreShape {
  if (!globalForDemoStore.__qg26DemoStoreV4) {
    globalForDemoStore.__qg26DemoStoreV4 = initStore();
  }
  return globalForDemoStore.__qg26DemoStoreV4;
}
