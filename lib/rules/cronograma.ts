// Cronograma (seção 6 e prompt de ajustes, item 1): converte as linhas da
// aba CRONOGRAMA da planilha em schedule_items, e ordena e agrupa os itens
// para a tela.

export type ScheduleKind =
  | "portoes"
  | "worship"
  | "pregacao"
  | "short"
  | "pitch"
  | "prayer"
  | "intervalo"
  | "missa"
  | "comunicacao"
  | "outro";

export type SheetRow = [unknown, unknown, unknown, unknown];

export type ParsedItem = {
  date: string; // AAAA-MM-DD
  sessionLabel: string;
  startsAt: string; // ISO com -03:00
  endsAt: string;
  title: string;
  performer: string | null;
  kind: ScheduleKind;
};

const DAY_HEADERS: Record<string, string> = { SEXTA: "2026-12-11", "SÁBADO": "2026-12-12", SABADO: "2026-12-12", DOMINGO: "2026-12-13" };
const NO_SESSION_LABEL = "Programação";
const INTERVAL_LABEL = "Intervalo";
// Duração usada quando a linha não tem duração e não há item seguinte no dia.
const DEFAULT_LAST_MINUTES = 15;

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export function kindFromTitle(title: string): ScheduleKind {
  const t = norm(title);
  if (t.startsWith("checkin") || t.startsWith("check-in") || t.includes("abertura dos portoes")) return "portoes";
  if (t.startsWith("worship") || t.includes("momento da cruz")) return "worship";
  if (t.startsWith("pregacao")) return "pregacao";
  if (t.startsWith("short")) return "short";
  if (t.startsWith("pitch")) return "pitch";
  if (t.startsWith("prayer") || t.startsWith("oracao")) return "prayer";
  if (t.startsWith("intervalo")) return "intervalo";
  if (t.includes("santa missa")) return "missa";
  if (t.includes("comunicacao") || t.startsWith("relogio") || t.startsWith("welcome")) return "comunicacao";
  return "outro";
}

/** "18h30" -> minutos desde 00:00. */
export function parseClock(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^(\d{1,2})h(\d{2})$/i);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** "30min", "05min", "02h00", "1h20", "3h" -> minutos. */
export function parseDuration(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  let m = v.match(/^(\d+)\s*min$/);
  if (m) return Number(m[1]);
  m = v.match(/^(\d+)h(\d{2})?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2] ?? 0);
  return null;
}

const iso = (date: string, minutes: number) =>
  `${date}T${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00-03:00`;

const text = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

/**
 * Converte as linhas da planilha em itens. O fim de cada item é o início
 * do próximo; se a duração da linha terminar antes, vale a duração.
 */
export function parseCronograma(rows: SheetRow[], mealAliases: Record<string, string> = {}): ParsedItem[] {
  type Raw = { date: string; session: string; start: number; duration: number | null; title: string; performer: string | null };
  const raws: Raw[] = [];
  let date: string | null = null;
  let session = NO_SESSION_LABEL;

  for (const row of rows) {
    const first = text(row[0]);
    if (!first) continue;
    const header = DAY_HEADERS[first.toUpperCase()];
    if (header) {
      date = header;
      session = NO_SESSION_LABEL;
      continue;
    }
    const sess = first.toUpperCase().match(/^SESS[ÃA]O\s*(\d+)/);
    if (sess) {
      session = `Sessão ${sess[1].padStart(2, "0")}`;
      continue;
    }
    const start = parseClock(first);
    if (start === null || !date) continue;
    const performer = text(row[3]) || null;
    raws.push({ date, session, start, duration: parseDuration(row[2]), title: text(row[1]), performer });
  }

  return raws.map((r, i) => {
    const next = raws[i + 1]?.date === r.date ? raws[i + 1] : undefined;
    const byDuration = r.duration !== null ? r.start + r.duration : null;
    let end: number;
    if (next && byDuration !== null) end = Math.min(byDuration, next.start);
    else if (next) end = next.start;
    else end = byDuration ?? r.start + DEFAULT_LAST_MINUTES;
    if (end <= r.start) end = r.start + DEFAULT_LAST_MINUTES;

    const kind = kindFromTitle(r.title);
    const startsAt = iso(r.date, r.start);
    const alias = kind === "intervalo" ? mealAliases[startsAt] : undefined;
    return {
      date: r.date,
      sessionLabel: kind === "intervalo" ? INTERVAL_LABEL : r.session,
      startsAt,
      endsAt: iso(r.date, end),
      title: alias ? `Intervalo (${alias})` : r.title,
      performer: r.performer,
      kind,
    };
  });
}

export type BlockItem = { starts_at: string; session_label: string };
export type ScheduleBlock<T extends BlockItem> = { label: string; items: T[] };

const ms = (v: string) => new Date(v).getTime();

/** Ordena por horário e agrupa em blocos contíguos de mesma sessão. */
export function groupScheduleBlocks<T extends BlockItem>(items: T[]): ScheduleBlock<T>[] {
  const sorted = items.slice().sort((a, b) => ms(a.starts_at) - ms(b.starts_at));
  const blocks: ScheduleBlock<T>[] = [];
  for (const item of sorted) {
    const last = blocks[blocks.length - 1];
    if (last && last.label === item.session_label) last.items.push(item);
    else blocks.push({ label: item.session_label, items: [item] });
  }
  return blocks;
}
