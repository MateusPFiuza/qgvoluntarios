import { describe, expect, it } from "vitest";
import { evaluateLockout, MAX_ATTEMPTS } from "./lockout";

const BASE = new Date("2026-10-17T12:00:00Z");

function minutesAgo(minutes: number): Date {
  return new Date(BASE.getTime() - minutes * 60_000);
}

describe("evaluateLockout", () => {
  it("não bloqueia com menos de 5 tentativas erradas", () => {
    const attempts = Array.from({ length: MAX_ATTEMPTS - 1 }, () => ({
      ok: false,
      createdAt: minutesAgo(1),
    }));
    expect(evaluateLockout(attempts, BASE)).toEqual({ locked: false });
  });

  it("bloqueia após 5 tentativas erradas em 15 minutos", () => {
    const attempts = Array.from({ length: MAX_ATTEMPTS }, (_, i) => ({
      ok: false,
      createdAt: minutesAgo(10 - i),
    }));
    const result = evaluateLockout(attempts, BASE);
    expect(result.locked).toBe(true);
  });

  it("ignora tentativas erradas fora da janela de 15 minutos", () => {
    const attempts = [
      ...Array.from({ length: MAX_ATTEMPTS }, () => ({ ok: false, createdAt: minutesAgo(30) })),
    ];
    expect(evaluateLockout(attempts, BASE)).toEqual({ locked: false });
  });

  it("tentativas corretas não contam para o bloqueio", () => {
    const attempts = [
      { ok: true, createdAt: minutesAgo(5) },
      { ok: false, createdAt: minutesAgo(4) },
      { ok: false, createdAt: minutesAgo(3) },
      { ok: false, createdAt: minutesAgo(2) },
      { ok: false, createdAt: minutesAgo(1) },
    ];
    expect(evaluateLockout(attempts, BASE)).toEqual({ locked: false });
  });

  it("libera o bloqueio depois do período de bloqueio", () => {
    const attempts = Array.from({ length: MAX_ATTEMPTS }, () => ({
      ok: false,
      createdAt: minutesAgo(40),
    }));
    // janela de 15 min já passou para considerar as tentativas, então nem bloqueia
    expect(evaluateLockout(attempts, BASE).locked).toBe(false);
  });
});
