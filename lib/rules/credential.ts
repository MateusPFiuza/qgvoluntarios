import { argon2id, argon2Verify } from "hash-wasm";

/**
 * Regra de credencial do voluntário (seção 5.2):
 * "4 últimos dígitos do CPF" + "DDMM de nascimento".
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

export function normalizeBirthDDMM(ddmm: string): string {
  const digits = ddmm.replace(/\D/g, "");
  if (!/^\d{4}$/.test(digits)) {
    throw new Error("Data de nascimento inválida: use o formato DDMM");
  }
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    throw new Error("Data de nascimento inválida: dia ou mês fora do intervalo");
  }
  return digits;
}

/** Monta a credencial em texto, usada apenas em memória, nunca persistida. */
export function buildCredentialPlaintext(cpfLast4: string, birthDDMM: string): string {
  return `${cpfLast4}:${birthDDMM}`;
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
