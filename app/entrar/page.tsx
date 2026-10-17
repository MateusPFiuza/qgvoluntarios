import { redirect } from "next/navigation";
import { getVolunteerSession } from "@/lib/server/session";
import { isDemoMode } from "@/lib/server/env";
import { VolunteerLoginForm } from "@/components/VolunteerLoginForm";
import { SimpleModeToggle } from "@/components/ship-fx/SimpleModeToggle";
import demoLogins from "@/supabase/seed/demo/logins-de-teste.json";

export default async function EntrarPage() {
  const session = await getVolunteerSession();
  if (session) redirect("/");

  const demoMode = isDemoMode();

  return (
    <div className="flex min-h-screen flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-lg uppercase tracking-wide text-nave-gold fx-glow-text">
          G&apos;26 Voluntários
        </h1>
        <SimpleModeToggle />
      </header>

      <div className="painel p-5">
        <p className="mb-4 font-mono text-xs uppercase tracking-wide text-nave-text-secondary">
          Terminal de acesso · Geração Atômika 2026
        </p>
        <VolunteerLoginForm />
      </div>

      {demoMode && (
        <div className="painel p-4 text-xs text-nave-text-secondary">
          <p className="mb-2 font-semibold text-nave-gold">
            Modo demonstração <span className="selo-exemplo">exemplo</span>
          </p>
          <p className="mb-2">Dados fictícios. Use um destes logins de teste:</p>
          <ul className="space-y-1 font-mono">
            {demoLogins.map((l) => (
              <li key={l.name}>
                {l.name} — CPF {l.cpfLast4}, nasc. {l.birthDDMM} ({l.team}, {l.role})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
