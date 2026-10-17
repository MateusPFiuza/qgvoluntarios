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
    <details className="painel p-4">
      <summary className="tap-target flex cursor-pointer items-center font-mono text-xs uppercase tracking-wide text-nave-text-secondary">
        ⏱ Relógio {simulated ? "simulado" : "real"}: {current}
      </summary>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map(([label, value]) => (
          <button key={label} onClick={() => apply(value)} className="tap-target rounded border border-nave-gold-dim px-3 text-sm">
            {label}
          </button>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (custom) apply(`${custom}:00-03:00`);
        }}
      >
        <input type="datetime-local" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Data e hora (Brasília)" className="tap-target flex-1 rounded border border-nave-gold-dim bg-nave-bg px-2 text-nave-text" />
        <button className="tap-target rounded bg-nave-gold px-3 font-mono text-sm uppercase text-nave-bg">Ir</button>
      </form>
      {error && <p role="alert" className="mt-2 text-nave-danger">⚠ {error}</p>}
    </details>
  );
}
