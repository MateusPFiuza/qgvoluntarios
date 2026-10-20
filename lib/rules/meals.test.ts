import { describe, expect, it } from "vitest";
import { computeMealDashboard, decideCheckin, nextMealForVolunteer, pickDefaultMeal } from "./meals";
import { formatCountdown } from "./time";

const meals = [
  { id: "cafe", kind: "cafe", label: "Café", starts_at: "2026-12-12T06:30:00-03:00", ends_at: "2026-12-12T08:30:00-03:00", total_prepared: 10 },
  { id: "almoco", kind: "almoco", label: "Almoço", starts_at: "2026-12-12T12:05:00-03:00", ends_at: "2026-12-12T14:00:00-03:00", total_prepared: 10 },
];
const window = { team_id: "t1", meal_id: "almoco", starts_at: "2026-12-12T12:05:00-03:00", ends_at: "2026-12-12T12:45:00-03:00" };

describe("refeição padrão do check-in", () => {
  it("escolhe a que está sendo servida", () => {
    expect(pickDefaultMeal(meals, new Date("2026-12-12T12:30:00-03:00"))?.id).toBe("almoco");
  });
  it("entre refeições, escolhe a próxima", () => {
    expect(pickDefaultMeal(meals, new Date("2026-12-12T10:00:00-03:00"))?.id).toBe("almoco");
  });
  it("depois de todas, fica na última", () => {
    expect(pickDefaultMeal(meals, new Date("2026-12-13T10:00:00-03:00"))?.id).toBe("almoco");
  });
});

describe("decisão do check-in", () => {
  it("libera dentro da janela sem aviso", () => {
    expect(decideCheckin({ existing: null, existingByName: null, teamWindow: window, now: new Date("2026-12-12T12:10:00-03:00") })).toEqual({
      status: "liberado",
      outsideTeamWindow: false,
    });
  });
  it("nunca bloqueia por horário, só avisa", () => {
    expect(decideCheckin({ existing: null, existingByName: null, teamWindow: window, now: new Date("2026-12-12T13:30:00-03:00") })).toEqual({
      status: "liberado",
      outsideTeamWindow: true,
    });
  });
  it("sem janela de equipe não avisa", () => {
    const r = decideCheckin({ existing: null, existingByName: null, teamWindow: null, now: new Date() });
    expect(r).toEqual({ status: "liberado", outsideTeamWindow: false });
  });
  it("já consumida mostra horário e quem registrou", () => {
    const existing = { id: "c", volunteer_id: "v", meal_id: "almoco", created_at: "2026-12-12T12:20:00-03:00", checked_by: "a" };
    expect(decideCheckin({ existing, existingByName: "Clara", teamWindow: window, now: new Date() })).toEqual({
      status: "ja_consumiu",
      at: existing.created_at,
      byName: "Clara",
    });
  });
});

describe("próxima refeição do voluntário", () => {
  it("pula a que já foi registrada", () => {
    const now = new Date("2026-12-12T12:30:00-03:00");
    expect(nextMealForVolunteer(meals, new Set(["almoco"]), now)).toBeNull();
    expect(nextMealForVolunteer(meals, new Set(), now)?.id).toBe("almoco");
  });
});

describe("painel da refeição", () => {
  it("conta consumidas, restantes, percentual por equipe e quem não comeu", () => {
    const d = computeMealDashboard({
      meal: meals[1],
      teams: [{ id: "t1", name: "Acolhida" }, { id: "t2", name: "Space" }],
      volunteers: [
        { id: "a", full_name: "Ana", team_id: "t1", diet_notes: null },
        { id: "b", full_name: "Bia", team_id: "t1", diet_notes: "Sem glúten" },
        { id: "c", full_name: "Caio", team_id: "t2", diet_notes: null },
      ],
      checkins: [{ id: "1", volunteer_id: "a", meal_id: "almoco", created_at: "", checked_by: null }],
    });
    expect(d.consumed).toBe(1);
    expect(d.remaining).toBe(9);
    // Da menor para a maior porcentagem.
    expect(d.byTeam.map((t) => [t.teamName, t.pct])).toEqual([["Space", 0], ["Acolhida", 50]]);
    expect(d.byTeam[1]).toMatchObject({ ate: 1, total: 2, pct: 50 });
    expect(d.notEaten.map((n) => n.fullName)).toEqual(["Bia", "Caio"]);
  });
});

describe("contagem regressiva", () => {
  it("formata minutos, horas e dias", () => {
    expect(formatCountdown(52 * 60_000)).toBe("52 min");
    expect(formatCountdown(125 * 60_000)).toBe("2 h 05 min");
    expect(formatCountdown(5 * 24 * 3600_000)).toBe("5 dias");
  });
});

describe("painel: ordem e destaque das equipes", () => {
  it("destaca abaixo do limite só depois da metade da janela", async () => {
    const { isTeamLagging } = await import("./meals");
    const meal = { starts_at: "2026-12-12T12:00:00-03:00", ends_at: "2026-12-12T14:00:00-03:00" };
    expect(isTeamLagging(30, meal, new Date("2026-12-12T12:30:00-03:00"), 50)).toBe(false);
    expect(isTeamLagging(30, meal, new Date("2026-12-12T13:00:00-03:00"), 50)).toBe(true);
    expect(isTeamLagging(60, meal, new Date("2026-12-12T13:30:00-03:00"), 50)).toBe(false);
  });
});
