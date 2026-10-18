"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const OPERATIONAL_PREFIXES = ["/qg/refeicoes", "/qg/radios"];

/** Campo de estrelas discreto; desligado em telas operacionais e com prefers-reduced-motion. */
export function Starfield() {
  const pathname = usePathname();
  const operational = OPERATIONAL_PREFIXES.some((p) => pathname?.startsWith(p));
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  if (operational || reducedMotion) return null;
  return <StarCanvas />;
}

function StarCanvas() {
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

    const stars = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.4,
      speed: Math.random() * 0.08 + 0.02,
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
        ctx!.globalAlpha = 0.18;
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
