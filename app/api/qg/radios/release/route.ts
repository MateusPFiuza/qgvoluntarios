import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/server/guard";
import { listRadios, setRadioStatus, writeAudit } from "@/lib/server/repo";

const bodySchema = z.object({ radioId: z.string().uuid(), status: z.enum(["ok", "defeito", "perdido"]) });

/** Só ADM libera rádio com defeito ou marca como perdido (seção 9). */
export async function POST(request: Request) {
  const guard = await requireAdminApi(request, "adm");
  if (guard.error) return guard.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const radio = (await listRadios()).find((r) => r.id === parsed.data.radioId);
  if (!radio) return NextResponse.json({ error: "Rádio não encontrado." }, { status: 404 });
  await setRadioStatus(radio.id, parsed.data.status);
  await writeAudit({ actorId: guard.admin.sub, action: "radio.status", entity: "radios", entityId: radio.id, details: { from: radio.status, to: parsed.data.status } });
  return NextResponse.json({ ok: true });
}
