import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/server/guard";
import { getRecordTime } from "@/lib/server/clock";
import { TRAITS } from "@/lib/rules/praise";
import { awardPin, updatePinAward, writeAudit } from "@/lib/server/repo";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("award"), volunteerId: z.string().uuid(), trait: z.enum(TRAITS) }),
  z.object({ action: z.enum(["deliver", "undeliver", "remove"]), awardId: z.string().uuid() }),
]);

export async function POST(request: Request) {
  const guard = await requireAdminApi(request, "adm");
  if (guard.error) return guard.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const at = await getRecordTime();

  if (parsed.data.action === "award") {
    const r = await awardPin({ volunteerId: parsed.data.volunteerId, trait: parsed.data.trait, adminId: guard.admin.sub, at });
    if (!r.ok) return NextResponse.json({ error: "Este voluntário já recebeu este pin." }, { status: 409 });
    await writeAudit({ actorId: guard.admin.sub, action: "pin.award", entity: "pin_awards", entityId: null, details: { trait: parsed.data.trait, volunteer_id: parsed.data.volunteerId } });
    return NextResponse.json({ ok: true });
  }
  const ok = await updatePinAward(parsed.data.awardId, parsed.data.action, at);
  if (!ok) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
  await writeAudit({ actorId: guard.admin.sub, action: `pin.${parsed.data.action}`, entity: "pin_awards", entityId: parsed.data.awardId });
  return NextResponse.json({ ok: true });
}
