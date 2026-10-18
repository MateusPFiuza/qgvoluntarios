"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PRESETS: [string, string | null][] = [
  ["Agora (real)", null],
  ["Antes do evento", "2026-12-10T20:00:00-03:00"],
  ["Sexta 19h45", "2026-12-11T19:45:00-03:00"],
  ["Sábado 10h", "2026-12-12T10:00:00-03:00"],
  ["Sábado 12h40", "2026-12-12T12:40:00-03:00"],
  ["Sábado 16h20", "2026-12-12T16:20:00-03:00"],
  ["Domingo 14h", "2026-12-13T14:00:00-03:00"],
  ["Depois do evento", "2026-12-13T18:00:00-03:00"],
];

/** Escolher data e hora para ver as telas em qualquer momento do evento. */
export function ClockControl({ current, simulated }: { current: string; simulated: boolean }) {
  const router = useRouter();
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apply = async (value: string | null) => {
    try {
      const res = await fetch("/api/clock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível mudar o relógio.");
      setError(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão.");
    }
  };

  return (
    <details className="rounded-xl border border-nave-gold/40 bg-nave-gold/5 px-4 py-1">
      <summary className="tap-target flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="whitespace-nowrap font-semibold text-nave-gold">Viajar no tempo</span>
        <span className="text-sm text-nave-text-secondary">
          {current}
          {simulated ? " (simulado)" : ""}
        </span>
      </summary>
      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map(([label, value]) => (
          <button key={label} onClick={() => apply(value)} className="tap-target rounded-lg border border-nave-bezel px-3 text-sm hover:border-nave-gold">
            {label}
          </button>
        ))}
      </div>
      <form
        className="mb-3 mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (custom) apply(`${custom}:00-03:00`);
        }}
      >
        <input type="datetime-local" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Data e hora (Brasília)" className="campo flex-1" />
        <button className="tap-target rounded-lg bg-nave-gold px-4 text-sm font-semibold text-nave-bg">Ir</button>
      </form>
      {error && <p role="alert" className="mt-2 text-nave-danger">Erro: {error}</p>}
    </details>
  );
}
