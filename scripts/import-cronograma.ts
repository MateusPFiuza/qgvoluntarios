/**
 * Importa a aba CRONOGRAMA da planilha oficial para supabase/seed/demo/schedule_items.json
 * e gera um SQL incremental (upsert) para o banco que já está no ar.
 * Ignora as abas Página6 (telão) e LISTA CONVIDADOS.
 *
 * Uso: npm run import:cronograma [-- caminho.xlsx] [-- --sql saida.sql]
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { inflateRawSync } from "node:zlib";
import { parseCronograma, type SheetRow } from "../lib/rules/cronograma";
import meals from "../supabase/seed/demo/meals.json";
import eventDays from "../supabase/seed/demo/event_days.json";

const SHEET_NAME = "CRONOGRAMA";
const args = process.argv.slice(2);
const sqlIdx = args.indexOf("--sql");
const sqlOut = sqlIdx >= 0 ? args[sqlIdx + 1] : null;
const xlsxPath = args.find((a, i) => !a.startsWith("--") && (sqlIdx < 0 || i !== sqlIdx + 1)) ??path.resolve(__dirname, "../docs/fonte/CRONOGRAMA_GERAÇÃO_2026_v1.xlsx");

function unzip(buf: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("Arquivo xlsx inválido.");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const data = buf.subarray(localOff + 30 + lNameLen + lExtraLen, localOff + 30 + lNameLen + lExtraLen + compSize);
    files.set(name, method === 8 ? inflateRawSync(data) : Buffer.from(data));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

function readSheet(file: string, sheetName: string): SheetRow[] {
  const files = unzip(readFileSync(file));
  const xml = (n: string) => files.get(n)?.toString("utf8") ?? "";
  const shared = [...xml("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")),
  );
  const sheetRel = [...xml("xl/workbook.xml").matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)].find((m) => decode(m[1]) === sheetName);
  if (!sheetRel) throw new Error(`Aba ${sheetName} não encontrada.`);
  const target = [...xml("xl/_rels/workbook.xml.rels").matchAll(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)].find((m) => m[1] === sheetRel[2])?.[2];
  const sheet = xml(`xl/${target?.replace(/^\/?xl\//, "")}`);
  const rows: SheetRow[] = [];
  for (const r of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: SheetRow = [null, null, null, null];
    for (const c of r[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const col = c[1].charCodeAt(0) - 65;
      if (c[1].length > 1 || col > 3) continue;
      const type = c[2].match(/t="([^"]+)"/)?.[1];
      const v = c[3]?.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      const inline = c[3]?.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1];
      row[col] = type === "s" && v !== undefined ? shared[Number(v)] : type === "inlineStr" ? decode(inline ?? "") : v !== undefined ? decode(v) : null;
    }
    rows.push(row);
  }
  return rows;
}

const MEAL_ALIAS: Record<string, string> = { almoco: "almoço", lanche: "lanche", janta: "janta", cafe: "café" };
const aliases = Object.fromEntries(meals.map((m) => [m.starts_at, MEAL_ALIAS[m.kind] ?? m.kind]));
const items = parseCronograma(readSheet(xlsxPath, SHEET_NAME), aliases);
const dayId = (date: string) => eventDays.find((d) => d.date === date)!.id;

const scheduleItems = items.map((it, i) => ({
  id: `60000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  day_id: dayId(it.date),
  session_label: it.sessionLabel,
  starts_at: it.startsAt,
  ends_at: it.endsAt,
  title: it.title,
  performer: it.performer,
  kind: it.kind,
  is_mock: false,
}));

writeFileSync(path.resolve(__dirname, "../supabase/seed/demo/schedule_items.json"), JSON.stringify(scheduleItems, null, 2) + "\n");
console.log(`${scheduleItems.length} itens gravados em supabase/seed/demo/schedule_items.json`);

if (sqlOut) {
  const q = (v: unknown) => (v === null ? "null" : typeof v === "boolean" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
  const values = scheduleItems
    .map((s) => `(${[s.id, s.day_id, s.session_label, s.starts_at, s.ends_at, s.title, s.performer, s.kind, s.is_mock].map(q).join(", ")})`)
    .join(",\n");
  const sql = `-- Cronograma provisório v1 (planilha). Substitui os itens de exemplo.
insert into schedule_items (id, day_id, session_label, starts_at, ends_at, title, performer, kind, is_mock) values
${values}
on conflict (id) do update set day_id = excluded.day_id, session_label = excluded.session_label, starts_at = excluded.starts_at,
  ends_at = excluded.ends_at, title = excluded.title, performer = excluded.performer, kind = excluded.kind, is_mock = excluded.is_mock, updated_at = now();
-- Os ids são sequenciais (60000000-...-000000000001 em diante) e cobrem os itens de exemplo antigos.
-- Só se a planilha nova tiver menos itens que a anterior, rode também:
-- delete from schedule_items where id not in (${scheduleItems.map((s) => q(s.id)).join(", ")});
`;
  writeFileSync(sqlOut, sql);
  console.log(`SQL incremental em ${sqlOut}`);
}
