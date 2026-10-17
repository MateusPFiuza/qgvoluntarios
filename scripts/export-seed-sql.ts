/**
 * Exporta os JSONs de supabase/seed/demo/ para um único arquivo SQL
 * (supabase/seed/demo/seed.sql), para carregar num projeto Supabase real
 * de demonstração com `psql` ou o editor SQL do Supabase.
 *
 * Uso: npm run seed:demo:sql (depende de já ter rodado npm run seed:demo)
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import teams from "../supabase/seed/demo/teams.json";
import volunteers from "../supabase/seed/demo/volunteers.json";
import volunteersPrivate from "../supabase/seed/demo/volunteers_private.json";
import adminAccounts from "../supabase/seed/demo/admin_accounts.json";

function sqlStr(value: string | null | undefined): string {
  if (value === null || value === undefined) return "null";
  return `'${value.replace(/'/g, "''")}'`;
}
function sqlBool(value: boolean): string {
  return value ? "true" : "false";
}

function main() {
  const lines: string[] = [
    "-- Gerado por scripts/export-seed-sql.ts a partir de supabase/seed/demo/*.json",
    "-- Dados 100% fictícios (seção 11). Não usar em produção.",
    "begin;",
    "",
  ];

  for (const t of teams as any[]) {
    lines.push(
      `insert into teams (id, name, group_name, sort, is_mock) values (${sqlStr(t.id)}, ${sqlStr(t.name)}, ${sqlStr(t.group_name)}, ${t.sort}, ${sqlBool(t.is_mock)}) on conflict (id) do nothing;`,
    );
  }
  lines.push("");

  for (const v of volunteers as any[]) {
    lines.push(
      `insert into volunteers (id, full_name, search_name, team_id, is_leader, photo_path, pin_hash, birth_dm, diet_notes, login_locked_until, active, is_mock) values (${sqlStr(v.id)}, ${sqlStr(v.full_name)}, ${sqlStr(v.search_name)}, ${sqlStr(v.team_id)}, ${sqlBool(v.is_leader)}, ${sqlStr(v.photo_path)}, ${sqlStr(v.pin_hash)}, ${sqlStr(v.birth_dm)}, ${sqlStr(v.diet_notes)}, null, ${sqlBool(v.active)}, ${sqlBool(v.is_mock)}) on conflict (id) do nothing;`,
    );
  }
  lines.push("");

  for (const p of volunteersPrivate as any[]) {
    lines.push(
      `insert into volunteers_private (volunteer_id, cpf_enc, rg_enc) values (${sqlStr(p.volunteer_id)}, ${sqlStr(p.cpf_enc)}, ${sqlStr(p.rg_enc)}) on conflict (volunteer_id) do nothing;`,
    );
  }
  lines.push("");

  for (const a of adminAccounts as any[]) {
    lines.push(
      `insert into admin_accounts (volunteer_id, password_hash, can_manage_radios, locked_until) values (${sqlStr(a.volunteer_id)}, ${sqlStr(a.password_hash)}, ${sqlBool(a.can_manage_radios)}, null) on conflict (volunteer_id) do nothing;`,
    );
  }
  lines.push("", "commit;", "");

  const outPath = path.resolve(__dirname, "../supabase/seed/demo/seed.sql");
  writeFileSync(outPath, lines.join("\n"));
  console.log(`Escrito ${outPath}`);
}

main();
