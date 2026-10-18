/**
 * Gera a semente de demonstração (seção 11): ~40 voluntários fictícios,
 * distribuídos nas equipes de supabase/seed/demo/teams.json, alguns
 * líderes, e algumas contas de ADM de teste.
 *
 * Roda uma vez (ou sempre que os nomes fictícios mudarem) e grava os
 * JSONs finais em supabase/seed/demo/. Esses arquivos (com os hashes já
 * calculados) são o que o app lê em tempo de execução — não recalculamos
 * hash argon2 a cada partida do servidor.
 *
 * Uso: npm run seed:demo
 */
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";
import {
  buildCredentialPlaintext,
  hashCredential,
  hashPassword,
} from "../lib/rules/credential";
import { normalizeForSearch } from "../lib/rules/name-search";
import teams from "../supabase/seed/demo/teams.json";

const FIRST_NAMES = [
  "Ana",
  "Bruno",
  "Camila",
  "Diego",
  "Elisa",
  "Fábio",
  "Gabriela",
  "Henrique",
  "Isabela",
  "João",
  "Karina",
  "Lucas",
  "Mariana",
  "Natália",
  "Otávio",
  "Patrícia",
  "Rafael",
  "Sofia",
  "Tiago",
  "Vitória",
  "Wellington",
  "Yasmin",
  "Caio",
  "Daniela",
  "Eduardo",
  "Flávia",
  "Gustavo",
  "Helena",
  "Igor",
  "Juliana",
  "Kaique",
  "Larissa",
  "Marcelo",
  "Nicole",
  "Pedro",
  "Renata",
  "Samuel",
  "Talita",
  "Vinícius",
  "Zélia",
];

const LAST_NAMES = [
  "Almeida",
  "Barros",
  "Cardoso",
  "Dias",
  "Esteves",
  "Fonseca",
  "Gomes",
  "Henriques",
  "Ibrahim",
  "Junqueira",
  "Lima",
  "Martins",
  "Nascimento",
  "Oliveira",
  "Pereira",
  "Queiroz",
  "Ramos",
  "Silva",
  "Teixeira",
  "Vasconcelos",
];

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

async function main() {
  const volunteers: any[] = [];
  const volunteersPrivate: any[] = [];
  const adminAccounts: any[] = [];
  const demoCredentials: { name: string; cpfLast4: string; birthDDMM: string; team: string; role: string }[] = [];

  const totalVolunteers = 42;

  const usedNames = new Set<string>();
  for (let i = 0; i < totalVolunteers; i++) {
    const first = pick(FIRST_NAMES, i);
    let offset = 0;
    let fullName = `${first} ${pick(LAST_NAMES, i * 3 + 1)}`;
    while (usedNames.has(fullName)) fullName = `${first} ${pick(LAST_NAMES, i * 3 + 2 + offset++)}`;
    usedNames.add(fullName);
    const team = pick(teams as any[], i);
    const isLeader = i % 7 === 0; // alguns líderes
    const day = String((i % 28) + 1).padStart(2, "0");
    const month = String(((i * 2) % 12) + 1).padStart(2, "0");
    const birthDDMM = `${day}${month}`;
    const cpfLast4 = String(1000 + i * 137).slice(-4).padStart(4, "0");

    const id = randomUUID();
    const plaintext = buildCredentialPlaintext(cpfLast4, birthDDMM);
    const pinHash = await hashCredential(plaintext);

    volunteers.push({
      id,
      full_name: fullName,
      search_name: normalizeForSearch(fullName),
      team_id: team.id,
      is_leader: isLeader,
      photo_path: null,
      pin_hash: pinHash,
      birth_dm: birthDDMM,
      diet_notes: i % 9 === 0 ? "Restrição a lactose (exemplo)" : null,
      login_locked_until: null,
      active: true,
      is_mock: true,
    });

    // CPF/RG fictícios "criptografados": como é dado de demonstração e não
    // há chave real de produção aqui, usamos um valor de exemplo já
    // mascarado — nunca o CPF completo em texto.
    volunteersPrivate.push({
      volunteer_id: id,
      cpf_enc: `demo-enc:***.***.***-${cpfLast4}`,
      rg_enc: `demo-enc:**.***.***-X`,
    });

    if (i < 6) {
      demoCredentials.push({
        name: fullName,
        cpfLast4,
        birthDDMM,
        team: team.name,
        role: isLeader ? "líder" : "voluntário",
      });
    }
  }

  // Contas de ADM de teste: membros do QG dos Voluntários
  const qgTeam = (teams as any[]).find((t) => t.name === "QG dos Voluntários")!;
  const adminDefs = [
    { name: "Clara Mendes (ADM)", password: "qg2026-clara", canManageRadios: true },
    { name: "Rodrigo Teles (ADM)", password: "qg2026-rodrigo", canManageRadios: false },
  ];

  for (const def of adminDefs) {
    const id = randomUUID();
    const day = "01";
    const month = "01";
    const birthDDMM = `${day}${month}`;
    const cpfLast4 = "0000";

    volunteers.push({
      id,
      full_name: def.name,
      search_name: normalizeForSearch(def.name),
      team_id: qgTeam.id,
      is_leader: false,
      photo_path: null,
      pin_hash: await hashCredential(buildCredentialPlaintext(cpfLast4, birthDDMM)),
      birth_dm: birthDDMM,
      diet_notes: null,
      login_locked_until: null,
      active: true,
      is_mock: true,
    });

    volunteersPrivate.push({
      volunteer_id: id,
      cpf_enc: `demo-enc:***.***.***-${cpfLast4}`,
      rg_enc: `demo-enc:**.***.***-X`,
    });

    adminAccounts.push({
      volunteer_id: id,
      password_hash: await hashPassword(def.password),
      can_manage_radios: def.canManageRadios,
      locked_until: null,
    });

    demoCredentials.push({
      name: `${def.name}, senha ADM: ${def.password}`,
      cpfLast4,
      birthDDMM,
      team: qgTeam.name,
      role: "ADM",
    });
  }

  const outDir = path.resolve(__dirname, "../supabase/seed/demo");
  writeFileSync(path.join(outDir, "volunteers.json"), JSON.stringify(volunteers, null, 2));
  writeFileSync(path.join(outDir, "volunteers_private.json"), JSON.stringify(volunteersPrivate, null, 2));
  writeFileSync(path.join(outDir, "admin_accounts.json"), JSON.stringify(adminAccounts, null, 2));

  const readme = [
    "# Logins de teste, modo demonstração",
    "",
    "Dados 100% fictícios, gerados por scripts/seed-demo.ts. Nunca usar em produção.",
    "",
    "| Nome | 4 últimos do CPF | Nasc. (DDMM) | Equipe | Papel |",
    "|---|---|---|---|---|",
    ...demoCredentials.map(
      (c) => `| ${c.name} | ${c.cpfLast4} | ${c.birthDDMM} | ${c.team} | ${c.role} |`,
    ),
    "",
    "Para entrar na Área do QG, use um dos voluntários ADM acima e, depois do",
    "login normal, informe a senha indicada no nome (ex.: `qg2026-clara`).",
  ].join("\n");
  writeFileSync(path.join(outDir, "LOGINS_DE_TESTE.md"), readme);
  writeFileSync(path.join(outDir, "logins-de-teste.json"), JSON.stringify(demoCredentials, null, 2));

  console.log(`Gerados ${volunteers.length} voluntários, ${adminAccounts.length} contas ADM.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
