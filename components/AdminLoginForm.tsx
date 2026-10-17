"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        setLoading(false);
        return;
      }
      router.push("/qg");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="senha-adm" className="block font-mono text-xs uppercase tracking-wide text-nave-text-secondary">
          Senha de ADM (individual)
        </label>
        <input
          id="senha-adm"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="tap-target mt-1 w-full rounded border border-nave-gold-dim bg-nave-panel px-3 py-3 text-base text-nave-text outline-none focus-visible:border-nave-gold"
        />
      </div>

      {error && (
        <p role="alert" className="rounded border border-nave-danger bg-nave-danger/10 px-3 py-2 text-sm text-nave-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={password.length === 0 || loading}
        className="tap-target rounded bg-nave-orange px-4 py-3 text-base font-semibold text-nave-bg disabled:opacity-40"
      >
        {loading ? "Verificando..." : "Entrar na Área do QG"}
      </button>
    </form>
  );
}
