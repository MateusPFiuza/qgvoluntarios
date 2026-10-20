import { describe, expect, it } from "vitest";
import {
  buildCredentialPlaintext,
  hashCredential,
  normalizeBirthDate,
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

describe("normalizeBirthDate", () => {
  it("aceita DD/MM/AAAA e devolve só dígitos", () => {
    expect(normalizeBirthDate("05/12/2000")).toBe("05122000");
  });
  it("aceita sem barras", () => {
    expect(normalizeBirthDate("05122000")).toBe("05122000");
  });
  it("aceita 29/02 em ano bissexto e rejeita fora dele", () => {
    expect(normalizeBirthDate("29/02/2004")).toBe("29022004");
    expect(() => normalizeBirthDate("29/02/2003")).toThrow();
  });
  it("rejeita dia ou mês impossíveis", () => {
    expect(() => normalizeBirthDate("31/04/2000")).toThrow();
    expect(() => normalizeBirthDate("01/13/2000")).toThrow();
  });
  it("rejeita formato incompleto e datas futuras ou muito antigas", () => {
    expect(() => normalizeBirthDate("05/12")).toThrow();
    expect(() => normalizeBirthDate("01/01/1899")).toThrow();
    expect(() => normalizeBirthDate("01/01/2030", new Date("2026-10-20"))).toThrow();
  });
});

describe("hash e verificação da credencial", () => {
  it("gera um hash diferente do texto original e verifica corretamente", async () => {
    const plaintext = buildCredentialPlaintext("8901", "05122000");
    const hash = await hashCredential(plaintext);

    expect(hash).not.toContain(plaintext);
    expect(await verifyCredential(plaintext, hash)).toBe(true);
    expect(await verifyCredential("0000:01012000", hash)).toBe(false);
  });
});
