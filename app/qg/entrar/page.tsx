import { redirect } from "next/navigation";
import { getVolunteerSession, getAdminSession } from "@/lib/server/session";
import { getAdminAccountByVolunteerId } from "@/lib/server/repo";
import { AdminLoginForm } from "@/components/AdminLoginForm";

export default async function QgEntrarPage() {
  const session = await getVolunteerSession();
  if (!session) redirect("/entrar");

  const adminSession = await getAdminSession();
  if (adminSession) redirect("/qg");

  const account = await getAdminAccountByVolunteerId(session.sub);
  if (!account) redirect("/");

  return (
    <div className="flex min-h-screen flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-lg uppercase tracking-wide text-nave-orange fx-glow-text">
        Área do QG
      </h1>
      <div className="painel p-5">
        <p className="mb-4 font-mono text-xs uppercase tracking-wide text-nave-text-secondary">
          Segunda barreira · sessão expira em 30 min sem uso
        </p>
        <AdminLoginForm />
      </div>
    </div>
  );
}
