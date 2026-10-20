"use client";

import { useCallback, useEffect, useState } from "react";

type Data = {
  meal: { id: string; label: string; time: string; isMock: boolean };
  meals: { id: string; label: string }[];
  dashboard: {
    consumed: number;
    prepared: number;
    remaining: number;
    byTeam: { teamId: string; teamName: string; total: number; ate: number; pct: number; lagging: boolean }[];
    notEaten: { id: string; fullName: string; teamId: string | null; teamName: string | null; dietNotes: string | null }[];
  };
  dayTotals: { label: string; consumed: number; prepared: number }[];
  thresholdPct: number;
  updatedAt: string;
};

const REFRESH_MS = 5_000;

export function MealDashboard() {
  const [mealId, setMealId] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/qg/meals/dashboard${mealId ? `?mealId=${mealId}` : ""}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao atualizar.");
      setData(json);
      setLoadedAt(Date.now());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }, [mealId]);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (!document.hidden) load();
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const ago = loadedAt === null ? null : Math.max(0, Math.round((Date.now() - loadedAt) / 1000));

  if (!data) return <p className="text-nave-text-secondary">{error ? `${error}` : "Carregando…"}</p>;
  const d = data.dashboard;
  const notEaten = teamFilter ? d.notEaten.filter((n) => n.teamId === teamFilter) : d.notEaten;

  return (
    <div className="flex flex-col gap-4">
      <select
        value={data.meal.id}
        onChange={(e) => setMealId(e.target.value)}
        className="tap-target rounded border border-nave-gold bg-nave-bg px-3 text-base text-nave-text"
        aria-label="Refeição"
      >
        {data.meals.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>

      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-sm text-nave-text-secondary" aria-live="polite">
          {ago === null ? "Carregando…" : `Atualizado há ${ago} s`}
        </p>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="tap-target rounded-lg border border-nave-gold px-4 text-sm text-nave-gold disabled:opacity-60"
        >
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded border-2 border-nave-danger p-3 text-nave-danger">
          Erro: {error} (mostrando os últimos dados)
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Consumidas" value={d.consumed} />
        <Stat label="Preparadas" value={d.prepared} mock={data.meal.isMock} />
        <Stat label="Restantes" value={d.remaining} />
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start">
        <section className="painel p-4">
          <h2 className="mb-1 label-mono">Por equipe</h2>
          <p className="mb-3 text-xs text-nave-text-secondary">
            Da menor para a maior. Em laranja: abaixo de {data.thresholdPct}% depois da metade da refeição.
          </p>
          <ul className="flex flex-col gap-2">
            {d.byTeam.map((t) => (
              <li key={t.teamId}>
                <div className={`flex justify-between text-sm ${t.lagging ? "font-semibold text-nave-orange" : ""}`}>
                  <span>
                    {t.teamName}
                    {t.lagging && <span className="ml-2 text-xs">▲ atenção</span>}
                  </span>
                  <span className="font-mono">
                    {t.ate}/{t.total} · {t.pct}%
                  </span>
                </div>
                <div className="h-2 rounded bg-nave-bezel" aria-hidden="true">
                  <div className={`h-2 rounded ${t.lagging ? "bg-nave-orange" : "bg-nave-gold"}`} style={{ width: `${t.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="painel p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="label-mono">Ainda não comeu ({notEaten.length})</h2>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="tap-target rounded border border-nave-gold-dim bg-nave-bg px-2 text-sm text-nave-text"
              aria-label="Filtrar por equipe"
            >
              <option value="">Todas as equipes</option>
              {d.byTeam.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.teamName}
                </option>
              ))}
            </select>
          </div>
          <ul className="flex flex-col divide-y divide-nave-bezel">
            {notEaten.map((n) => (
              <li key={n.id} className="py-2 text-sm">
                {n.fullName} <span className="text-nave-text-secondary">· {n.teamName ?? "sem equipe"}</span>
                {n.dietNotes && <span className="ml-2 rounded border border-nave-orange px-1 text-xs text-nave-orange">{n.dietNotes}</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="painel p-4">
        <h2 className="mb-2 label-mono">Totais por dia</h2>
        <ul className="grid grid-cols-3 gap-2 text-center text-sm">
          {data.dayTotals.map((t) => (
            <li key={t.label}>
              <p className="text-nave-text-secondary">{t.label}</p>
              <p className="font-mono text-lg">
                {t.consumed}/{t.prepared}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="font-mono text-xs text-nave-text-secondary">Atualiza sozinho a cada {REFRESH_MS / 1000} s.</p>
    </div>
  );
}

function Stat({ label, value, mock }: { label: string; value: number; mock?: boolean }) {
  return (
    <div className="painel p-3">
      <p className="font-mono text-2xl text-nave-gold">{value}</p>
      <p className="text-xs uppercase text-nave-text-secondary">{label}</p>
      {mock && <span className="selo-exemplo mt-1">exemplo</span>}
    </div>
  );
}
