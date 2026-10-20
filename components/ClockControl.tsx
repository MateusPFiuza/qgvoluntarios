"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PRESETS: [string, string | null][] = [
  ["Agora (real)", null],
  ["Antes do evento", "2026-12-10T20:00:00-03:00"],
  ["Sexta 20h15", "2026-12-11T20:15:00-03:00"],
  ["Sábado 10h", "2026-12-12T10:00:00-03:00"],
  ["Sábado 12h40", "2026-12-12T12:40:00-03:00"],
  ["Sábado 16h20", "2026-12-12T16:20:00-03:00"],
  ["Domingo 12h30", "2026-12-13T12:30:00-03:00"],
  ["Depois do evento", "2026-12-13T19:00:00-03:00"],
];

/** Relógio simulado: ícone pequeno no cabeçalho que abre o painel. */
export function ClockControl({ current, simulated, demo }: { current: string; simulated: boolean; demo: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apply = async (value: string | null) => {
    try {
      const res = await fetch("/api/clock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível mudar o relógio.");
      setError(null);
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Relógio: ${current}${simulated ? ", simulado" : ""}. Viajar no tempo`}
        className="tap-target relative flex items-center justify-center rounded-lg border border-nave-bezel text-nave-gold hover:border-nave-gold"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
        {demo && simulated && (
          <span className="absolute -right-1.5 -top-1.5 rounded bg-nave-gold px-1 font-mono text-[12px] leading-4 text-nave-bg">Demo</span>
        )}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-20" onClick={() => setOpen(false)}>
          <div role="dialog" aria-label="Viajar no tempo" className="painel w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-display text-lg text-nave-gold">Viajar no tempo</p>
              <button type="button" onClick={() => setOpen(false)} className="tap-target rounded-lg px-3 text-sm text-nave-text-secondary">
                Fechar
              </button>
            </div>
            <p className="mb-3 text-sm text-nave-text-secondary">
              Agora: {current}
              {simulated ? " (simulado)" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(([label, value]) => (
                <button key={label} onClick={() => apply(value)} className="tap-target rounded-lg border border-nave-bezel px-3 text-sm hover:border-nave-gold">
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
              <input type="datetime-local" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Data e hora (Brasília)" className="campo flex-1" />
              <button className="tap-target rounded-lg bg-nave-gold px-4 text-sm font-semibold text-nave-bg">Ir</button>
            </form>
            {error && <p role="alert" className="mt-2 text-nave-danger">Erro: {error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
