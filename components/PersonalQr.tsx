"use client";

import { useCallback, useEffect, useState } from "react";

const WINDOW_S = 30;

export function PersonalQr({ mealStatus }: { mealStatus?: { text: string; tone: "ok" | "done" | "info" } | null }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/me/qr", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar o QR.");
      setSvg(data.svg);
      setError(null);
      setExpiresAt(Date.now() + (data.refreshInMs as number));
      return data.refreshInMs as number;
    } catch (e) {
      setSvg(null);
      setExpiresAt(null);
      setError(e instanceof Error ? e.message : "Sem conexão. O QR não pôde ser atualizado.");
      return 5_000;
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let alive = true;
    const tick = async () => {
      const wait = await load();
      if (alive) timer = setTimeout(tick, Math.max(1_000, wait + 300));
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [load]);

  const left = expiresAt === null ? null : Math.max(0, Math.min(WINDOW_S, Math.ceil((expiresAt - now) / 1000)));
  const R = 20;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex flex-col items-center gap-3">
      {mealStatus && (
        <p
          className={`w-full rounded-lg border-2 px-4 py-2 text-center text-lg font-semibold ${
            mealStatus.tone === "ok" ? "border-nave-success text-nave-success" : mealStatus.tone === "done" ? "border-nave-orange text-nave-orange" : "border-nave-bezel text-nave-text"
          }`}
        >
          {mealStatus.tone === "ok" ? "✓ " : mealStatus.tone === "done" ? "! " : ""}
          {mealStatus.text}
        </p>
      )}
      <div className="w-full max-w-[320px] rounded-lg bg-white p-3" aria-live="polite">
        {svg ? (
          <div role="img" aria-label="Seu QR code pessoal" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <div className="flex aspect-square items-center justify-center text-center text-sm text-black">
            {error ? "QR indisponível" : "Gerando…"}
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="text-center text-base text-nave-danger">
          {error}
        </p>
      )}
      {left !== null && (
        <div className="flex items-center gap-3" aria-live="off">
          <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" className="-rotate-90">
            <circle cx="24" cy="24" r={R} fill="none" stroke="#201811" strokeWidth="5" />
            <circle
              cx="24"
              cy="24"
              r={R}
              fill="none"
              stroke="#E8B85A"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - left / WINDOW_S)}
            />
          </svg>
          <p className="font-mono text-base text-nave-text">Válido por {left} s</p>
        </div>
      )}
      <p className="text-center text-sm text-nave-text-secondary">
        O código muda a cada 30 segundos. Print não funciona. Aumente o brilho da tela.
      </p>
    </div>
  );
}
