import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { checkSameOrigin } from "@/lib/server/guard";
import { isDemoMode } from "@/lib/server/env";
import { getAdminSession } from "@/lib/server/session";
import { SIM_CLOCK_COOKIE } from "@/lib/server/clock";
import { writeAudit } from "@/lib/server/repo";

const bodySchema = z.object({ value: z.string().datetime({ offset: true }).nullable() });

/** Relógio simulado (seção 11): livre na demonstração; em produção só ADM, com auditoria. */
export async function POST(request: Request) {
  const csrf = checkSameOrigin(request);
  if (csrf) return csrf;
  const admin = await getAdminSession();
  if (!isDemoMode() && !admin) return NextResponse.json({ error: "Só ADM pode simular o relógio." }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data inválida." }, { status: 400 });

  const value = parsed.data.value ?? "real";
  cookies().set(SIM_CLOCK_COOKIE, value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 24 * 3600 });
  if (!isDemoMode() && admin) {
    await writeAudit({ actorId: admin.sub, action: "clock.simulate", entity: "app_settings", entityId: null, details: { value } });
  }
  return NextResponse.json({ ok: true });
}
