import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getAdminSession, getVolunteerSession, touchAdminSession, type AdminSessionPayload, type VolunteerSessionPayload } from "./session";

type Need = "adm" | "radios";

function allowed(admin: AdminSessionPayload, need: Need): boolean {
  if (need === "adm") return admin.role === "adm";
  return admin.role === "adm" || admin.canManageRadios;
}

/**
 * Proteção contra CSRF nas rotas que alteram dados: exige corpo JSON
 * (formulário de outro site não consegue enviar sem preflight) e, se
 * houver cabeçalho Origin, que seja do próprio host.
 */
export function checkSameOrigin(request: Request): NextResponse | null {
  if (request.method === "GET" || request.method === "HEAD") return null;
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return NextResponse.json({ error: "Envie JSON." }, { status: 415 });
  }
  return null;
}

export async function requireAdminApi(
  request: Request,
  need: Need,
): Promise<{ admin: AdminSessionPayload; error?: undefined } | { error: NextResponse; admin?: undefined }> {
  const csrf = checkSameOrigin(request);
  if (csrf) return { error: csrf };
  const admin = await getAdminSession();
  if (!admin) return { error: NextResponse.json({ error: "Sessão do QG expirada. Entre de novo." }, { status: 401 }) };
  if (!allowed(admin, need)) return { error: NextResponse.json({ error: "Sem permissão para esta ação." }, { status: 403 }) };
  await touchAdminSession(admin);
  return { admin };
}

export async function requireVolunteerApi(
  request: Request,
): Promise<{ session: VolunteerSessionPayload; error?: undefined } | { error: NextResponse; session?: undefined }> {
  const csrf = checkSameOrigin(request);
  if (csrf) return { error: csrf };
  const session = await getVolunteerSession();
  if (!session) return { error: NextResponse.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 }) };
  return { session };
}

export async function requireAdminPage(need: Need): Promise<AdminSessionPayload> {
  const admin = await getAdminSession();
  if (!admin) redirect("/qg/entrar");
  if (!allowed(admin, need)) redirect("/qg");
  return admin;
}

export async function requireVolunteerPage(): Promise<VolunteerSessionPayload> {
  const session = await getVolunteerSession();
  if (!session) redirect("/entrar");
  return session;
}
