import { NextResponse } from "next/server";
import { z } from "zod";
import { config } from "@/lib/config";
import { requireAdminApi } from "@/lib/server/guard";
import { getNow, getRecordTime } from "@/lib/server/clock";
import { getQrSecret } from "@/lib/server/env";
import { verifyQrToken } from "@/lib/rules/qr-token";
import { decideCheckin } from "@/lib/rules/meals";
import { getCheckin, getMeal, getTeamMealWindow, getVolunteerById, insertCheckin, listTeams } from "@/lib/server/repo";

const bodySchema = z.union([
  z.object({ mealId: z.string().uuid(), token: z.string().min(10).max(200) }),
  z.object({ mealId: z.string().uuid(), volunteerId: z.string().uuid() }),
]);

const QR_ERRORS: Record<string, string> = {
  expirado: "QR expirado. Peça para o voluntário abrir a tela de novo (o código muda a cada 30 s).",
  assinatura: "QR inválido.",
  formato: "Este QR não é da plataforma G'26.",
};

export async function POST(request: Request) {
  const guard = await requireAdminApi(request, "adm");
  if (guard.error) return guard.error;
  if (!config.mealsEnabled()) return NextResponse.json({ error: "Módulo de refeições desligado." }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  let volunteerId: string;
  let method: "qr" | "search";
  if ("token" in parsed.data) {
    const v = verifyQrToken(parsed.data.token, getQrSecret(), Date.now());
    if (!v.ok) return NextResponse.json({ status: "invalido", error: QR_ERRORS[v.reason] }, { status: 422 });
    volunteerId = v.volunteerId;
    method = "qr";
  } else {
    volunteerId = parsed.data.volunteerId;
    method = "search";
  }

  const [meal, volunteer, teams] = await Promise.all([getMeal(parsed.data.mealId), getVolunteerById(volunteerId), listTeams()]);
  if (!meal) return NextResponse.json({ error: "Refeição não encontrada." }, { status: 404 });
  if (!volunteer || !volunteer.active) return NextResponse.json({ status: "invalido", error: "Voluntário não encontrado ou inativo." }, { status: 404 });

  const now = await getNow();
  const teamWindow = await getTeamMealWindow(volunteer.team_id, meal.id);
  const who = {
    id: volunteer.id,
    fullName: volunteer.full_name,
    teamName: teams.find((t) => t.id === volunteer.team_id)?.name ?? null,
    dietNotes: volunteer.diet_notes,
    isLeader: volunteer.is_leader,
  };

  const alreadyBy = async (checkedBy: string | null) => (checkedBy ? (await getVolunteerById(checkedBy))?.full_name ?? null : null);

  const existing = await getCheckin(volunteer.id, meal.id);
  if (existing) {
    const decision = decideCheckin({ existing, existingByName: await alreadyBy(existing.checked_by), teamWindow, now });
    return NextResponse.json({ ...decision, volunteer: who, justNow: false });
  }

  const result = await insertCheckin({ volunteerId: volunteer.id, mealId: meal.id, method, checkedBy: guard.admin.sub, createdAt: await getRecordTime() });
  if (!result.ok) {
    // Corrida entre dois ADMs: a restrição única do banco garantiu um só registro.
    const decision = decideCheckin({ existing: result.existing, existingByName: await alreadyBy(result.existing.checked_by), teamWindow, now });
    return NextResponse.json({ ...decision, volunteer: who, justNow: true });
  }

  const decision = decideCheckin({ existing: null, existingByName: null, teamWindow, now });
  return NextResponse.json({ ...decision, volunteer: who, checkinId: result.row.id });
}
