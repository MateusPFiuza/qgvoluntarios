import { getSupabaseServerClient } from "./supabase";
import { getDemoStore, type Location, type ScheduleItem, type TeamScheduleRow } from "./demo-store";

export async function listScheduleItems(): Promise<ScheduleItem[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("schedule_items").select("*").order("starts_at");
    if (error) throw error;
    return data as ScheduleItem[];
  }
  return getDemoStore().scheduleItems.slice().sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export async function listLocations(): Promise<Location[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("locations").select("*").order("name");
    if (error) throw error;
    return (data as Location[]).map((l) => ({ ...l, map_x: Number(l.map_x), map_y: Number(l.map_y) }));
  }
  return getDemoStore().locations.slice();
}

export async function listTeamSchedule(teamId?: string | null): Promise<TeamScheduleRow[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    let q = supabase.from("team_schedule").select("*").order("starts_at");
    if (teamId) q = q.eq("team_id", teamId);
    const { data, error } = await q;
    if (error) throw error;
    return data as TeamScheduleRow[];
  }
  return getDemoStore()
    .teamSchedule.filter((r) => !teamId || r.team_id === teamId)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}
