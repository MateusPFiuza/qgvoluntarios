import { redirect } from "next/navigation";
import { getVolunteerSession } from "@/lib/server/session";
import { isDemoMode } from "@/lib/server/env";
import { VolunteerLoginForm } from "@/components/VolunteerLoginForm";
import { LogoGeracaoAtomika } from "@/components/brand/Logo";
import { StripeDivider } from "@/components/brand/StripeDivider";
import demoLogins from "@/supabase/seed/demo/logins-de-teste.json";

export default async function EntrarPage() {
  const session = await getVolunteerSession();
  if (session) redirect("/");

  const demoMode = isDemoMode();

  return (
    <div className="flex min-h-screen flex-col gap-8 px-5 py-10">
      <header className="flex flex-col items-center text-center">
        <LogoGeracaoAtomika priority className="h-auto w-56" />
        <StripeDivider className="mt-6 w-48" />
        <h1 className="mt-5 font-display text-3xl text-nave-text">Voluntários</h1>
        <p className="mt-2 text-nave-text-secondary">Entre para ver sua escala, refeições e o QR pessoal.</p>
      </header>

      <div className="painel p-5">
        <VolunteerLoginForm />
      </div>

      {demoMode && (
        <div className="rounded-xl border border-nave-bezel p-4 text-sm text-nave-text-secondary">
          <p className="mb-2 font-semibold text-nave-text">
            Modo demonstração <span className="selo-exemplo">exemplo</span>
          </p>
          <p className="mb-2">Dados fictícios. Use um destes logins de teste:</p>
          <ul className="space-y-1">
            {demoLogins.map((l) => (
              <li key={l.name}>
                {l.name}: CPF {l.cpfLast4}, nasc. {l.birthDDMM} ({l.team}, {l.role})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
