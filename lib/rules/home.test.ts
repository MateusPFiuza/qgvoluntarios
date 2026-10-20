import { describe, expect, it } from "vitest";
import { mealCard, teamSlotTitle } from "./home";

const meal = (id: string, kind: string, s: string, e: string) => ({ id, kind, label: `${kind} de sábado`, starts_at: s, ends_at: e, total_prepared: 50 });
const meals = [
  meal("a", "almoco", "2026-12-12T12:05:00-03:00", "2026-12-12T14:00:00-03:00"),
  meal("l", "lanche", "2026-12-12T16:10:00-03:00", "2026-12-12T16:40:00-03:00"),
];
const at = (hm: string) => new Date(`2026-12-12T${hm}:00-03:00`);

describe("cartão da refeição no início", () => {
  it("refeição em andamento e não registrada", () => {
    const c = mealCard(meals, new Map(), at("12:40"));
    expect(c.state).toBe("agora");
    expect(c.title).toBe("Almoço agora, até 14:00");
  });

  it("refeição já registrada mostra o horário e aponta a seguinte", () => {
    const c = mealCard(meals, new Map([["a", "2026-12-12T12:16:00-03:00"]]), at("12:40"));
    expect(c.state).toBe("registrada");
    expect(c.title).toBe("Almoço registrado às 12:16");
    expect(c.state === "registrada" && c.next?.id).toBe("l");
  });

  it("fora de refeição aponta a próxima", () => {
    expect(mealCard(meals, new Map(), at("15:00")).state).toBe("proxima");
    expect(mealCard(meals, new Map(), at("17:00")).state).toBe("nenhuma");
  });
});

describe("texto do turno da equipe", () => {
  it("intervalo com e sem janela da equipe", () => {
    expect(teamSlotTitle({ activity: "Intervalo (refeição no horário da equipe)", is_break: true }, { starts_at: "2026-12-12T12:43:00-03:00" })).toBe("Intervalo. Refeição às 12:43");
    expect(teamSlotTitle({ activity: "x", is_break: true }, null)).toBe("Intervalo");
    expect(teamSlotTitle({ activity: "Recepção", is_break: false }, null)).toBe("Recepção");
  });
});
