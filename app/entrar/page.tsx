import { redirect } from "next/navigation";
import { getVolunteerSession } from "@/lib/server/session";
import { VolunteerLoginForm } from "@/components/VolunteerLoginForm";
import { LogoGeracaoAtomika } from "@/components/brand/Logo";
import { StripeDivider } from "@/components/brand/StripeDivider";

export const dynamic = "force-dynamic";

export default async function EntrarPage() {
  const session = await getVolunteerSession();
  if (session) redirect("/");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 px-5 py-10">
      <header className="flex flex-col items-center text-center">
        <LogoGeracaoAtomika priority className="h-auto w-56" />
        <StripeDivider className="mt-6 w-48" />
        <h1 className="mt-5 font-display text-3xl text-nave-text">Voluntários</h1>
        <p className="mt-2 text-nave-text-secondary">Entre para ver sua escala, refeições e o QR pessoal.</p>
      </header>

      <div className="painel p-5">
        <VolunteerLoginForm />
      </div>

    </div>
  );
}
