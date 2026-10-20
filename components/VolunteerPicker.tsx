"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeForSearch } from "@/lib/rules/name-search";

export type PickedVolunteer = { id: string; fullName: string; teamName: string | null; isLeader: boolean; teamId?: string | null };
export type DirectoryEntry = PickedVolunteer & { searchName: string };
type Entry = DirectoryEntry;

let cache: Promise<Entry[]> | null = null;

export function loadDirectory(): Promise<Entry[]> {
  if (!cache) {
    cache = fetch("/api/volunteers/directory")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Não foi possível carregar a lista.");
        return data.results as Entry[];
      })
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

/** Escolha de voluntário para quem já entrou: lista completa, filtrada enquanto digita. */
export function VolunteerPicker({
  onPick,
  label = "Voluntário",
  autoFocus,
  maxHeight = "18rem",
}: {
  onPick: (v: PickedVolunteer) => void;
  label?: string;
  autoFocus?: boolean;
  maxHeight?: string;
}) {
  const [all, setAll] = useState<Entry[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDirectory()
      .then(setAll)
      .catch((e) => setError(e instanceof Error ? e.message : "Falha de conexão."));
  }, []);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = normalizeForSearch(query);
    return q ? all.filter((v) => normalizeForSearch(v.searchName || v.fullName).includes(q)) : all;
  }, [all, query]);

  return (
    <div className="flex flex-col gap-2">
      <label className="label-mono" htmlFor={`picker-${label}`}>
        {label}
      </label>
      <input
        id={`picker-${label}`}
        type="search"
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filtrar por nome"
        autoComplete="off"
        className="campo"
      />
      {error && (
        <p role="alert" className="text-sm text-nave-danger">
          Erro: {error}
        </p>
      )}
      {!all && !error && <p className="text-sm text-nave-text-secondary">Carregando lista…</p>}
      {all && (
        <>
          <p className="text-xs text-nave-text-secondary" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "voluntário" : "voluntários"}
          </p>
          <ul className="flex flex-col divide-y divide-nave-bezel overflow-y-auto rounded-lg border border-nave-bezel" style={{ maxHeight }}>
            {filtered.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(r);
                    setQuery("");
                  }}
                  className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-nave-panel focus-visible:bg-nave-panel"
                >
                  <span className="text-base">
                    {r.fullName}
                    {r.isLeader && <span className="ml-2 text-xs text-nave-gold">Líder</span>}
                  </span>
                  <span className="shrink-0 rounded bg-nave-bezel px-2 py-0.5 text-xs text-nave-text">{r.teamName ?? "Sem equipe"}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-4 py-3 text-sm text-nave-text-secondary">Ninguém com esse nome.</li>}
          </ul>
        </>
      )}
    </div>
  );
}
