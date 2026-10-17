"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/volunteer/logout", { method: "POST" });
        router.push("/entrar");
        router.refresh();
      }}
      className="tap-target rounded border border-nave-gold-dim px-3 py-2 text-xs font-mono uppercase tracking-wide text-nave-text-secondary hover:border-nave-gold hover:text-nave-gold"
    >
      Sair
    </button>
  );
}
