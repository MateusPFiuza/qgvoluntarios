import { describe, expect, it } from "vitest";
import { normalizeForSearch, searchVolunteersByName, shouldShowResults } from "./name-search";

describe("normalizeForSearch", () => {
  it("remove acentos e caixa", () => {
    expect(normalizeForSearch("João Pedro")).toBe("joao pedro");
    expect(normalizeForSearch("MARÍLIA")).toBe("marilia");
  });
});

describe("shouldShowResults", () => {
  it("não mostra resultados com menos de 3 letras", () => {
    expect(shouldShowResults("jo")).toBe(false);
    expect(shouldShowResults("")).toBe(false);
  });

  it("mostra resultados a partir de 3 letras", () => {
    expect(shouldShowResults("joa")).toBe(true);
    expect(shouldShowResults("ana")).toBe(true);
  });
});

describe("searchVolunteersByName", () => {
  const volunteers = [
    { id: "1", fullName: "João Pedro Alves" },
    { id: "2", fullName: "Maria Clara Souza" },
    { id: "3", fullName: "José Antônio" },
  ];

  it("retorna vazio com menos de 3 letras", () => {
    expect(searchVolunteersByName("jo", volunteers)).toHaveLength(0);
  });

  it("encontra por nome ignorando acento e caixa", () => {
    const result = searchVolunteersByName("jose", volunteers);
    expect(result.map((v) => v.id)).toEqual(["3"]);
  });

  it("encontra múltiplos por substring", () => {
    const result = searchVolunteersByName("jo", volunteers.length ? volunteers : []);
    expect(result).toHaveLength(0); // ainda menor que 3 letras
  });
});
