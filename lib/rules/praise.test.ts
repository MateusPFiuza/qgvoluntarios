import { describe, expect, it } from "vitest";
import { aggregateTotals, myPraiseMap, ranking, reciprocalPairs, validatePraise, type PraiseRow } from "./praise";

const open = { id: "w1", is_open: true };
const closed = { id: "w0", is_open: false };
const rows: PraiseRow[] = [
  { window_id: "w1", sender_id: "a", receiver_id: "b", trait: "feliz" },
  { window_id: "w1", sender_id: "c", receiver_id: "b", trait: "feliz" },
  { window_id: "w1", sender_id: "b", receiver_id: "a", trait: "facilitador" },
  { window_id: "w1", sender_id: "a", receiver_id: "c", trait: "por_inteiro" },
];

describe("validação do elogio", () => {
  it("rejeita fora de janela aberta (critério 6)", () => {
    expect(validatePraise({ window: closed, senderId: "a", receiverId: "b", trait: "feliz" })).toBe("janela_fechada");
    expect(validatePraise({ window: null, senderId: "a", receiverId: "b", trait: "feliz" })).toBe("janela_fechada");
  });
  it("rejeita elogiar a si mesmo (critério 3)", () => {
    expect(validatePraise({ window: open, senderId: "a", receiverId: "a", trait: "feliz" })).toBe("auto_elogio");
  });
  it("rejeita característica desconhecida", () => {
    expect(validatePraise({ window: open, senderId: "a", receiverId: "b", trait: "bonito" })).toBe("caracteristica");
  });
  it("aceita elogio válido, inclusive da mesma equipe", () => {
    expect(validatePraise({ window: open, senderId: "a", receiverId: "b", trait: "por_inteiro" })).toBeNull();
  });
});

describe("anonimato", () => {
  it("totais agregados não carregam remetente (critério 4)", () => {
    const totals = aggregateTotals(rows);
    expect(totals.find((t) => t.receiver_id === "b" && t.trait === "feliz")?.total).toBe(2);
    for (const t of totals) expect(Object.keys(t)).not.toContain("sender_id");
    expect(JSON.stringify(totals)).not.toMatch(/sender/);
  });
  it("o voluntário só vê o que ele mesmo acendeu", () => {
    expect(myPraiseMap(rows, "a", "w1")).toEqual({ b: ["feliz"], c: ["por_inteiro"] });
  });
  it("reciprocidade devolve só um número", () => {
    expect(reciprocalPairs(rows, "w1")).toBe(1);
  });
});

describe("ranking", () => {
  it("ordena por característica e filtra por equipe", () => {
    const totals = aggregateTotals(rows);
    expect(ranking(totals, { trait: "feliz" }).map((r) => r.receiverId)).toEqual(["b"]);
    expect(ranking(totals, { receiverIds: new Set(["a", "c"]) }).map((r) => r.receiverId).sort()).toEqual(["a", "c"]);
  });
});
