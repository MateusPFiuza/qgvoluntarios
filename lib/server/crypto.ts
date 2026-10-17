import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getPersonalDataEncryptionKey } from "./env";

/**
 * Criptografia de dados pessoais (CPF/RG) no nível da aplicação (seção 12).
 * AES-256-GCM. A chave vem de PERSONAL_DATA_ENCRYPTION_KEY (fora do banco).
 */

function derivedKey(): Buffer {
  // Deriva 32 bytes estáveis a partir do segredo configurado, qualquer que
  // seja seu tamanho original — evita exigir exatamente 32 bytes em texto.
  return createHash("sha256").update(getPersonalDataEncryptionKey()).digest();
}

export function encryptPersonalField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", derivedKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptPersonalField(encoded: string): string {
  const raw = Buffer.from(encoded, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", derivedKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

/** Mascara um CPF para exibição, nunca mostrando-o completo em tela. */
export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return `***.***.***-${last4}`;
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}
