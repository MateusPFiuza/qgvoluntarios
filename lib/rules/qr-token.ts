import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Token do QR pessoal (seção 10): HMAC do id do voluntário + janela de 30 s.
 * Aceita a janela atual e a anterior, então um print vale no máximo 60 s.
 */

export const QR_WINDOW_MS = 30_000;
const PREFIX = "g26";

function windowOf(nowMs: number): number {
  return Math.floor(nowMs / QR_WINDOW_MS);
}

function sign(volunteerId: string, window: number, secret: string): string {
  return createHmac("sha256", secret).update(`${volunteerId}.${window}`).digest("base64url").slice(0, 22);
}

export function generateQrToken(volunteerId: string, secret: string, nowMs: number): string {
  const w = windowOf(nowMs);
  return `${PREFIX}.${volunteerId}.${w}.${sign(volunteerId, w, secret)}`;
}

export function msUntilNextWindow(nowMs: number): number {
  return QR_WINDOW_MS - (nowMs % QR_WINDOW_MS);
}

export type QrVerification = { ok: true; volunteerId: string } | { ok: false; reason: "formato" | "expirado" | "assinatura" };

export function verifyQrToken(token: string, secret: string, nowMs: number): QrVerification {
  const parts = token.trim().split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) return { ok: false, reason: "formato" };
  const [, volunteerId, windowStr, sig] = parts;
  if (!/^[0-9a-f-]{36}$/i.test(volunteerId) || !/^\d+$/.test(windowStr)) return { ok: false, reason: "formato" };

  const w = Number(windowStr);
  const current = windowOf(nowMs);
  if (w !== current && w !== current - 1) return { ok: false, reason: "expirado" };

  const expected = Buffer.from(sign(volunteerId, w, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "assinatura" };
  }
  return { ok: true, volunteerId };
}
