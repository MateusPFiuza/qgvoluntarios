import Link from "next/link";
import { requireVolunteerPage } from "@/lib/server/guard";
import { getAdminAccountByVolunteerId } from "@/lib/server/repo";
import { AppShell } from "@/components/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { SimpleModeToggle } from "@/components/SimpleModeToggle";

export default async function MaisPage() {
  const session = await requireVolunteerPage();
  const admin = await getAdminAccountByVolunteerId(session.sub);
  const links = [
    { href: "/minha-identificacao", label: "Minha identificação", hint: "QR pessoal para refeições e rádios" },
    { href: "/buscar", label: "Buscar voluntário", hint: "Equipe e local previsto" },
    { href: "/elogios", label: "Elogios", hint: "Reconheça quem serve com você" },
    { href: "/privacidade", label: "Privacidade", hint: "Como seus dados são usados" },
    ...(admin ? [{ href: "/qg", label: "Área do QG", hint: "Exige sua senha de ADM" }] : []),
  ];
  return (
    <AppShell title="Mais" active="mais" right={<LogoutButton />}>
      <nav className="flex flex-col gap-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="painel tap-target flex flex-col px-4 py-3 hover:border-nave-gold">
            <span className="text-base">{l.label}</span>
            <span className="text-sm text-nave-text-secondary">{l.hint}</span>
          </Link>
        ))}
      </nav>
      <div className="border-t border-nave-bezel pt-3">
        <SimpleModeToggle />
      </div>
    </AppShell>
  );
}
