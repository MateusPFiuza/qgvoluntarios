import { NextResponse } from "next/server";
import { requireVolunteerApi } from "@/lib/server/guard";
import { acceptPrivacy } from "@/lib/server/repo";

export async function POST(request: Request) {
  const guard = await requireVolunteerApi(request);
  if (guard.error) return guard.error;
  await acceptPrivacy(guard.session.sub, new Date());
  return NextResponse.json({ ok: true });
}
