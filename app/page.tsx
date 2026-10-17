import Link from "next/link";
import { redirect } from "next/navigation";
import { getVolunteerSession } from "@/lib/server/session";
import { getAdminAccountByVolunteerId } from "@/lib/server/repo";
import { SimpleModeToggle } from "@/components/ship-fx/SimpleModeToggle";
import { LogoutButton } from "@/components/LogoutButton";

export default async function HomePage() {
  const session = await getVolunteerSession();
  if (!session) redirect("/entrar");

  const adminAccount = await getAdminAccountByVolunteerId(session.sub);

  return (
    <div className="flex min-h-screen flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-lg uppercase tracking-wide text-nave-gold fx-glow-text">
          G&apos;26 Voluntários
        </h1>
        <div className="flex items-center gap-2">
          <SimpleModeToggle />
          <LogoutButton />
        </div>
      </header>

      <div className="painel p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-nave-text-secondary">Bem-vindo(a)</p>
        <p className="mt-1 text-xl text-nave-text fx-glow-text">{session.name}</p>
        {session.isLeader && <p className="mt-1 text-sm text-nave-gold">★ Líder de equipe</p>}
      </div>

      <nav className="grid grid-cols-2 gap-3">
        <PainelLink href="#" label="Cronograma" disponivel={false} />
        <PainelLink href="#" label="Refeições" disponivel={false} />
        <PainelLink href="#" label="Mapa" disponivel={false} />
        <PainelLink href="#" label="Elogios" disponivel={false} />
        <Link href="/minha-identificacao" className="painel tap-target col-span-2 flex items-center justify-center p-4 font-mono text-sm uppercase tracking-wide text-nave-gold">Minha identificação (QR)</Link>
      </nav>

      {adminAccount && (
        <Link
          href="/qg/entrar"
          className="tap-target mt-2 rounded border border-nave-orange px-4 py-3 text-center font-mono text-sm uppercase tracking-wide text-nave-orange hover:bg-nave-orange/10"
        >
          Área do QG
        </Link>
      )}
    </div>
  );
}

function PainelLink({ href, label, disponivel }: { href: string; label: string; disponivel: boolean }) {
  return (
    <div
      className={`painel tap-target flex items-center justify-center p-4 text-center font-mono text-sm uppercase tracking-wide ${
        disponivel ? "text-nave-text" : "text-nave-text-secondary opacity-60"
      }`}
    >
      {label}
      {!disponivel && <span className="ml-2 selo-exemplo">em breve</span>}
    </div>
  );
}
