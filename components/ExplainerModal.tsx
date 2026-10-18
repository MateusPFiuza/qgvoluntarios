"use client";

import { useEffect, useRef, useState } from "react";
import { TRAIT_INFO, TRAITS } from "@/lib/rules/praise";
import { TraitIcon } from "./TraitIcon";

const FAIL_UNLOCK_MS = 15_000;
const MOCK_DURATION_MS = 12_000;

/**
 * Vídeo explicativo, mostrado toda vez que a área de elogios abre (seção 8).
 * "Entendi" só libera quando o vídeo termina; se falhar ao carregar, após 15 s.
 * Sem URL configurada, toca uma animação provisória marcada como exemplo.
 */
export function ExplainerModal({ videoUrl, onClose }: { videoUrl: string | null; onClose: () => void }) {
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => {
      const ms = Date.now() - started;
      setElapsed(ms);
      if (!videoUrl && ms >= MOCK_DURATION_MS) setDone(true);
      if (videoUrl && !loadedRef.current && ms >= FAIL_UNLOCK_MS) setDone(true);
    }, 250);
    return () => clearInterval(t);
  }, [videoUrl]);

  const step = Math.min(3, Math.floor(elapsed / (MOCK_DURATION_MS / 4)));

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="explainer-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4">
      <div className="painel flex w-full max-w-md flex-col gap-4 p-5">
        <h2 id="explainer-title" className="font-display text-xl font-semibold text-nave-text">Como funcionam os elogios</h2>
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            autoPlay
            muted
            playsInline
            onLoadedData={() => (loadedRef.current = true)}
            onEnded={() => setDone(true)}
            className="aspect-video w-full rounded bg-black"
          />
        ) : (
          <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-2 overflow-hidden rounded border border-nave-bezel bg-nave-bg p-3 text-center" aria-live="polite">
            <span className="selo-exemplo absolute right-2 top-2">vídeo de exemplo</span>
            {step === 0 ? (
              <>
                <p className="font-display text-xl text-nave-gold">ELOGIOS G&apos;26</p>
                <p className="text-sm">Reconheça quem serve com você. É anônimo.</p>
              </>
            ) : (
              <>
                <span className="text-nave-gold"><TraitIcon trait={TRAITS[step - 1]} size={56} /></span>
                <p className="text-lg text-nave-gold">{TRAIT_INFO[TRAITS[step - 1]].label}</p>
                <p className="text-sm">{TRAIT_INFO[TRAITS[step - 1]].meaning}</p>
              </>
            )}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-nave-bezel" aria-hidden="true">
              <div className="h-1 bg-nave-gold" style={{ width: `${Math.min(100, (elapsed / MOCK_DURATION_MS) * 100)}%` }} />
            </div>
          </div>
        )}
        <ul className="text-sm text-nave-text-secondary">
          <li>• Toque nos ícones para acender um elogio. Toque de novo para retirar.</li>
          <li>• Uma vez por pessoa em cada característica, a cada janela.</li>
          <li>• Ninguém da organização vê quem elogiou pelo app.</li>
        </ul>
        <button
          onClick={onClose}
          disabled={!done}
          className="min-h-[52px] rounded-lg bg-nave-gold text-base font-semibold text-nave-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          {done ? "Entendi" : `Assista até o fim (${Math.max(0, Math.ceil(((videoUrl ? FAIL_UNLOCK_MS : MOCK_DURATION_MS) - elapsed) / 1000))} s)`}
        </button>
      </div>
    </div>
  );
}
