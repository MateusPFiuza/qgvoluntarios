"use client";

import { useEffect, useState } from "react";
import { shouldShowResults } from "@/lib/rules/name-search";

export type PickedVolunteer = { id: string; fullName: string; teamName: string | null; isLeader: boolean };

/** Busca de voluntário por nome (3+ letras, sem acento) para as telas do QG. */
export function VolunteerPicker({ onPick, label = "Buscar por nome", autoFocus }: { onPick: (v: PickedVolunteer) => void; label?: string; autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedVolunteer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldShowResults(query)) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/volunteers/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResults(data.results ?? []);
        setError(null);
      } catch (e) {
        setError(e instanceof Error && e.message ? e.message : "Falha de conexão na busca.");
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <label className="font-mono text-xs uppercase tracking-wide text-nave-text-secondary" htmlFor="picker-q">
        {label}
      </label>
      <input
        id="picker-q"
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Digite 3 letras ou mais"
        autoComplete="off"
        className="tap-target w-full rounded border border-nave-gold-dim bg-nave-bg px-3 text-base text-nave-text"
      />
      {error && <p role="alert" className="text-sm text-nave-danger">⚠ {error}</p>}
      <ul className="flex flex-col gap-1">
        {results.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => {
                onPick(r);
                setQuery("");
                setResults([]);
              }}
              className="tap-target w-full rounded border border-nave-bezel bg-nave-panel px-3 py-2 text-left text-base hover:border-nave-gold"
            >
              {r.fullName}
              <span className="ml-2 font-mono text-xs text-nave-text-secondary">
                {r.teamName ?? "sem equipe"}
                {r.isLeader ? " · ★ líder" : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
