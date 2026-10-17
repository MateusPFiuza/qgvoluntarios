import { NextResponse } from "next/server";
import { z } from "zod";
import { requireVolunteerApi } from "@/lib/server/guard";
import { getClientIp, isRateLimited } from "@/lib/server/rate-limit";
import { validatePraise, TRAITS } from "@/lib/rules/praise";
import { addPraise, getOpenPraiseWindow, getVolunteerById, removePraise } from "@/lib/server/repo";

const bodySchema = z.object({ receiverId: z.string().uuid(), trait: z.enum(TRAITS), on: z.boolean() });

const ERRORS = {
  janela_fechada: "A janela de elogios está fechada.",
  auto_elogio: "Não dá para elogiar a si mesmo.",
  caracteristica: "Característica inválida.",
};

export async function POST(request: Request) {
  const guard = await requireVolunteerApi(request);
  if (guard.error) return guard.error;
  if (isRateLimited(`praise:${guard.session.sub}:${getClientIp(request)}`, 120, 60_000)) {
    return NextResponse.json({ error: "Muitos toques seguidos. Espere um pouco." }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const { receiverId, trait, on } = parsed.data;

  const window = await getOpenPraiseWindow();
  const err = validatePraise({ window, senderId: guard.session.sub, receiverId, trait });
  if (err) return NextResponse.json({ error: ERRORS[err] }, { status: err === "janela_fechada" ? 409 : 422 });

  const receiver = await getVolunteerById(receiverId);
  if (!receiver?.active) return NextResponse.json({ error: "Voluntário não encontrado." }, { status: 404 });

  const p = { windowId: window!.id, senderId: guard.session.sub, receiverId, trait };
  try {
    if (on) await addPraise(p);
    else await removePraise(p);
  } catch {
    // Ex.: a janela fechou entre a checagem e a gravação (gatilho do banco).
    return NextResponse.json({ error: "Não foi possível gravar. A janela pode ter fechado." }, { status: 409 });
  }
  // Resposta mínima: nunca devolve remetente nem contagens.
  return NextResponse.json({ ok: true, on });
}
