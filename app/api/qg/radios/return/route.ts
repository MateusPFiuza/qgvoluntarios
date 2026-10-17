import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/server/guard";
import { getRecordTime } from "@/lib/server/clock";
import { BATTERY_STATES, CONDITIONS, statusAfterReturn } from "@/lib/rules/radios";
import { listRadios, returnRadioCheckout, setRadioStatus, writeAudit } from "@/lib/server/repo";

const bodySchema = z.object({
  checkoutId: z.string().uuid(),
  battery: z.enum(BATTERY_STATES),
  condition: z.enum(CONDITIONS),
  returnedByVolunteerId: z.string().uuid().nullable(),
});

export async function POST(request: Request) {
  const guard = await requireAdminApi(request, "radios");
  if (guard.error) return guard.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Informe bateria e estado." }, { status: 400 });

  const row = await returnRadioCheckout({ ...parsed.data, operatorId: guard.admin.sub, at: await getRecordTime() });
  if (!row) return NextResponse.json({ error: "Retirada não encontrada ou já devolvida." }, { status: 404 });

  const radio = (await listRadios()).find((r) => r.id === row.radio_id);
  if (radio) {
    const next = statusAfterReturn(radio.status, parsed.data.condition);
    if (next !== radio.status) await setRadioStatus(radio.id, next);
  }
  await writeAudit({
    actorId: guard.admin.sub,
    action: "radio.return",
    entity: "radio_checkouts",
    entityId: row.id,
    details: { radio_number: radio?.number, battery: parsed.data.battery, condition: parsed.data.condition },
  });
  return NextResponse.json({ ok: true });
}
