"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SIMPLE_MODE_EVENT, readSimpleMode } from "./simple-mode";

// Só nas telas de uso calmo com identidade forte; nunca no QG, check-in ou rádios.
const STARFIELD_PATHS = ["/", "/entrar"];
const COLORS = ["#E8B85A", "#E8B85A", "#E5672F", "#F3E6CC"];

/** Campo de estrelas em pixels; desligado por Modo simples e por prefers-reduced-motion. */
export function Starfield() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(!mq.matches && !readSimpleMode());
    update();
    mq.addEventListener("change", update);
    window.addEventListener(SIMPLE_MODE_EVENT, update);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener(SIMPLE_MODE_EVENT, update);
    };
  }, []);

  if (!enabled || !STARFIELD_PATHS.includes(pathname ?? "")) return null;
  return <StarCanvas />;
}

function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let lastDraw = 0;
    const FRAME_INTERVAL_MS = 1000 / 10; // baixa taxa de quadros proposital
    const stars = Array.from({ length: 36 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() < 0.25 ? 3 : 2,
      speed: Math.random() * 0.0006 + 0.0002,
      color: COLORS[i % COLORS.length],
      alpha: Math.random() * 0.35 + 0.25,
    }));

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    const draw = (t: number) => {
      frame = requestAnimationFrame(draw);
      if (t - lastDraw < FRAME_INTERVAL_MS) return;
      lastDraw = t;
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        s.y = (s.y + s.speed) % 1;
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.fillRect(Math.round(s.x * width), Math.round(s.y * height), s.size, s.size);
      }
    };
    const start = () => {
      cancelAnimationFrame(frame);
      if (document.visibilityState === "visible") frame = requestAnimationFrame(draw);
    };

    resize();
    start();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", start);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", start);
    };
  }, []);

  return <canvas ref={canvasRef} className="fx-starfield" aria-hidden="true" />;
}
