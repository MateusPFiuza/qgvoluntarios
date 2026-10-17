"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Aviso de privacidade na primeira entrada (seção 12). Texto provisório. */
export function PrivacyGate() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const accept = async () => {
    try {
      const res = await fetch("/api/me/privacy", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    }
  };
  return (
    <div className="flex min-h-screen flex-col justify-center gap-4 px-4 py-8">
      <div className="painel flex flex-col gap-3 p-5">
        <h1 className="font-display text-lg uppercase text-nave-gold">Antes de começar</h1>
        <span className="selo-exemplo self-start">texto de exemplo</span>
        <p>Usamos seus dados só para organizar o serviço no Geração Atômika 2026. CPF e RG ficam criptografados e aparecem só mascarados. Elogios são anônimos. Os documentos são apagados após o evento.</p>
        <Link href="/privacidade" className="text-sm text-nave-gold underline">
          Ler o aviso completo
        </Link>
        <button onClick={accept} className="min-h-[52px] rounded bg-nave-gold font-mono font-bold uppercase text-nave-bg">
          Li e concordo
        </button>
        {error && <p role="alert" className="text-nave-danger">⚠ {error}</p>}
      </div>
    </div>
  );
}
