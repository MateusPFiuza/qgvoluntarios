"use client";

import { useMemo, useState } from "react";
import { normalizeForSearch } from "@/lib/rules/name-search";
import { Avatar } from "./Avatar";

export type BuscarRow = { id: string; name: string; searchName: string; team: string; isLeader: boolean; where: string };

export function BuscarList({ rows }: { rows: BuscarRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    return q ? rows.filter((r) => normalizeForSearch(r.searchName || r.name).includes(q)) : rows;
  }, [rows, query]);

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="q" className="sr-only">
        Nome do voluntário
      </label>
      <input id="q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrar por nome" autoComplete="off" className="campo" />
      <p className="text-xs text-nave-text-secondary" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "voluntário" : "voluntários"} · local previsto pela escala, pode ter mudado
      </p>
      <ul className="flex flex-col divide-y divide-nave-bezel rounded-xl border border-nave-bezel">
        {filtered.map((v) => (
          <li key={v.id} className="flex gap-3 p-4">
            <Avatar name={v.name} />
            <div className="min-w-0">
              <p className="text-base font-medium">
                {v.name}
                {v.isLeader && <span className="ml-2 rounded bg-nave-gold/15 px-2 py-0.5 text-xs text-nave-gold">Líder</span>}
              </p>
              <p className="text-sm text-nave-gold">{v.team}</p>
              <p className="mt-1 text-sm text-nave-text-secondary">{v.where}</p>
            </div>
          </li>
        ))}
        {filtered.length === 0 && <li className="p-4 text-sm text-nave-text-secondary">Ninguém com esse nome.</li>}
      </ul>
    </div>
  );
}
