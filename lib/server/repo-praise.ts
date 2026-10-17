import { randomUUID } from "node:crypto";
import { getSupabaseServerClient } from "./supabase";
import { getDemoStore, type PinAward, type PraiseWindow } from "./demo-store";
import { aggregateTotals, myPraiseMap, reciprocalPairs, type PraiseTotal, type Trait } from "@/lib/rules/praise";

/**
 * Elogios. Regra de anonimato (seção 8, critério 4): nenhuma função deste
 * módulo devolve sender_id. As leituras são só totais agregados ou "o que
 * eu mesmo enviei".
 */

const PG_UNIQUE_VIOLATION = "23505";

export async function listPraiseWindows(): Promise<PraiseWindow[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("praise_windows").select("id, name, is_open, opened_at, closed_at, opened_by, is_mock").order("created_at", { ascending: false });
    if (error) throw error;
    return data as PraiseWindow[];
  }
  return getDemoStore().praiseWindows.slice().reverse();
}

export async function getOpenPraiseWindow(): Promise<PraiseWindow | null> {
  return (await listPraiseWindows()).find((w) => w.is_open) ?? null;
}

export async function openPraiseWindow(name: string, adminId: string, at: Date): Promise<PraiseWindow> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error: closeErr } = await supabase.from("praise_windows").update({ is_open: false, closed_at: at.toISOString() }).eq("is_open", true);
    if (closeErr) throw closeErr;
    const { data, error } = await supabase
      .from("praise_windows")
      .insert({ name, is_open: true, opened_at: at.toISOString(), opened_by: adminId })
      .select("id, name, is_open, opened_at, closed_at, opened_by, is_mock")
      .single();
    if (error) throw error;
    return data as PraiseWindow;
  }
  const store = getDemoStore();
  for (const w of store.praiseWindows) if (w.is_open) Object.assign(w, { is_open: false, closed_at: at.toISOString() });
  const row: PraiseWindow = { id: randomUUID(), name, is_open: true, opened_at: at.toISOString(), closed_at: null, opened_by: adminId };
  store.praiseWindows.push(row);
  return row;
}

export async function closePraiseWindow(id: string, at: Date): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("praise_windows").update({ is_open: false, closed_at: at.toISOString() }).eq("id", id).eq("is_open", true).select("id");
    if (error) throw error;
    return (data ?? []).length > 0;
  }
  const w = getDemoStore().praiseWindows.find((x) => x.id === id && x.is_open);
  if (!w) return false;
  Object.assign(w, { is_open: false, closed_at: at.toISOString() });
  return true;
}

/** Liga o elogio. Repetir não duplica: a unicidade do banco decide. */
export async function addPraise(p: { windowId: string; senderId: string; receiverId: string; trait: Trait }): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from("praises").insert({ window_id: p.windowId, sender_id: p.senderId, receiver_id: p.receiverId, trait: p.trait });
    if (error && error.code !== PG_UNIQUE_VIOLATION) throw error;
    return;
  }
  const store = getDemoStore();
  const exists = store.praises.some((x) => x.window_id === p.windowId && x.sender_id === p.senderId && x.receiver_id === p.receiverId && x.trait === p.trait);
  if (!exists) store.praises.push({ id: randomUUID(), window_id: p.windowId, sender_id: p.senderId, receiver_id: p.receiverId, trait: p.trait });
}

/** Desliga o ícone: apaga o próprio elogio enquanto a janela está aberta (SUPOSIÇÃO da seção 8). */
export async function removePraise(p: { windowId: string; senderId: string; receiverId: string; trait: Trait }): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from("praises").delete().match({ window_id: p.windowId, sender_id: p.senderId, receiver_id: p.receiverId, trait: p.trait });
    if (error) throw error;
    return;
  }
  const store = getDemoStore();
  store.praises = store.praises.filter((x) => !(x.window_id === p.windowId && x.sender_id === p.senderId && x.receiver_id === p.receiverId && x.trait === p.trait));
}

/** Só o que o próprio voluntário acendeu nesta janela. */
export async function listMyPraises(windowId: string, senderId: string): Promise<Record<string, Trait[]>> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("praises").select("receiver_id, trait").eq("window_id", windowId).eq("sender_id", senderId);
    if (error) throw error;
    const out: Record<string, Trait[]> = {};
    for (const r of data as { receiver_id: string; trait: Trait }[]) (out[r.receiver_id] ??= []).push(r.trait);
    return out;
  }
  return myPraiseMap(getDemoStore().praises, senderId, windowId);
}

export async function listPraiseTotals(): Promise<PraiseTotal[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("praise_totals_by_window").select("window_id, receiver_id, trait, total");
    if (error) throw error;
    return data as PraiseTotal[];
  }
  return aggregateTotals(getDemoStore().praises);
}

export async function countReciprocalPairs(windowId: string): Promise<number> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.rpc("praise_reciprocal_pairs", { p_window: windowId });
    if (error) throw error;
    return Number(data ?? 0);
  }
  return reciprocalPairs(getDemoStore().praises, windowId);
}

export async function listPinAwards(): Promise<PinAward[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("pin_awards").select("*").order("awarded_at", { ascending: false });
    if (error) throw error;
    return data as PinAward[];
  }
  return getDemoStore().pinAwards.slice().sort((a, b) => b.awarded_at.localeCompare(a.awarded_at));
}

export async function awardPin(p: { volunteerId: string; trait: Trait; adminId: string; at: Date }): Promise<{ ok: boolean }> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from("pin_awards").insert({ volunteer_id: p.volunteerId, trait: p.trait, awarded_by: p.adminId, awarded_at: p.at.toISOString() });
    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) return { ok: false };
      throw error;
    }
    return { ok: true };
  }
  const store = getDemoStore();
  if (store.pinAwards.some((a) => a.volunteer_id === p.volunteerId && a.trait === p.trait)) return { ok: false };
  store.pinAwards.push({ id: randomUUID(), volunteer_id: p.volunteerId, trait: p.trait, awarded_by: p.adminId, awarded_at: p.at.toISOString(), delivered_at: null });
  return { ok: true };
}

export async function updatePinAward(id: string, action: "deliver" | "undeliver" | "remove", at: Date): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const q =
      action === "remove"
        ? supabase.from("pin_awards").delete().eq("id", id).select("id")
        : supabase.from("pin_awards").update({ delivered_at: action === "deliver" ? at.toISOString() : null }).eq("id", id).select("id");
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).length > 0;
  }
  const store = getDemoStore();
  const idx = store.pinAwards.findIndex((a) => a.id === id);
  if (idx < 0) return false;
  if (action === "remove") store.pinAwards.splice(idx, 1);
  else store.pinAwards[idx].delivered_at = action === "deliver" ? at.toISOString() : null;
  return true;
}

export async function hasAcceptedPrivacy(volunteerId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("volunteers").select("privacy_accepted_at").eq("id", volunteerId).maybeSingle();
    if (error) throw error;
    return Boolean(data?.privacy_accepted_at);
  }
  return getDemoStore().privacyAccepted.has(volunteerId);
}

export async function acceptPrivacy(volunteerId: string, at: Date): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from("volunteers").update({ privacy_accepted_at: at.toISOString() }).eq("id", volunteerId);
    if (error) throw error;
    return;
  }
  getDemoStore().privacyAccepted.add(volunteerId);
}

export async function getExplainerVideoUrl(): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase.from("app_settings").select("value").eq("key", "explainer_video_url").maybeSingle();
    return typeof data?.value === "string" ? data.value : null;
  }
  return process.env.EXPLAINER_VIDEO_URL || null;
}
