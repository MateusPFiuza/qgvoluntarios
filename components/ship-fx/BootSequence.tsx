"use client";

import { useEffect, useState } from "react";
import { useSimpleMode } from "./SimpleModeProvider";

const SESSION_KEY = "qg26:boot-visto";
const MAX_DURATION_MS = 3000;

/**
 * Animação de abertura ("iniciando sistema"): no máximo uma vez por
 * sessão, dura no máximo 3s, tem botão de pular (seção 3). Não roda em
 * Modo Simples / prefers-reduced-motion — nesses casos é pulada direto.
 */
export function BootSequence() {
  const { simpleMode } = useSimpleMode();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alreadySeen = true;
    try {
      alreadySeen = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      alreadySeen = false;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (alreadySeen || simpleMode || reducedMotion) {
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => finish(), MAX_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    setVisible(false);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignora
    }
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-nave-bg font-mono text-nave-gold"
    >
      <p className="text-sm tracking-[0.3em] fx-cursor">INICIANDO SISTEMA</p>
      <p className="text-xs text-nave-text-secondary">QG DOS VOLUNTÁRIOS · G&apos;26</p>
      <button
        type="button"
        onClick={finish}
        className="tap-target mt-4 rounded border border-nave-gold-dim px-4 py-2 text-xs uppercase tracking-wide text-nave-text-secondary hover:text-nave-gold hover:border-nave-gold"
      >
        Pular
      </button>
    </div>
  );
}
