import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { requireAdminApi } from "@/lib/server/guard";
import { getMaskedDocuments, getVolunteerById, listRadioCheckouts, listRadios, listTeams } from "@/lib/server/repo";

export const dynamic = "force-dynamic";

/** Dados mascarados para o voluntário conferir na retirada (seção 9, passo 3). */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdminApi(request, "radios");
  if (guard.error) return guard.error;
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: "Id inválido." }, { status: 400 });

  const [v, docs, teams, open, radios] = await Promise.all([
    getVolunteerById(params.id),
    getMaskedDocuments(params.id),
    listTeams(),
    listRadioCheckouts({ openOnly: true }),
    listRadios(),
  ]);
  if (!v) return NextResponse.json({ error: "Voluntário não encontrado." }, { status: 404 });
  const numberById = new Map(radios.map((r) => [r.id, r.number]));

  return NextResponse.json(
    {
      id: v.id,
      fullName: v.full_name,
      teamName: teams.find((t) => t.id === v.team_id)?.name ?? null,
      cpfMasked: docs?.cpf ?? "não cadastrado",
      rgMasked: docs?.rg ?? "não cadastrado",
      openRadios: open.filter((c) => c.volunteer_id === v.id).map((c) => numberById.get(c.radio_id)),
      requireTypedDocs: config.radioRequireTypedDocs(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
