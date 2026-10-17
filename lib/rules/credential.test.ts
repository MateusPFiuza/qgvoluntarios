import { describe, expect, it } from "vitest";
import {
  buildCredentialPlaintext,
  hashCredential,
  normalizeBirthDDMM,
  normalizeCpfLast4,
  verifyCredential,
} from "./credential";

describe("normalizeCpfLast4", () => {
  it("extrai os 4 últimos dígitos de um CPF formatado", () => {
    expect(normalizeCpfLast4("123.456.789-01")).toBe("8901");
  });

  it("extrai os 4 últimos dígitos de um CPF sem formatação", () => {
    expect(normalizeCpfLast4("12345678901")).toBe("8901");
  });

  it("rejeita entradas muito curtas", () => {
    expect(() => normalizeCpfLast4("12")).toThrow();
  });
});

describe("normalizeBirthDDMM", () => {
  it("aceita DDMM válido", () => {
    expect(normalizeBirthDDMM("0512")).toBe("0512");
  });

  it("rejeita dia inválido", () => {
    expect(() => normalizeBirthDDMM("3212")).toThrow();
  });

  it("rejeita mês inválido", () => {
    expect(() => normalizeBirthDDMM("0113")).toThrow();
  });

  it("rejeita formato incompleto", () => {
    expect(() => normalizeBirthDDMM("512")).toThrow();
  });
});

describe("hash e verificação da credencial", () => {
  it("gera um hash diferente do texto original e verifica corretamente", async () => {
    const plaintext = buildCredentialPlaintext("8901", "0512");
    const hash = await hashCredential(plaintext);

    expect(hash).not.toContain(plaintext);
    expect(await verifyCredential(plaintext, hash)).toBe(true);
    expect(await verifyCredential("0000:0101", hash)).toBe(false);
  });
});
