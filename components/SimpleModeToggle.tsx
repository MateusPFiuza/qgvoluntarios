"use client";

import { useEffect, useState } from "react";
import { readSimpleMode, writeSimpleMode } from "@/components/ship-fx/simple-mode";

/** Liga e desliga o Modo simples (sem animação de fundo). Fica salvo no aparelho. */
export function SimpleModeToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(readSimpleMode()), []);
  return (
    <label className="tap-target flex items-center justify-between gap-3 rounded-lg px-1 text-sm text-nave-text-secondary">
      <span>
        Modo simples
        <span className="block text-xs">Desliga a animação de estrelas do fundo.</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        onChange={(e) => {
          setOn(e.target.checked);
          writeSimpleMode(e.target.checked);
        }}
        className="h-6 w-6 accent-[#E8B85A]"
      />
    </label>
  );
}
