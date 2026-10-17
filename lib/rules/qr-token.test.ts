import { describe, expect, it } from "vitest";
import { generateQrToken, verifyQrToken } from "./qr-token";

const SECRET = "segredo-de-teste";
const ID = "499355c2-e0c9-4d3c-9e61-aea586af8dbb";
const T0 = 1_800_000_000_000;

describe("token do QR pessoal", () => {
  it("aceita token recém-gerado", () => {
    expect(verifyQrToken(generateQrToken(ID, SECRET, T0), SECRET, T0)).toEqual({ ok: true, volunteerId: ID });
  });

  it("aceita a janela anterior (tolerância de atraso)", () => {
    const token = generateQrToken(ID, SECRET, T0);
    expect(verifyQrToken(token, SECRET, T0 + 30_000).ok).toBe(true);
  });

  it("rejeita print com mais de 60 segundos (critério 2)", () => {
    const token = generateQrToken(ID, SECRET, T0);
    expect(verifyQrToken(token, SECRET, T0 + 60_000)).toEqual({ ok: false, reason: "expirado" });
  });

  it("rejeita assinatura forjada e outro segredo", () => {
    const token = generateQrToken(ID, SECRET, T0);
    expect(verifyQrToken(token, "outro", T0).ok).toBe(false);
    const forged = token.replace(ID, "611de72d-2eb7-4602-af75-f41e2c4800c4");
    expect(verifyQrToken(forged, SECRET, T0)).toEqual({ ok: false, reason: "assinatura" });
  });

  it("rejeita lixo", () => {
    expect(verifyQrToken("qualquer coisa", SECRET, T0)).toEqual({ ok: false, reason: "formato" });
  });

  it("rejeita janela do futuro", () => {
    const token = generateQrToken(ID, SECRET, T0 + 90_000);
    expect(verifyQrToken(token, SECRET, T0).ok).toBe(false);
  });
});
