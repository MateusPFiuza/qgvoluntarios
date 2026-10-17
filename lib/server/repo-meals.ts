import { randomUUID } from "node:crypto";
import { getSupabaseServerClient } from "./supabase";
import { getDemoStore, type EventDay, type Meal, type MealCheckin, type TeamMealWindow, type Volunteer } from "./demo-store";

const PG_UNIQUE_VIOLATION = "23505";

export type VolunteerPublic = Pick<Volunteer, "id" | "full_name" | "team_id" | "is_leader" | "photo_path" | "is_mock">;
export type VolunteerWithDiet = VolunteerPublic & { diet_notes: string | null };

export async function listEventDays(): Promise<EventDay[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("event_days").select("id, date, label").order("date");
    if (error) throw error;
    return data as EventDay[];
  }
  return getDemoStore().eventDays.slice();
}

export async function listMeals(): Promise<Meal[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("meals").select("*").order("starts_at");
    if (error) throw error;
    return data as Meal[];
  }
  return getDemoStore().meals.slice().sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export async function getMeal(id: string): Promise<Meal | null> {
  return (await listMeals()).find((m) => m.id === id) ?? null;
}

export async function listTeamMealWindows(): Promise<TeamMealWindow[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("team_meal_windows").select("*");
    if (error) throw error;
    return data as TeamMealWindow[];
  }
  return getDemoStore().teamMealWindows.slice();
}

export async function getTeamMealWindow(teamId: string | null, mealId: string): Promise<TeamMealWindow | null> {
  if (!teamId) return null;
  return (await listTeamMealWindows()).find((w) => w.team_id === teamId && w.meal_id === mealId) ?? null;
}

export async function listCheckins(filter: { mealId?: string; volunteerId?: string } = {}): Promise<MealCheckin[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    let q = supabase.from("meal_checkins").select("id, volunteer_id, meal_id, method, checked_by, created_at");
    if (filter.mealId) q = q.eq("meal_id", filter.mealId);
    if (filter.volunteerId) q = q.eq("volunteer_id", filter.volunteerId);
    const { data, error } = await q;
    if (error) throw error;
    return data as MealCheckin[];
  }
  return getDemoStore().mealCheckins.filter(
    (c) => (!filter.mealId || c.meal_id === filter.mealId) && (!filter.volunteerId || c.volunteer_id === filter.volunteerId),
  );
}

export async function getCheckin(volunteerId: string, mealId: string): Promise<MealCheckin | null> {
  return (await listCheckins({ volunteerId, mealId }))[0] ?? null;
}

/**
 * Grava o check-in. A unicidade (voluntário, refeição) é do banco: dois
 * ADMs ao mesmo tempo resultam em um aceito e outro recebendo o existente.
 */
export async function insertCheckin(params: {
  volunteerId: string;
  mealId: string;
  method: "qr" | "search";
  checkedBy: string;
  createdAt: Date;
}): Promise<{ ok: true; row: MealCheckin } | { ok: false; existing: MealCheckin }> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("meal_checkins")
      .insert({
        volunteer_id: params.volunteerId,
        meal_id: params.mealId,
        method: params.method,
        checked_by: params.checkedBy,
        created_at: params.createdAt.toISOString(),
      })
      .select("id, volunteer_id, meal_id, method, checked_by, created_at")
      .single();
    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) {
        const existing = await getCheckin(params.volunteerId, params.mealId);
        if (existing) return { ok: false, existing };
      }
      throw error;
    }
    return { ok: true, row: data as MealCheckin };
  }

  // Em memória, verificar e inserir sem await entre as duas etapas é atômico no processo.
  const store = getDemoStore();
  const existing = store.mealCheckins.find((c) => c.volunteer_id === params.volunteerId && c.meal_id === params.mealId);
  if (existing) return { ok: false, existing };
  const row: MealCheckin = {
    id: randomUUID(),
    volunteer_id: params.volunteerId,
    meal_id: params.mealId,
    method: params.method,
    checked_by: params.checkedBy,
    created_at: params.createdAt.toISOString(),
  };
  store.mealCheckins.push(row);
  return { ok: true, row };
}

export async function deleteCheckin(id: string): Promise<MealCheckin | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("meal_checkins")
      .delete()
      .eq("id", id)
      .select("id, volunteer_id, meal_id, method, checked_by, created_at")
      .maybeSingle();
    if (error) throw error;
    return (data as MealCheckin | null) ?? null;
  }
  const store = getDemoStore();
  const idx = store.mealCheckins.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  return store.mealCheckins.splice(idx, 1)[0];
}

/** Lista para o QG (inclui restrição alimentar). Nunca usar em telas de voluntário. */
export async function listActiveVolunteersWithDiet(): Promise<VolunteerWithDiet[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("volunteers")
      .select("id, full_name, team_id, is_leader, photo_path, is_mock, diet_notes")
      .eq("active", true)
      .order("full_name");
    if (error) throw error;
    return data as VolunteerWithDiet[];
  }
  return getDemoStore()
    .volunteers.filter((v) => v.active)
    .map(({ id, full_name, team_id, is_leader, photo_path, is_mock, diet_notes }) => ({
      id,
      full_name,
      team_id,
      is_leader,
      photo_path,
      is_mock,
      diet_notes,
    }));
}

export async function writeAudit(params: {
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from("audit_log").insert({
      actor_id: params.actorId,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId,
      details: params.details ?? {},
    });
    if (error) throw error;
    return;
  }
  getDemoStore().auditLog.push({
    id: randomUUID(),
    actor_id: params.actorId,
    action: params.action,
    entity: params.entity,
    entity_id: params.entityId,
    details: params.details ?? {},
    created_at: new Date().toISOString(),
  });
}
