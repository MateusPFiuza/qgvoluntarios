/**
 * Regra de busca de nomes na tela de login (seção 5.2):
 * a lista de nomes só aparece depois de 3+ letras digitadas, e a busca
 * ignora acentos e maiúsculas/minúsculas.
 */

export const MIN_QUERY_LENGTH = 3;

export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .trim();
}

export function shouldShowResults(query: string): boolean {
  return normalizeForSearch(query).replace(/\s/g, "").length >= MIN_QUERY_LENGTH;
}

export type SearchableVolunteer = {
  id: string;
  fullName: string;
  searchName?: string;
};

export function searchVolunteersByName<T extends SearchableVolunteer>(
  query: string,
  volunteers: T[],
): T[] {
  if (!shouldShowResults(query)) return [];
  const normalizedQuery = normalizeForSearch(query);
  return volunteers.filter((v) => {
    const haystack = normalizeForSearch(v.searchName ?? v.fullName);
    return haystack.includes(normalizedQuery);
  });
}
