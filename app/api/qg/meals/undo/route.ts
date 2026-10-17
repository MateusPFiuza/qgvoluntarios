import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/server/guard";
import { deleteCheckin, writeAudit } from "@/lib/server/repo";

const bodySchema = z.object({ checkinId: z.string().uuid() });

export async function POST(request: Request) {
  const guard = await requireAdminApi(request, "adm");
  if (guard.error) return guard.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const removed = await deleteCheckin(parsed.data.checkinId);
  if (!removed) return NextResponse.json({ error: "Registro não encontrado (talvez já desfeito)." }, { status: 404 });

  await writeAudit({
    actorId: guard.admin.sub,
    action: "meal_checkin.undo",
    entity: "meal_checkins",
    entityId: removed.id,
    details: { meal_id: removed.meal_id, original_checked_by: removed.checked_by, original_at: removed.created_at },
  });
  return NextResponse.json({ ok: true });
}
