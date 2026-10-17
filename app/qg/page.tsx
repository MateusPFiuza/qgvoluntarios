import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/server/session";
import { LogoutButton } from "@/components/LogoutButton";

export default async function QgPage() {
  const adminSession = await getAdminSession();
  if (!adminSession) redirect("/qg/entrar");

  return (
    <div className="flex min-h-screen flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-lg uppercase tracking-wide text-nave-orange fx-glow-text">
          Área do QG
        </h1>
        <LogoutButton />
      </header>

      <div className="painel p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-nave-text-secondary">ADM conectado</p>
        <p className="mt-1 text-xl text-nave-text">{adminSession.name}</p>
        {adminSession.canManageRadios && (
          <p className="mt-1 text-sm text-nave-gold">Pode gerenciar rádios</p>
        )}
      </div>

      <div className="painel p-5 text-sm text-nave-text-secondary">
        <p className="mb-2 font-semibold text-nave-gold">Em construção (M1+)</p>
        <p>
          Check-in de refeições, gestão de rádios, janelas de elogios e os
          painéis de mapa/cronograma chegam nos próximos marcos. Este M0
          entrega apenas a estrutura de login e o design system.
        </p>
      </div>
    </div>
  );
}
