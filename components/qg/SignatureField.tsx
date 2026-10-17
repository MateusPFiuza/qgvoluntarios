"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import type SignaturePadType from "signature_pad";

export type SignatureFieldHandle = { isEmpty: () => boolean; toDataURL: () => string; clear: () => void };

/** Campo de assinatura com o dedo (canvas). */
export const SignatureField = forwardRef<SignatureFieldHandle>(function SignatureField(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadType | null>(null);

  useEffect(() => {
    let disposed = false;
    const canvas = canvasRef.current!;
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")!.scale(ratio, ratio);
      padRef.current?.clear();
    };
    import("signature_pad").then(({ default: SignaturePad }) => {
      if (disposed) return;
      resize();
      padRef.current = new SignaturePad(canvas, { penColor: "#000", backgroundColor: "#fff", minWidth: 1, maxWidth: 2.5 });
    });
    window.addEventListener("resize", resize);
    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      padRef.current?.off();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    toDataURL: () => padRef.current?.toDataURL("image/png") ?? "",
    clear: () => padRef.current?.clear(),
  }));

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        aria-label="Campo de assinatura: assine com o dedo"
        className="h-44 w-full touch-none rounded border-2 border-nave-gold bg-white"
      />
      <button type="button" onClick={() => padRef.current?.clear()} className="tap-target self-end rounded border border-nave-gold-dim px-3 font-mono text-xs uppercase text-nave-text-secondary">
        Limpar assinatura
      </button>
    </div>
  );
});
