import { describe, expect, it } from "vitest";
import { currentAndNext, eventPhase, probableLocation } from "./mission";

const items = [
  { id: "a", starts_at: "2026-12-12T09:00:00-03:00", ends_at: "2026-12-12T09:40:00-03:00" },
  { id: "b", starts_at: "2026-12-12T09:40:00-03:00", ends_at: "2026-12-12T10:40:00-03:00" },
];
const slots = [
  { team_id: "t1", activity: "Recepção", location_id: "l1", is_break: false, starts_at: "2026-12-12T07:30:00-03:00", ends_at: "2026-12-12T12:05:00-03:00" },
  { team_id: "t1", activity: "Intervalo", location_id: "l2", is_break: true, starts_at: "2026-12-12T12:05:00-03:00", ends_at: "2026-12-12T14:00:00-03:00" },
];

describe("fase do evento", () => {
  it("antes, durante e depois", () => {
    const s = "2026-12-11T17:00:00-03:00";
    const e = "2026-12-13T16:00:00-03:00";
    expect(eventPhase(new Date("2026-10-17T10:00:00-03:00"), s, e)).toBe("antes");
    expect(eventPhase(new Date("2026-12-12T10:00:00-03:00"), s, e)).toBe("durante");
    expect(eventPhase(new Date("2026-12-13T16:00:00-03:00"), s, e)).toBe("depois");
  });
});

describe("item atual do cronograma", () => {
  it("acha o atual e o próximo", () => {
    const r = currentAndNext(items, new Date("2026-12-12T09:10:00-03:00"));
    expect(r.current?.id).toBe("a");
    expect(r.next?.id).toBe("b");
  });
  it("no limite, o item que começa é o atual", () => {
    expect(currentAndNext(items, new Date("2026-12-12T09:40:00-03:00")).current?.id).toBe("b");
  });
  it("entre itens não há atual", () => {
    expect(currentAndNext(items, new Date("2026-12-12T08:00:00-03:00")).current).toBeNull();
  });
});

describe("local provável", () => {
  it("usa a escala da equipe", () => {
    expect(probableLocation(slots, "t1", new Date("2026-12-12T10:00:00-03:00"))).toMatchObject({ kind: "local", activity: "Recepção", isBreak: false });
  });
  it("mostra intervalo", () => {
    expect(probableLocation(slots, "t1", new Date("2026-12-12T12:30:00-03:00"))).toMatchObject({ kind: "local", isBreak: true });
  });
  it("sem escala publicada", () => {
    expect(probableLocation(slots, "t2", new Date())).toEqual({ kind: "sem_escala" });
  });
  it("fora do turno", () => {
    expect(probableLocation(slots, "t1", new Date("2026-12-12T23:00:00-03:00"))).toEqual({ kind: "fora_de_turno" });
  });
});

describe("linha curta de local na busca", () => {
  const name = () => "Refeitório";
  const fmt = () => "14:00";
  it("formata local, intervalo e ausência de escala", async () => {
    const { shortLocationLine } = await import("./mission");
    expect(shortLocationLine({ kind: "local", activity: "x", locationId: "r", isBreak: false, until: "" }, name, fmt)).toBe("Refeitório, até 14:00");
    expect(shortLocationLine({ kind: "local", activity: "x", locationId: "r", isBreak: true, until: "" }, name, fmt)).toBe("Intervalo no Refeitório, até 14:00");
    expect(shortLocationLine({ kind: "sem_escala" }, name, fmt)).toBe("Sem escala disponível");
  });
});
