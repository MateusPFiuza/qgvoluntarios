import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword } from "@/lib/rules/credential";
import { evaluateLockout } from "@/lib/rules/lockout";
import { getAdminAccountByVolunteerId, getRecentAttempts, recordLoginAttempt } from "@/lib/server/repo";
import { getVolunteerSession, createAdminSession } from "@/lib/server/session";
import { getClientIp, isRateLimited } from "@/lib/server/rate-limit";
import { hashIp } from "@/lib/server/crypto";

const bodySchema = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(`admin-login:ip:${ip}`, 20, 15 * 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const session = await getVolunteerSession();
  if (!session) {
    return NextResponse.json({ error: "É preciso entrar como voluntário primeiro." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe a senha." }, { status: 400 });
  }

  const account = await getAdminAccountByVolunteerId(session.sub);
  if (!account) {
    return NextResponse.json({ error: "Este voluntário não tem acesso à Área do QG." }, { status: 403 });
  }

  const attempts = await getRecentAttempts({ volunteerId: session.sub, kind: "admin", sinceMinutes: 15 });
  const lockout = evaluateLockout(attempts);
  if (lockout.locked) {
    return NextResponse.json(
      { error: "Muitas tentativas erradas. Peça a outro ADM para redefinir sua senha." },
      { status: 423 },
    );
  }

  const ok = await verifyPassword(parsed.data.password, account.password_hash);
  await recordLoginAttempt({ volunteerId: session.sub, kind: "admin", ipHash: hashIp(ip), ok });

  if (!ok) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  await createAdminSession({
    sub: session.sub,
    name: session.name,
    canManageRadios: account.can_manage_radios || account.role === "radios",
    role: account.role === "radios" ? "radios" : "adm",
  });

  return NextResponse.json({ ok: true });
}
