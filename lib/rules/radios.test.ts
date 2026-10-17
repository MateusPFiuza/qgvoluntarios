import { describe, expect, it } from "vitest";
import { availableRadios, isOverdue, maskRg, statusAfterReturn, validateCheckout } from "./radios";
import { maskCpf } from "@/lib/server/crypto";

const radios = [
  { id: "r1", number: 1, status: "ok" as const },
  { id: "r2", number: 2, status: "ok" as const },
  { id: "r3", number: 3, status: "defeito" as const },
];
const open = { id: "c1", radio_id: "r1", volunteer_id: "v1", checked_out_at: "2026-12-12T08:00:00-03:00", returned_at: null };

describe("rádios", () => {
  it("lista só os disponíveis (sem retirada aberta e sem defeito)", () => {
    expect(availableRadios(radios, [open]).map((r) => r.number)).toEqual([2]);
  });

  it("impede duas retiradas abertas do mesmo rádio (critério 10)", () => {
    expect(validateCheckout({ radio: radios[0], checkouts: [open], volunteerId: "v2", radios })).toEqual({ ok: false, reason: "em_uso" });
  });

  it("impede retirar rádio com defeito", () => {
    expect(validateCheckout({ radio: radios[2], checkouts: [], volunteerId: "v2", radios })).toEqual({ ok: false, reason: "defeito" });
  });

  it("avisa quando o voluntário já tem outro rádio", () => {
    expect(validateCheckout({ radio: radios[1], checkouts: [open], volunteerId: "v1", radios })).toEqual({ ok: true, volunteerAlreadyHas: [1] });
  });

  it("rádio devolvido com defeito fica bloqueado", () => {
    expect(statusAfterReturn("ok", "defeito")).toBe("defeito");
    expect(statusAfterReturn("ok", "ok")).toBe("ok");
  });

  it("marca não devolvido no dia seguinte ou após o corte", () => {
    expect(isOverdue(open, new Date("2026-12-12T20:00:00-03:00"))).toBe(false);
    expect(isOverdue(open, new Date("2026-12-12T23:10:00-03:00"))).toBe(true);
    expect(isOverdue(open, new Date("2026-12-13T08:00:00-03:00"))).toBe(true);
    expect(isOverdue({ ...open, returned_at: "2026-12-12T22:00:00-03:00" }, new Date("2026-12-13T08:00:00-03:00"))).toBe(false);
  });

  it("CPF e RG nunca aparecem completos (critério 7)", () => {
    expect(maskCpf("123.456.789-01")).toBe("***.***.***-8901");
    expect(maskCpf("12345678901")).not.toContain("1234567");
    expect(maskRg("12.345.678-9")).toBe("*******89");
  });
});
