"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Starfield } from "./Starfield";
import { useSimpleMode } from "./SimpleModeProvider";

/**
 * Camada de efeitos visuais ("tela de nave"): scanlines, vinheta e
 * campo de estrelas. Some automaticamente em Modo Simples e em
 * prefers-reduced-motion (critério de aceite #2 da seção 14).
 */
const OPERATIONAL_PREFIXES = ["/qg/refeicoes", "/qg/radios"];

export function ShipChrome() {
  const { simpleMode } = useSimpleMode();
  const pathname = usePathname();
  // Telas operacionais (check-in e rádios): efeitos desligados por padrão (seção 3).
  const operational = OPERATIONAL_PREFIXES.some((p) => pathname?.startsWith(p));
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const showEffects = !simpleMode && !reducedMotion && !operational;

  if (!showEffects) return null;

  return (
    <>
      <Starfield />
      <div className="fx-scanlines" aria-hidden="true" />
      <div className="fx-vignette" aria-hidden="true" />
    </>
  );
}
