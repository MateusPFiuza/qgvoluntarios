import { randomUUID } from "node:crypto";
import { getSupabaseServerClient } from "./supabase";
import { getDemoStore, type AdminAccount, type LoginAttemptRow, type Team, type Volunteer } from "./demo-store";
import type { AttemptRecord } from "@/lib/rules/lockout";

/**
 * Camada única de acesso a dados: usa o Supabase real quando configurado
 * (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY), ou a semente de
 * demonstração em memória (lib/server/demo-store.ts) quando não está.
 *
 * Todas as rotas/API chamam só este módulo — nunca lib/server/demo-store
 * ou @supabase/supabase-js diretamente — para que trocar de um para o
 * outro não exija mudar nada além das env vars.
 */

export async function listTeams(): Promise<Team[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("teams").select("*").order("sort");
    if (error) throw error;
    return data as Team[];
  }
  return getDemoStore().teams.slice().sort((a, b) => a.sort - b.sort);
}

export async function searchVolunteersByNormalizedName(normalizedQuery: string): Promise<Volunteer[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("volunteers")
      .select("*")
      .eq("active", true)
      .ilike("search_name", `%${normalizedQuery}%`)
      .limit(20);
    if (error) throw error;
    return data as Volunteer[];
  }
  return getDemoStore()
    .volunteers.filter((v) => v.active && v.search_name.includes(normalizedQuery))
    .slice(0, 20);
}

export async function getVolunteerById(id: string): Promise<Volunteer | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("volunteers").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as Volunteer | null) ?? null;
  }
  return getDemoStore().volunteers.find((v) => v.id === id) ?? null;
}

export async function getAdminAccountByVolunteerId(volunteerId: string): Promise<AdminAccount | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("admin_accounts")
      .select("*")
      .eq("volunteer_id", volunteerId)
      .maybeSingle();
    if (error) throw error;
    return (data as AdminAccount | null) ?? null;
  }
  return getDemoStore().adminAccounts.find((a) => a.volunteer_id === volunteerId) ?? null;
}

export async function recordLoginAttempt(params: {
  volunteerId: string | null;
  kind: "volunteer" | "admin";
  ipHash: string | null;
  ok: boolean;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from("login_attempts").insert({
      volunteer_id: params.volunteerId,
      kind: params.kind,
      ip_hash: params.ipHash,
      ok: params.ok,
    });
    if (error) throw error;
    return;
  }
  const row: LoginAttemptRow = {
    id: randomUUID(),
    volunteer_id: params.volunteerId,
    kind: params.kind,
    ip_hash: params.ipHash,
    ok: params.ok,
    created_at: new Date().toISOString(),
  };
  getDemoStore().loginAttempts.push(row);
}

/** Retorna as tentativas recentes (por voluntário ou por IP) já no formato usado pela regra de bloqueio. */
export async function getRecentAttempts(params: {
  volunteerId?: string | null;
  ipHash?: string | null;
  kind: "volunteer" | "admin";
  sinceMinutes: number;
}): Promise<AttemptRecord[]> {
  const since = new Date(Date.now() - params.sinceMinutes * 60_000);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    let query = supabase
      .from("login_attempts")
      .select("ok, created_at")
      .eq("kind", params.kind)
      .gte("created_at", since.toISOString());
    if (params.volunteerId) query = query.eq("volunteer_id", params.volunteerId);
    if (params.ipHash) query = query.eq("ip_hash", params.ipHash);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r: any) => ({ ok: r.ok, createdAt: new Date(r.created_at) }));
  }

  return getDemoStore()
    .loginAttempts.filter((a) => {
      if (a.kind !== params.kind) return false;
      if (new Date(a.created_at) < since) return false;
      if (params.volunteerId && a.volunteer_id !== params.volunteerId) return false;
      if (params.ipHash && a.ip_hash !== params.ipHash) return false;
      return true;
    })
    .map((a) => ({ ok: a.ok, createdAt: new Date(a.created_at) }));
}

export async function setVolunteerLock(volunteerId: string, until: Date | null): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase
      .from("volunteers")
      .update({ login_locked_until: until?.toISOString() ?? null })
      .eq("id", volunteerId);
    if (error) throw error;
    return;
  }
  const v = getDemoStore().volunteers.find((x) => x.id === volunteerId);
  if (v) v.login_locked_until = until?.toISOString() ?? null;
}

export * from "./repo-meals";
