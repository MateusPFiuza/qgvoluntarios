import { requireAdminPage } from "@/lib/server/guard";
import { QgShell } from "@/components/AppShell";
import { RadioConsole } from "@/components/qg/RadioConsole";

export default async function QgRadiosPage() {
  await requireAdminPage("radios");
  return (
    <QgShell title="Rádios">
      <RadioConsole />
    </QgShell>
  );
}
