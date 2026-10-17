"use client";

import { useEffect, useState } from "react";

type Data = {
  meal: { id: string; label: string; time: string; isMock: boolean };
  meals: { id: string; label: string }[];
  dashboard: {
    consumed: number;
    prepared: number;
    remaining: number;
    byTeam: { teamId: string; teamName: string; total: number; ate: number; pct: number }[];
    notEaten: { id: string; fullName: string; teamId: string | null; teamName: string | null; dietNotes: string | null }[];
  };
  dayTotals: { label: string; consumed: number; prepared: number }[];
  updatedAt: string;
};

const REFRESH_MS = 5_000;

export function MealDashboard() {
  const [mealId, setMealId] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/qg/meals/dashboard${mealId ? `?mealId=${mealId}` : ""}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erro ao atualizar.");
        if (alive) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Falha de conexão.");
      }
    };
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [mealId]);

  if (!data) return <p className="text-nave-text-secondary">{error ? `⚠ ${error}` : "Carregando…"}</p>;
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

      {error && <p role="alert" className="text-nave-danger">⚠ {error} (mostrando os últimos dados)</p>}

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Consumidas" value={d.consumed} />
        <Stat label="Preparadas" value={d.prepared} mock={data.meal.isMock} />
        <Stat label="Restantes" value={d.remaining} />
      </div>

      <section className="painel p-4">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-wide text-nave-text-secondary">Por equipe</h2>
        <ul className="flex flex-col gap-2">
          {d.byTeam.map((t) => (
            <li key={t.teamId}>
              <div className="flex justify-between text-sm">
                <span>{t.teamName}</span>
                <span className="font-mono">
                  {t.ate}/{t.total} · {t.pct}%
                </span>
              </div>
              <div className="h-2 rounded bg-nave-bezel" aria-hidden="true">
                <div className="h-2 rounded bg-nave-gold" style={{ width: `${t.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="painel p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-mono text-xs uppercase tracking-wide text-nave-text-secondary">Ainda não comeu ({notEaten.length})</h2>
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
              {n.dietNotes && <span className="ml-2 rounded border border-nave-orange px-1 text-xs text-nave-orange">🍽 {n.dietNotes}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="painel p-4">
        <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-nave-text-secondary">Totais por dia</h2>
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

      <p className="font-mono text-xs text-nave-text-secondary">
        Atualiza a cada {REFRESH_MS / 1000} s · última: {new Date(data.updatedAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}
      </p>
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
