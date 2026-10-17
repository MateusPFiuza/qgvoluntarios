export const TRAITS = ["feliz", "facilitador", "por_inteiro"] as const;
export type Trait = (typeof TRAITS)[number];

export const TRAIT_INFO: Record<Trait, { label: string; meaning: string; icon: string; pin: string }> = {
  feliz: { label: "Feliz", meaning: "Sorriso no rosto, boa vontade, alegria de servir", icon: "☺", pin: "Astronauta na lua" },
  facilitador: { label: "Facilitador", meaning: "Faz o que precisa ser feito, pensa fora da caixa, proativo", icon: "⚙", pin: "Foguete" },
  por_inteiro: { label: "Por inteiro", meaning: "Está dando o seu melhor", icon: "▮", pin: "Capacete com galáxia" },
};

export type WindowLike = { id: string; is_open: boolean };
export type PraiseRow = { window_id: string; sender_id: string; receiver_id: string; trait: Trait };

export type PraiseError = "janela_fechada" | "auto_elogio" | "caracteristica";

export function validatePraise(params: { window: WindowLike | null; senderId: string; receiverId: string; trait: string }): PraiseError | null {
  if (!params.window || !params.window.is_open) return "janela_fechada";
  if (params.senderId === params.receiverId) return "auto_elogio";
  if (!(TRAITS as readonly string[]).includes(params.trait)) return "caracteristica";
  return null;
}

export type PraiseTotal = { window_id: string; receiver_id: string; trait: Trait; total: number };

/** Agrega elogios em totais. O resultado não tem remetente (critério 4). */
export function aggregateTotals(praises: PraiseRow[]): PraiseTotal[] {
  const map = new Map<string, PraiseTotal>();
  for (const p of praises) {
    const key = `${p.window_id}|${p.receiver_id}|${p.trait}`;
    const cur = map.get(key);
    if (cur) cur.total += 1;
    else map.set(key, { window_id: p.window_id, receiver_id: p.receiver_id, trait: p.trait, total: 1 });
  }
  return [...map.values()];
}

/** O que o próprio remetente acendeu, por pessoa. Nunca serve para ver elogios de outros. */
export function myPraiseMap(praises: PraiseRow[], senderId: string, windowId: string): Record<string, Trait[]> {
  const out: Record<string, Trait[]> = {};
  for (const p of praises) {
    if (p.sender_id !== senderId || p.window_id !== windowId) continue;
    (out[p.receiver_id] ??= []).push(p.trait);
  }
  return out;
}

/** Quantidade de pares que se elogiaram mutuamente na janela. Só o número, nunca quem. */
export function reciprocalPairs(praises: PraiseRow[], windowId: string): number {
  const edges = new Set(praises.filter((p) => p.window_id === windowId).map((p) => `${p.sender_id}>${p.receiver_id}`));
  const pairs = new Set<string>();
  for (const e of edges) {
    const [a, b] = e.split(">");
    if (edges.has(`${b}>${a}`)) pairs.add([a, b].sort().join("|"));
  }
  return pairs.size;
}

export type RankingRow = { receiverId: string; total: number; byTrait: Record<Trait, number> };

export function ranking(totals: PraiseTotal[], filter: { windowId?: string | null; trait?: Trait | null; receiverIds?: Set<string> | null }): RankingRow[] {
  const rows = new Map<string, RankingRow>();
  for (const t of totals) {
    if (filter.windowId && t.window_id !== filter.windowId) continue;
    if (filter.receiverIds && !filter.receiverIds.has(t.receiver_id)) continue;
    const row = rows.get(t.receiver_id) ?? { receiverId: t.receiver_id, total: 0, byTrait: { feliz: 0, facilitador: 0, por_inteiro: 0 } };
    row.byTrait[t.trait] += t.total;
    row.total += t.total;
    rows.set(t.receiver_id, row);
  }
  const key = (r: RankingRow) => (filter.trait ? r.byTrait[filter.trait] : r.total);
  return [...rows.values()].filter((r) => key(r) > 0).sort((a, b) => key(b) - key(a));
}
