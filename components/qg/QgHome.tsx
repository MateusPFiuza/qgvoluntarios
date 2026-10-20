"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { QgSummary } from "@/lib/rules/qg-summary";

const REFRESH_MS = 15_000;

type Card = { href: string; label: string; key: "meal" | "mealPanel" | "praise" | "radios" };

export function QgHome({ initial, cards }: { initial: QgSummary; cards: Card[] }) {
  const [summary, setSummary] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/qg/summary", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Não foi possível atualizar.");
        setSummary(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha de conexão.");
      }
    };
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const indicator = (key: Card["key"]) => {
    if (key === "meal" || key === "mealPanel") {
      return summary.meal ? `${summary.meal.label}: ${summary.meal.consumed} de ${summary.meal.prepared}` : "Nenhuma refeição cadastrada";
    }
    if (key === "radios") {
      const { out, total, notReturned } = summary.radios;
      return `Rádios fora: ${out} de ${total}${notReturned ? `, ${notReturned} não ${notReturned === 1 ? "devolvido" : "devolvidos"}` : ""}`;
    }
    return summary.praise.open ? `Janela aberta (${summary.praise.name})` : "Janela fechada";
  };

  return (
    <>
      {error && (
        <p role="alert" className="rounded border-2 border-nave-danger p-3 text-nave-danger">
          Erro ao atualizar: {error}
        </p>
      )}
      <nav className="grid gap-3 lg:grid-cols-2">
        {cards.map((c) => {
          const warn = c.key === "radios" && summary.radios.notReturned > 0;
          return (
            <Link key={c.href} href={c.href} className="painel flex min-h-[96px] flex-col justify-center gap-1 px-5 py-4 hover:border-nave-gold">
              <span className="font-display text-xl text-nave-text">{c.label}</span>
              <span className={`font-mono text-base ${warn ? "text-nave-orange" : "text-nave-gold"}`}>{indicator(c.key)}</span>
            </Link>
          );
        })}
      </nav>
      <p className="text-xs text-nave-text-secondary">Atualiza a cada 15 segundos.</p>
    </>
  );
}
