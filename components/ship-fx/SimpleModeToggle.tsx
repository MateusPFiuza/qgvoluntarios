"use client";

import { useSimpleMode } from "./SimpleModeProvider";

export function SimpleModeToggle() {
  const { simpleMode, toggleSimpleMode } = useSimpleMode();

  return (
    <button
      type="button"
      onClick={toggleSimpleMode}
      className="tap-target rounded border border-nave-gold-dim px-3 py-2 text-xs font-mono uppercase tracking-wide text-nave-text-secondary hover:border-nave-gold hover:text-nave-gold transition-colors"
      aria-pressed={simpleMode}
    >
      {simpleMode ? "Modo simples: ligado" : "Modo simples: desligado"}
    </button>
  );
}
