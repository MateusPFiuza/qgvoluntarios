import { describe, expect, it } from "vitest";
import { summarizeQg } from "./qg-summary";

describe("números da entrada do QG", () => {
  it("conta refeição atual, rádios fora e não devolvidos, e a janela de elogios", () => {
    const now = new Date("2026-12-12T12:40:00-03:00");
    const s = summarizeQg({
      meals: [{ id: "a", kind: "almoco", label: "Almoço de sábado", starts_at: "2026-12-12T12:05:00-03:00", ends_at: "2026-12-12T14:00:00-03:00", total_prepared: 50 }],
      checkins: [{ meal_id: "a" }, { meal_id: "a" }, { meal_id: "x" }],
      radios: [{ id: "1" }, { id: "2" }, { id: "3" }],
      checkouts: [
        { id: "c1", radio_id: "1", volunteer_id: "v", checked_out_at: "2026-12-11T19:00:00-03:00", returned_at: null },
        { id: "c2", radio_id: "2", volunteer_id: "v", checked_out_at: "2026-12-12T10:00:00-03:00", returned_at: null },
        { id: "c3", radio_id: "3", volunteer_id: "v", checked_out_at: "2026-12-12T10:00:00-03:00", returned_at: "2026-12-12T11:00:00-03:00" },
      ],
      openWindow: { name: "Sábado" },
      now,
    });
    expect(s.meal).toEqual({ label: "Almoço de sábado", consumed: 2, prepared: 50 });
    expect(s.radios).toEqual({ out: 2, total: 3, notReturned: 1 });
    expect(s.praise).toEqual({ open: true, name: "Sábado" });
  });
});
