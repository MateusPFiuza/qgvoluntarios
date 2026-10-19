import { describe, expect, it } from "vitest";
import { groupScheduleBlocks, kindFromTitle, parseClock, parseCronograma, parseDuration, type SheetRow } from "./cronograma";
import scheduleItems from "../../supabase/seed/demo/schedule_items.json";

const row = (a: unknown, b: unknown = null, c: unknown = null, d: unknown = null): SheetRow => [a, b, c, d];

describe("parse da planilha", () => {
  it("lê horários e durações nos formatos da planilha", () => {
    expect(parseClock("18h30")).toBe(18 * 60 + 30);
    expect(parseClock("SÁBADO")).toBeNull();
    expect(parseDuration("05min")).toBe(5);
    expect(parseDuration("02h00")).toBe(120);
    expect(parseDuration("1h20")).toBe(80);
    expect(parseDuration("3h")).toBe(180);
    expect(parseDuration(null)).toBeNull();
  });

  it("mapeia o tipo pelo título", () => {
    expect(kindFromTitle("Checkin/Upgrade")).toBe("portoes");
    expect(kindFromTitle("Abertura dos Portões / Geral")).toBe("portoes");
    expect(kindFromTitle("Worship time")).toBe("worship");
    expect(kindFromTitle("Momento da Cruz")).toBe("worship");
    expect(kindFromTitle("Pregação 05 (anuncio do ano)")).toBe("pregacao");
    expect(kindFromTitle("PITCH GERAÇÃO 2027")).toBe("pitch");
    expect(kindFromTitle("Prayer")).toBe("prayer");
    expect(kindFromTitle("SANTA MISSA")).toBe("missa");
    expect(kindFromTitle("Welcome // Comunicação de Palco")).toBe("comunicacao");
    expect(kindFromTitle("Relógio + Game")).toBe("comunicacao");
    expect(kindFromTitle("Firenight")).toBe("outro");
  });

  it("usa a sessão do cabeçalho, termina no próximo item e dá apelido ao intervalo", () => {
    const items = parseCronograma(
      [
        row("SÁBADO"),
        row("SESSÃO 01"),
        row("11h30", "Prayer", "30min", "Rahamim"),
        row("12h05", "Intervalo", "02h00"),
        row("SESSÃO 02"),
        row("13h55", "Relógio", "05min"),
        row("14h00", "Music Convidado", "40min"),
      ],
      { "2026-12-12T12:05:00-03:00": "almoço" },
    );
    expect(items.map((i) => [i.sessionLabel, i.startsAt.slice(11, 16), i.endsAt.slice(11, 16), i.title])).toEqual([
      ["Sessão 01", "11:30", "12:00", "Prayer"],
      ["Intervalo", "12:05", "13:55", "Intervalo (almoço)"],
      ["Sessão 02", "13:55", "14:00", "Relógio"],
      ["Sessão 02", "14:00", "14:40", "Music Convidado"],
    ]);
    expect(items[0].performer).toBe("Rahamim");
  });

  it("sexta não tem sessões e o último item ganha duração padrão", () => {
    const items = parseCronograma([row("SEXTA "), row("23h10", "Previsão de encerramento")]);
    expect(items[0].sessionLabel).toBe("Programação");
    expect(items[0].endsAt).toBe("2026-12-11T23:25:00-03:00");
  });
});

describe("ordenação e agrupamento", () => {
  it("nunca junta blocos separados por um intervalo e mantém a ordem de horário", () => {
    const blocks = groupScheduleBlocks([
      { starts_at: "2026-12-12T14:00:00-03:00", session_label: "Sessão 03" },
      { starts_at: "2026-12-12T12:05:00-03:00", session_label: "Intervalo" },
      { starts_at: "2026-12-12T16:10:00-03:00", session_label: "Intervalo" },
      { starts_at: "2026-12-12T09:00:00-03:00", session_label: "Sessão 02" },
    ]);
    expect(blocks.map((b) => b.label)).toEqual(["Sessão 02", "Intervalo", "Sessão 03", "Intervalo"]);
  });

  it("o sábado importado vai das 08:00 às 23:00 sem item fora de ordem", () => {
    const sat = scheduleItems.filter((i) => i.starts_at.startsWith("2026-12-12"));
    const blocks = groupScheduleBlocks(sat);
    const flat = blocks.flatMap((b) => b.items.map((i) => i.starts_at));
    expect(flat).toEqual([...flat].sort());
    expect(flat[0].slice(11, 16)).toBe("08:00");
    expect(flat[flat.length - 1].slice(11, 16)).toBe("23:00");
    expect(blocks.map((b) => b.label)).toEqual(["Sessão 01", "Intervalo", "Sessão 02", "Intervalo", "Sessão 03", "Intervalo", "Sessão 04"]);
  });
});
