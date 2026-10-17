import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSessionSecret } from "./env";

const VOLUNTEER_COOKIE = "qg26_session";
const ADMIN_COOKIE = "qg26_admin_session";

const VOLUNTEER_SESSION_DAYS = 3;
const ADMIN_SESSION_MINUTES = 30;

function secretKey() {
  return new TextEncoder().encode(getSessionSecret());
}

export type VolunteerSessionPayload = {
  sub: string; // volunteer id
  name: string;
  isLeader: boolean;
};

export type AdminSessionPayload = {
  sub: string; // volunteer id (ADM é sempre também voluntário)
  name: string;
  canManageRadios: boolean;
  role: "adm" | "radios";
};

// --- Sessão do voluntário (cookie httpOnly, 3 dias com renovação) -------

export async function createVolunteerSession(payload: VolunteerSessionPayload) {
  const token = await new SignJWT({ ...payload, kind: "volunteer" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${VOLUNTEER_SESSION_DAYS}d`)
    .sign(secretKey());

  cookies().set(VOLUNTEER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: VOLUNTEER_SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getVolunteerSession(): Promise<VolunteerSessionPayload | null> {
  const token = cookies().get(VOLUNTEER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.kind !== "volunteer") return null;
    return {
      sub: String(payload.sub),
      name: String(payload.name),
      isLeader: Boolean(payload.isLeader),
    };
  } catch {
    return null;
  }
}

export function clearVolunteerSession() {
  cookies().delete(VOLUNTEER_COOKIE);
}

// --- Sessão do ADM (Área do QG): 30 minutos sem uso ----------------------

export async function createAdminSession(payload: AdminSessionPayload) {
  const token = await new SignJWT({ ...payload, kind: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MINUTES}m`)
    .sign(secretKey());

  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MINUTES * 60,
  });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.kind !== "admin") return null;
    return {
      sub: String(payload.sub),
      name: String(payload.name),
      canManageRadios: Boolean(payload.canManageRadios),
      role: payload.role === "radios" ? "radios" : "adm",
    };
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}

/** Renova a sessão de ADM a cada uso: expira só após 30 min sem uso. */
export async function touchAdminSession(payload: AdminSessionPayload) {
  await createAdminSession(payload);
}
