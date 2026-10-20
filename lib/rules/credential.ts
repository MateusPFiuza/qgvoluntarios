import { argon2id, argon2Verify } from "hash-wasm";

/**
 * Regra de credencial do voluntário (seção 5.2):
 * "4 últimos dígitos do CPF" + "data de nascimento completa (DDMMAAAA)".
 *
 * A credencial nunca é armazenada em texto — apenas seu hash (argon2id).
 * Este módulo cuida só da composição e verificação da credencial; a busca
 * do hash no banco acontece em lib/server.
 */

export function normalizeCpfLast4(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length < 4) {
    throw new Error("CPF inválido: menos de 4 dígitos");
  }
  return digits.slice(-4);
}

/** Data de nascimento completa DD/MM/AAAA (com ou sem barras) -> "DDMMAAAA", só se for uma data real. */
export function normalizeBirthDate(input: string, today: Date = new Date()): string {
  const digits = input.replace(/\D/g, "");
  if (!/^\d{8}$/.test(digits)) {
    throw new Error("Data de nascimento inválida: use DD/MM/AAAA");
  }
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const d = new Date(Date.UTC(year, month - 1, day));
  const real = d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
  if (!real || year < 1900 || d.getTime() > today.getTime()) {
    throw new Error("Data de nascimento inválida");
  }
  return digits;
}

/** Monta a credencial em texto, usada apenas em memória, nunca persistida. */
export function buildCredentialPlaintext(cpfLast4: string, birthDate: string): string {
  return `${cpfLast4}:${birthDate}`;
}

const ARGON2_PARAMS = {
  parallelism: 1,
  iterations: 3,
  memorySize: 19456, // ~19 MB, recomendação OWASP para argon2id interativo
  hashLength: 32,
  outputType: "encoded" as const,
};

export async function hashCredential(plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return argon2id({
    password: plaintext,
    salt,
    ...ARGON2_PARAMS,
  });
}

export async function verifyCredential(plaintext: string, hash: string): Promise<boolean> {
  try {
    return await argon2Verify({ password: plaintext, hash });
  } catch {
    return false;
  }
}

export async function hashPassword(plaintext: string): Promise<string> {
  return hashCredential(plaintext);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return verifyCredential(plaintext, hash);
}
