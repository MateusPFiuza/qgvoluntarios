import { NextResponse } from "next/server";
import { z } from "zod";
import { config } from "@/lib/config";
import { requireAdminApi } from "@/lib/server/guard";
import { getRecordTime } from "@/lib/server/clock";
import { validateCheckout } from "@/lib/rules/radios";
import {
  createRadioCheckout,
  deleteRadioCheckout,
  getMaskedDocuments,
  getVolunteerById,
  listRadioCheckouts,
  listRadios,
  saveSignature,
  writeAudit,
} from "@/lib/server/repo";

const PNG_PREFIX = "data:image/png;base64,";
const bodySchema = z.object({
  radioId: z.string().uuid(),
  volunteerId: z.string().uuid(),
  signature: z.string().startsWith(PNG_PREFIX).max(400_000),
  typedCpfLast4: z.string().regex(/^\d{4}$/).optional(),
});

const REASONS = { em_uso: "Este rádio já está retirado.", defeito: "Rádio com defeito.", perdido: "Rádio marcado como perdido." };

export async function POST(request: Request) {
  const guard = await requireAdminApi(request, "radios");
  if (guard.error) return guard.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos. A assinatura é obrigatória." }, { status: 400 });
  const { radioId, volunteerId, signature, typedCpfLast4 } = parsed.data;

  const png = Buffer.from(signature.slice(PNG_PREFIX.length), "base64");
  if (png.length < 50 || png.subarray(1, 4).toString() !== "PNG") {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  const [radios, checkouts, volunteer] = await Promise.all([listRadios(), listRadioCheckouts(), getVolunteerById(volunteerId)]);
  const radio = radios.find((r) => r.id === radioId);
  if (!radio || !volunteer) return NextResponse.json({ error: "Rádio ou voluntário não encontrado." }, { status: 404 });

  if (config.radioRequireTypedDocs()) {
    const docs = await getMaskedDocuments(volunteerId);
    if (!typedCpfLast4 || !docs || docs.cpfLast4 !== typedCpfLast4) {
      return NextResponse.json({ error: "Os 4 últimos dígitos do CPF não conferem." }, { status: 422 });
    }
  }

  const decision = validateCheckout({ radio, checkouts, volunteerId, radios });
  if (!decision.ok) return NextResponse.json({ error: REASONS[decision.reason] }, { status: 409 });

  const created = await createRadioCheckout({ radioId, volunteerId, operatorId: guard.admin.sub, at: await getRecordTime() });
  if (!created.ok) return NextResponse.json({ error: REASONS.em_uso }, { status: 409 });

  try {
    await saveSignature(created.row.id, png);
  } catch {
    // Sem assinatura gravada, a retirada não vale: desfaz para não mostrar sucesso falso.
    await deleteRadioCheckout(created.row.id);
    return NextResponse.json({ error: "Falha ao gravar a assinatura. Nada foi registrado." }, { status: 502 });
  }

  await writeAudit({ actorId: guard.admin.sub, action: "radio.checkout", entity: "radio_checkouts", entityId: created.row.id, details: { radio_number: radio.number } });
  return NextResponse.json({ ok: true, radioNumber: radio.number, volunteerAlreadyHas: decision.volunteerAlreadyHas });
}
