import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/server/guard";
import { getRecordTime } from "@/lib/server/clock";
import { closePraiseWindow, openPraiseWindow, writeAudit } from "@/lib/server/repo";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("open"), name: z.string().trim().min(2).max(60) }),
  z.object({ action: z.literal("close"), windowId: z.string().uuid() }),
]);

/** Janelas abertas e fechadas só manualmente pelo ADM (seção 8). Abrir uma fecha a anterior. */
export async function POST(request: Request) {
  const guard = await requireAdminApi(request, "adm");
  if (guard.error) return guard.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Informe um nome para a janela." }, { status: 400 });
  const at = await getRecordTime();

  if (parsed.data.action === "open") {
    const w = await openPraiseWindow(parsed.data.name, guard.admin.sub, at);
    await writeAudit({ actorId: guard.admin.sub, action: "praise_window.open", entity: "praise_windows", entityId: w.id, details: { name: w.name } });
    return NextResponse.json({ ok: true });
  }
  const ok = await closePraiseWindow(parsed.data.windowId, at);
  if (!ok) return NextResponse.json({ error: "Janela não está aberta." }, { status: 409 });
  await writeAudit({ actorId: guard.admin.sub, action: "praise_window.close", entity: "praise_windows", entityId: parsed.data.windowId });
  return NextResponse.json({ ok: true });
}
