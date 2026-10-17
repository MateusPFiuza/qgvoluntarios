import { requireAdminPage } from "@/lib/server/guard";
import { QgShell } from "@/components/AppShell";
import { MealDashboard } from "@/components/qg/MealDashboard";

export default async function QgRefeicoesPainelPage() {
  await requireAdminPage("adm");
  return (
    <QgShell title="Painel de refeições" back="/qg/refeicoes">
      <MealDashboard />
    </QgShell>
  );
}
