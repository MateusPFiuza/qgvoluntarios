import { cookies } from "next/headers";
import { config } from "@/lib/config";
import { isDemoMode } from "./env";
import { getAdminSession } from "./session";

export const SIM_CLOCK_COOKIE = "qg26_sim_now";

/**
 * "Agora" do app (seção 7). Relógio simulado por cookie: na demonstração
 * vale para qualquer pessoa (padrão: sábado no almoço); em produção só é
 * aceito com sessão de ADM ativa e afeta apenas a tela desse ADM.
 */
export async function getNow(): Promise<Date> {
  const raw = cookies().get(SIM_CLOCK_COOKIE)?.value;
  if (isDemoMode()) {
    const parsed = raw ? new Date(raw) : null;
    if (raw === "real") return new Date();
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date(config.demoDefaultNow);
  }
  if (raw && raw !== "real" && (await getAdminSession())) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export async function isClockSimulated(): Promise<boolean> {
  return Math.abs((await getNow()).getTime() - Date.now()) > 60_000;
}

/** Horário gravado nos registros: o simulado só na demonstração, para manter a história coerente. */
export async function getRecordTime(): Promise<Date> {
  return isDemoMode() ? getNow() : new Date();
}
