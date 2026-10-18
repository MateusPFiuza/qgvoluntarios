import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildCredentialPlaintext,
  normalizeBirthDDMM,
  normalizeCpfLast4,
  verifyCredential,
} from "@/lib/rules/credential";
import { evaluateLockout } from "@/lib/rules/lockout";
import {
  getRecentAttempts,
  getVolunteerById,
  recordLoginAttempt,
  setVolunteerLock,
} from "@/lib/server/repo";
import { createVolunteerSession } from "@/lib/server/session";
import { getClientIp, isRateLimited } from "@/lib/server/rate-limit";
import { hashIp } from "@/lib/server/crypto";

const bodySchema = z.object({
  volunteerId: z.string().uuid(),
  cpfLast4: z.string().min(4).max(14), // aceita formatado ou só os dígitos finais
  birthDDMM: z.string().min(4).max(10),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(`login:ip:${ip}`, 20, 15 * 60_000)) {
    return NextResponse.json(
      { error: "Muitas tentativas deste endereço. Procure o QG dos Voluntários." },
      { status: 429 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { volunteerId, cpfLast4: rawCpf, birthDDMM: rawBirth } = parsed.data;
  const ipHash = hashIp(ip);

  const volunteer = await getVolunteerById(volunteerId);
  if (!volunteer || !volunteer.active || !volunteer.pin_hash) {
    // Não revela se o voluntário existe ou não.
    await recordLoginAttempt({ volunteerId: null, kind: "volunteer", ipHash, ok: false });
    return NextResponse.json({ error: "Dados não encontrados. Confira e tente novamente." }, { status: 401 });
  }

  // Bloqueio por voluntário (5 tentativas erradas em 15 minutos, seção 5.2).
  const attempts = await getRecentAttempts({ volunteerId, kind: "volunteer", sinceMinutes: 15 });
  const lockout = evaluateLockout(attempts);
  if (lockout.locked) {
    return NextResponse.json(
      {
        error: "Muitas tentativas erradas. Acesso bloqueado temporariamente, procure o QG dos Voluntários.",
        lockedUntil: lockout.until.toISOString(),
      },
      { status: 423 },
    );
  }

  let ok = false;
  try {
    const cpfLast4 = normalizeCpfLast4(rawCpf);
    const birthDDMM = normalizeBirthDDMM(rawBirth);
    const plaintext = buildCredentialPlaintext(cpfLast4, birthDDMM);
    ok = await verifyCredential(plaintext, volunteer.pin_hash);
  } catch {
    ok = false;
  }

  await recordLoginAttempt({ volunteerId, kind: "volunteer", ipHash, ok });

  if (!ok) {
    const updatedAttempts = await getRecentAttempts({ volunteerId, kind: "volunteer", sinceMinutes: 15 });
    const updatedLockout = evaluateLockout(updatedAttempts);
    if (updatedLockout.locked) {
      await setVolunteerLock(volunteerId, updatedLockout.until);
      return NextResponse.json(
        {
          error: "Muitas tentativas erradas. Acesso bloqueado temporariamente, procure o QG dos Voluntários.",
          lockedUntil: updatedLockout.until.toISOString(),
        },
        { status: 423 },
      );
    }
    return NextResponse.json({ error: "Dados não encontrados. Confira e tente novamente." }, { status: 401 });
  }

  await createVolunteerSession({
    sub: volunteer.id,
    name: volunteer.full_name,
    isLeader: volunteer.is_leader,
  });

  return NextResponse.json({ ok: true });
}
