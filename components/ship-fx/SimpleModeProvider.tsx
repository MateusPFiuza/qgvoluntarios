"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type SimpleModeContextValue = {
  simpleMode: boolean;
  setSimpleMode: (value: boolean) => void;
  toggleSimpleMode: () => void;
};

const STORAGE_KEY = "qg26:modo-simples";

const SimpleModeContext = createContext<SimpleModeContextValue | null>(null);

/**
 * Controla o "Modo Simples" (seção 3): desliga scanlines, vinheta,
 * campo de estrelas e brilho de texto. A preferência é salva no
 * aparelho (localStorage) e combinada com prefers-reduced-motion,
 * que sempre desliga os efeitos independentemente desta escolha.
 */
export function SimpleModeProvider({ children }: { children: React.ReactNode }) {
  const [simpleMode, setSimpleModeState] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setSimpleModeState(true);
    } catch {
      // localStorage pode não estar disponível; segue com o padrão (efeitos ligados).
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (simpleMode) {
      root.classList.add("modo-simples");
    } else {
      root.classList.remove("modo-simples");
    }
  }, [simpleMode]);

  const setSimpleMode = useCallback((value: boolean) => {
    setSimpleModeState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      // ignora falha de storage (ex.: aba anônima)
    }
  }, []);

  const toggleSimpleMode = useCallback(() => {
    setSimpleMode(!simpleMode);
  }, [simpleMode, setSimpleMode]);

  return (
    <SimpleModeContext.Provider value={{ simpleMode, setSimpleMode, toggleSimpleMode }}>
      {children}
    </SimpleModeContext.Provider>
  );
}

export function useSimpleMode() {
  const ctx = useContext(SimpleModeContext);
  if (!ctx) {
    throw new Error("useSimpleMode deve ser usado dentro de SimpleModeProvider");
  }
  return ctx;
}
