import { dayKey, toDate } from "./time";

export type RadioLike = { id: string; number: number; status: "ok" | "defeito" | "perdido" };
export type RadioCheckoutLike = {
  id: string;
  radio_id: string;
  volunteer_id: string;
  checked_out_at: string;
  returned_at: string | null;
};

export const BATTERY_STATES = ["carregado", "parcial", "descarregado"] as const;
export const CONDITIONS = ["ok", "defeito"] as const;

/** Hora local a partir da qual uma retirada do dia conta como "não devolvida". */
export const END_OF_DAY_HM = "23:00";

export function openCheckouts<T extends RadioCheckoutLike>(checkouts: T[]): T[] {
  return checkouts.filter((c) => c.returned_at === null);
}

export function availableRadios<R extends RadioLike>(radios: R[], checkouts: RadioCheckoutLike[]): R[] {
  const busy = new Set(openCheckouts(checkouts).map((c) => c.radio_id));
  return radios.filter((r) => r.status === "ok" && !busy.has(r.id)).sort((a, b) => a.number - b.number);
}

export type CheckoutDecision =
  | { ok: true; volunteerAlreadyHas: number[] }
  | { ok: false; reason: "em_uso" | "defeito" | "perdido" };

export function validateCheckout(params: {
  radio: RadioLike;
  checkouts: RadioCheckoutLike[];
  volunteerId: string;
  radios: RadioLike[];
}): CheckoutDecision {
  if (params.radio.status !== "ok") return { ok: false, reason: params.radio.status };
  const open = openCheckouts(params.checkouts);
  if (open.some((c) => c.radio_id === params.radio.id)) return { ok: false, reason: "em_uso" };
  const numberById = new Map(params.radios.map((r) => [r.id, r.number]));
  const volunteerAlreadyHas = open
    .filter((c) => c.volunteer_id === params.volunteerId)
    .map((c) => numberById.get(c.radio_id) ?? 0);
  return { ok: true, volunteerAlreadyHas };
}

/** Rádio devolvido com defeito sai da lista de disponíveis até um ADM liberar. */
export function statusAfterReturn(current: RadioLike["status"], condition: (typeof CONDITIONS)[number]): RadioLike["status"] {
  return condition === "defeito" ? "defeito" : current;
}

/** Não devolvido: retirada aberta de um dia anterior, ou do mesmo dia depois do horário de corte. */
export function isOverdue(checkout: RadioCheckoutLike, now: Date): boolean {
  if (checkout.returned_at !== null) return false;
  const outDay = dayKey(checkout.checked_out_at);
  const today = dayKey(now);
  if (outDay < today) return true;
  const cutoff = toDate(`${outDay}T${END_OF_DAY_HM}:00-03:00`);
  return now.getTime() >= cutoff.getTime();
}

export function maskRg(rg: string): string {
  const clean = rg.replace(/[^0-9A-Za-z]/g, "");
  return `*******${clean.slice(-2)}`;
}
