"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MIN_QUERY_LENGTH, shouldShowResults } from "@/lib/rules/name-search";

type SearchResult = {
  id: string;
  fullName: string;
  teamName: string | null;
  isLeader: boolean;
  isMock: boolean;
};

export function VolunteerLoginForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [cpfLast4, setCpfLast4] = useState("");
  const [birthDDMM, setBirthDDMM] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!shouldShowResults(query)) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/volunteers/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Escolha seu nome na lista.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/volunteer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerId: selected.id, cpfLast4, birthDDMM }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="nome" className="block font-mono text-xs uppercase tracking-wide text-nave-text-secondary">
          Seu nome
        </label>
        <input
          id="nome"
          type="text"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder={`Digite ${MIN_QUERY_LENGTH}+ letras...`}
          className="tap-target mt-1 w-full rounded border border-nave-gold-dim bg-nave-panel px-3 py-3 text-base text-nave-text outline-none focus-visible:border-nave-gold"
        />
        {query.length > 0 && !shouldShowResults(query) && (
          <p className="mt-1 text-xs text-nave-text-secondary">
            Digite pelo menos {MIN_QUERY_LENGTH} letras para ver a lista.
          </p>
        )}
        {results.length > 0 && !selected && (
          <ul className="mt-2 max-h-56 overflow-y-auto rounded border border-nave-gold-dim bg-nave-panel">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(r);
                    setQuery(r.fullName);
                    setResults([]);
                  }}
                  className="tap-target flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-nave-bezel"
                >
                  <span className="text-sm text-nave-text">
                    {r.fullName} {r.isLeader && <span className="text-nave-gold">★ líder</span>}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-nave-text-secondary">
                    {r.teamName ?? "Sem equipe"}
                    {r.isMock && <span className="selo-exemplo">exemplo</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <>
          <div>
            <label htmlFor="cpf" className="block font-mono text-xs uppercase tracking-wide text-nave-text-secondary">
              4 últimos dígitos do CPF
            </label>
            <input
              id="cpf"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={cpfLast4}
              onChange={(e) => setCpfLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="tap-target mt-1 w-full rounded border border-nave-gold-dim bg-nave-panel px-3 py-3 text-base font-mono text-nave-text outline-none focus-visible:border-nave-gold"
            />
          </div>
          <div>
            <label htmlFor="nasc" className="block font-mono text-xs uppercase tracking-wide text-nave-text-secondary">
              Nascimento (DDMM)
            </label>
            <input
              id="nasc"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="0512"
              value={birthDDMM}
              onChange={(e) => setBirthDDMM(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="tap-target mt-1 w-full rounded border border-nave-gold-dim bg-nave-panel px-3 py-3 text-base font-mono text-nave-text outline-none focus-visible:border-nave-gold"
            />
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="rounded border border-nave-danger bg-nave-danger/10 px-3 py-2 text-sm text-nave-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!selected || cpfLast4.length < 4 || birthDDMM.length < 4 || loading}
        className="tap-target rounded bg-nave-gold px-4 py-3 text-base font-semibold text-nave-bg disabled:opacity-40"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
