import { NextResponse } from "next/server";
import { requireVolunteerApi } from "@/lib/server/guard";
import { listTeams, listVolunteerDirectory } from "@/lib/server/repo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireVolunteerApi(request);
  if (auth.error) return auth.error;
  const [volunteers, teams] = await Promise.all([listVolunteerDirectory(), listTeams()]);
  const teamById = new Map(teams.map((t) => [t.id, t.name]));
  return NextResponse.json({
    results: volunteers.map((v) => ({
      id: v.id,
      fullName: v.full_name,
      searchName: v.search_name,
      teamName: v.team_id ? teamById.get(v.team_id) ?? null : null,
      teamId: v.team_id,
      isLeader: v.is_leader,
    })),
  });
}
