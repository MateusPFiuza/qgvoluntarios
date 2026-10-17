"use client";

import { useState } from "react";

export type MapPoint = { id: string; name: string; kind: string; description: string | null; x: number; y: number; teamsNow: string[] };

const ICON: Record<string, string> = {
  refeitorio: "🍽",
  banheiro: "WC",
  enfermaria: "✚",
  qg: "QG",
  palco: "★",
  acolhida: "☺",
  loja: "$",
  kids: "K",
  portao: "⇧",
  servico: "•",
  oracao: "✝",
};

/** Mapa ilustrativo em SVG com pontos clicáveis e zoom (botões ou pinça nativa). */
export function MapView({ points, isMock }: { points: MapPoint[]; isMock: boolean }) {
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<MapPoint | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {isMock && <span className="selo-exemplo">mapa ilustrativo</span>}
        <div className="flex gap-2">
          <button aria-label="Diminuir zoom" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="tap-target rounded border border-nave-gold-dim px-3 text-lg">
            −
          </button>
          <button aria-label="Aumentar zoom" onClick={() => setZoom((z) => Math.min(3, z + 0.5))} className="tap-target rounded border border-nave-gold-dim px-3 text-lg">
            +
          </button>
        </div>
      </div>
      <div className="overflow-auto rounded border border-nave-bezel" style={{ touchAction: "pan-x pan-y pinch-zoom", maxHeight: "70vh" }}>
        <div className="relative" style={{ width: `${zoom * 100}%`, aspectRatio: "3 / 4" }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <rect x="1" y="1" width="98" height="98" rx="2" fill="#120d09" stroke="#8A7245" strokeWidth="0.4" />
            <rect x="28" y="4" width="44" height="30" rx="2" fill="#1d1510" stroke="#E8B85A" strokeWidth="0.3" />
            <text x="50" y="30" textAnchor="middle" fontSize="2.6" fill="#8A7245" fontFamily="monospace">ARENA</text>
            <path d="M50 34 V92 M8 46 H92 M8 64 H92 M22 86 H78" stroke="#3a2c1f" strokeWidth="2.2" fill="none" />
            {[10, 30, 70, 90].map((x) => (
              <circle key={x} cx={x} cy={x / 3 + 3} r="0.3" fill="#E8B85A" opacity="0.6" />
            ))}
          </svg>
          {points.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              aria-label={p.name}
              aria-pressed={selected?.id === p.id}
              className={`absolute flex min-h-[48px] min-w-[48px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded border font-mono text-xs ${
                selected?.id === p.id ? "border-nave-orange bg-nave-orange text-nave-bg" : "border-nave-gold bg-nave-panel text-nave-gold"
              }`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span aria-hidden="true" className="text-sm leading-none">
                {ICON[p.kind] ?? "•"}
              </span>
              <span className="max-w-[72px] truncate px-1 text-[10px] leading-tight">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="painel min-h-[96px] p-4" aria-live="polite">
        {selected ? (
          <>
            <p className="text-lg">{selected.name}</p>
            {selected.description && <p className="text-sm text-nave-text-secondary">{selected.description}</p>}
            <p className="mt-1 text-sm">
              {selected.teamsNow.length > 0 ? `Equipes previstas aqui agora: ${selected.teamsNow.join(", ")}` : "Nenhuma equipe prevista aqui agora."}
            </p>
          </>
        ) : (
          <p className="text-nave-text-secondary">Toque em um ponto do mapa para ver os detalhes.</p>
        )}
      </div>
    </div>
  );
}
