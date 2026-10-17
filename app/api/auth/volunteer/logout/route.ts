import { NextResponse } from "next/server";
import { clearVolunteerSession, clearAdminSession } from "@/lib/server/session";

export async function POST() {
  clearVolunteerSession();
  clearAdminSession();
  return NextResponse.json({ ok: true });
}
