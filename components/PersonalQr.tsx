"use client";

import { useCallback, useEffect, useState } from "react";

export function PersonalQr() {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/me/qr", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar o QR.");
      setSvg(data.svg);
      setError(null);
      return data.refreshInMs as number;
    } catch (e) {
      setSvg(null);
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

  return (
    <div className="flex flex-col items-center gap-3">
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
      <p className="text-center text-sm text-nave-text-secondary">
        O código muda a cada 30 segundos. Print não funciona. Aumente o brilho da tela.
      </p>
    </div>
  );
}
