import { randomUUID } from "node:crypto";
import { getSupabaseServerClient } from "./supabase";
import { getDemoStore, type Radio, type RadioCheckout } from "./demo-store";
import { decryptPersonalField, maskCpf } from "./crypto";
import { maskRg } from "@/lib/rules/radios";

const PG_UNIQUE_VIOLATION = "23505";
const SIGNATURE_BUCKET = "signatures";

export async function listRadios(): Promise<Radio[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("radios").select("id, number, status, notes, is_mock").order("number");
    if (error) throw error;
    return data as Radio[];
  }
  return getDemoStore().radios.slice().sort((a, b) => a.number - b.number);
}

export async function listRadioCheckouts(filter: { radioId?: string; openOnly?: boolean } = {}): Promise<RadioCheckout[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    let q = supabase.from("radio_checkouts").select("*").order("checked_out_at", { ascending: false });
    if (filter.radioId) q = q.eq("radio_id", filter.radioId);
    if (filter.openOnly) q = q.is("returned_at", null);
    const { data, error } = await q;
    if (error) throw error;
    return data as RadioCheckout[];
  }
  return getDemoStore()
    .radioCheckouts.filter((c) => (!filter.radioId || c.radio_id === filter.radioId) && (!filter.openOnly || c.returned_at === null))
    .sort((a, b) => b.checked_out_at.localeCompare(a.checked_out_at));
}

/** Cria a retirada. O índice único parcial do banco impede duas retiradas abertas do mesmo rádio. */
export async function createRadioCheckout(params: {
  radioId: string;
  volunteerId: string;
  operatorId: string;
  at: Date;
}): Promise<{ ok: true; row: RadioCheckout } | { ok: false }> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("radio_checkouts")
      .insert({ radio_id: params.radioId, volunteer_id: params.volunteerId, checked_out_by: params.operatorId, checked_out_at: params.at.toISOString() })
      .select("*")
      .single();
    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) return { ok: false };
      throw error;
    }
    return { ok: true, row: data as RadioCheckout };
  }
  const store = getDemoStore();
  if (store.radioCheckouts.some((c) => c.radio_id === params.radioId && c.returned_at === null)) return { ok: false };
  const row: RadioCheckout = {
    id: randomUUID(),
    radio_id: params.radioId,
    volunteer_id: params.volunteerId,
    checked_out_at: params.at.toISOString(),
    checked_out_by: params.operatorId,
    signature_path: null,
    returned_at: null,
    returned_by: null,
    returned_by_volunteer_id: null,
    battery_state: null,
    condition: null,
  };
  store.radioCheckouts.push(row);
  return { ok: true, row };
}

export async function deleteRadioCheckout(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from("radio_checkouts").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const store = getDemoStore();
  store.radioCheckouts = store.radioCheckouts.filter((c) => c.id !== id);
}

/** Grava a assinatura (PNG) em armazenamento privado e associa à retirada. */
export async function saveSignature(checkoutId: string, png: Buffer): Promise<string> {
  const path = `${checkoutId}.png`;
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.storage.from(SIGNATURE_BUCKET).upload(path, png, { contentType: "image/png", upsert: false });
    if (error) throw error;
    const { error: updErr } = await supabase.from("radio_checkouts").update({ signature_path: path }).eq("id", checkoutId);
    if (updErr) throw updErr;
    return path;
  }
  const store = getDemoStore();
  store.signatures.set(path, png.toString("base64"));
  const row = store.radioCheckouts.find((c) => c.id === checkoutId);
  if (row) row.signature_path = path;
  return path;
}

/** URL assinada de 60 s (Supabase) ou o PNG em memória. */
export async function readSignature(path: string): Promise<{ signedUrl: string } | { png: Buffer } | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.storage.from(SIGNATURE_BUCKET).createSignedUrl(path, 60);
    if (error) return null;
    return { signedUrl: data.signedUrl };
  }
  const b64 = getDemoStore().signatures.get(path);
  return b64 ? { png: Buffer.from(b64, "base64") } : null;
}

export async function returnRadioCheckout(params: {
  checkoutId: string;
  operatorId: string;
  returnedByVolunteerId: string | null;
  battery: "carregado" | "parcial" | "descarregado";
  condition: "ok" | "defeito";
  at: Date;
}): Promise<RadioCheckout | null> {
  const patch = {
    returned_at: params.at.toISOString(),
    returned_by: params.operatorId,
    returned_by_volunteer_id: params.returnedByVolunteerId,
    battery_state: params.battery,
    condition: params.condition,
  };
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("radio_checkouts")
      .update(patch)
      .eq("id", params.checkoutId)
      .is("returned_at", null)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return (data as RadioCheckout | null) ?? null;
  }
  const row = getDemoStore().radioCheckouts.find((c) => c.id === params.checkoutId && c.returned_at === null);
  if (!row) return null;
  Object.assign(row, patch);
  return row;
}

export async function setRadioStatus(radioId: string, status: Radio["status"]): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from("radios").update({ status }).eq("id", radioId);
    if (error) throw error;
    return;
  }
  const r = getDemoStore().radios.find((x) => x.id === radioId);
  if (r) r.status = status;
}

/**
 * Único ponto que lê CPF/RG (seção 12). Devolve sempre mascarado; o valor
 * completo nunca sai desta função.
 */
export async function getMaskedDocuments(volunteerId: string): Promise<{ cpf: string; rg: string | null; cpfLast4: string } | null> {
  let row: { cpf_enc: string; rg_enc: string | null } | null;
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("volunteers_private").select("cpf_enc, rg_enc").eq("volunteer_id", volunteerId).maybeSingle();
    if (error) throw error;
    row = data;
  } else {
    row = getDemoStore().volunteersPrivate.find((p) => p.volunteer_id === volunteerId) ?? null;
  }
  if (!row) return null;

  const open = (enc: string) => (enc.startsWith("demo-enc:") ? enc.slice("demo-enc:".length) : decryptPersonalField(enc));
  const cpfRaw = open(row.cpf_enc);
  const cpf = maskCpf(cpfRaw);
  return {
    cpf,
    cpfLast4: cpf.slice(-4),
    rg: row.rg_enc ? (row.rg_enc.startsWith("demo-enc:") ? row.rg_enc.slice(9) : maskRg(open(row.rg_enc))) : null,
  };
}
