"use client";

import { useEffect, useRef } from "react";

/**
 * Campo de estrelas em canvas, baixa taxa de quadros (seção 3).
 * - Pausa quando a aba está oculta (document.visibilityState).
 * - Não é renderizado em Modo Simples / prefers-reduced-motion (ver uso em
 *   ShipChrome, que não monta este componente nesses casos).
 * - Orçamento de desempenho: poucas centenas de pontos, sem imagens.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrame: number;
    let lastDraw = 0;
    const FRAME_INTERVAL_MS = 1000 / 12; // baixa taxa de quadros proposital

    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.2,
      speed: Math.random() * 0.15 + 0.03,
    }));

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width;
      canvas!.height = height;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw(timestamp: number) {
      animationFrame = requestAnimationFrame(draw);
      if (document.visibilityState !== "visible") return;
      if (timestamp - lastDraw < FRAME_INTERVAL_MS) return;
      lastDraw = timestamp;

      ctx!.clearRect(0, 0, width, height);
      ctx!.fillStyle = "#E8B85A";
      for (const star of stars) {
        star.y += star.speed;
        if (star.y > height) star.y = 0;
        ctx!.globalAlpha = 0.25 + Math.random() * 0.15;
        ctx!.fillRect(star.x, star.y, star.r, star.r);
      }
    }

    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fx-starfield" aria-hidden="true" />;
}
