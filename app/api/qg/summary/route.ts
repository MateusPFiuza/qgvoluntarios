import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { requireAdminApi } from "@/lib/server/guard";
import { loadQgSummary } from "@/lib/server/qg-summary";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireAdminApi(request, "radios");
  if (guard.error) return guard.error;
  const summary = await loadQgSummary(guard.admin.role === "adm" && config.mealsEnabled());
  return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
}
