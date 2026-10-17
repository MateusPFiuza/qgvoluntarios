import { NextResponse } from "next/server";
import { z } from "zod";
import { shouldShowResults, normalizeForSearch } from "@/lib/rules/name-search";
import { searchVolunteersByNormalizedName, listTeams } from "@/lib/server/repo";
import { getClientIp, isRateLimited } from "@/lib/server/rate-limit";

const querySchema = z.object({ q: z.string().max(100).default("") });

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(`search:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Muitas buscas. Tente novamente em um minuto." }, { status: 429 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Consulta inválida" }, { status: 400 });
  }

  const { q } = parsed.data;

  // Regra: só mostra resultados com 3+ letras (seção 5.2).
  if (!shouldShowResults(q)) {
    return NextResponse.json({ results: [] });
  }

  const [volunteers, teams] = await Promise.all([
    searchVolunteersByNormalizedName(normalizeForSearch(q)),
    listTeams(),
  ]);
  const teamById = new Map(teams.map((t) => [t.id, t.name]));

  return NextResponse.json({
    results: volunteers.map((v) => ({
      id: v.id,
      fullName: v.full_name,
      teamName: v.team_id ? teamById.get(v.team_id) ?? null : null,
      isLeader: v.is_leader,
      isMock: v.is_mock,
    })),
  });
}
