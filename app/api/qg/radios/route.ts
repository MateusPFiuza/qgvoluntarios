import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/guard";
import { getNow } from "@/lib/server/clock";
import { availableRadios, isOverdue } from "@/lib/rules/radios";
import { listActiveVolunteersWithDiet, listRadioCheckouts, listRadios, listTeams } from "@/lib/server/repo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdminApi(request, "radios");
  if (guard.error) return guard.error;

  const [radios, checkouts, volunteers, teams, now] = await Promise.all([
    listRadios(),
    listRadioCheckouts(),
    listActiveVolunteersWithDiet(),
    listTeams(),
    getNow(),
  ]);
  const vol = new Map(volunteers.map((v) => [v.id, v]));
  const teamName = new Map(teams.map((t) => [t.id, t.name]));
  const available = new Set(availableRadios(radios, checkouts).map((r) => r.id));

  const rows = radios.map((r) => {
    const open = checkouts.find((c) => c.radio_id === r.id && c.returned_at === null) ?? null;
    const last = checkouts.find((c) => c.radio_id === r.id && c.returned_at !== null) ?? null;
    const holder = open ? vol.get(open.volunteer_id) : undefined;
    return {
      id: r.id,
      number: r.number,
      status: r.status,
      notes: r.notes,
      available: available.has(r.id),
      open: open
        ? {
            checkoutId: open.id,
            holderName: holder?.full_name ?? "?",
            holderTeam: holder?.team_id ? teamName.get(holder.team_id) ?? null : null,
            since: open.checked_out_at,
            overdue: isOverdue(open, now),
            hasSignature: Boolean(open.signature_path),
          }
        : null,
      lastReturn: last ? { at: last.returned_at, battery: last.battery_state, condition: last.condition } : null,
    };
  });

  return NextResponse.json({ radios: rows, isAdm: guard.admin.role === "adm" }, { headers: { "Cache-Control": "no-store" } });
}
