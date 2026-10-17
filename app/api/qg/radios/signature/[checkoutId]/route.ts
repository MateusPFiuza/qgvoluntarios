import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/guard";
import { listRadioCheckouts, readSignature } from "@/lib/server/repo";

export const dynamic = "force-dynamic";

/** Assinatura só para gestor de rádios e ADM, via URL assinada de curta duração. */
export async function GET(request: Request, { params }: { params: { checkoutId: string } }) {
  const guard = await requireAdminApi(request, "radios");
  if (guard.error) return guard.error;
  const row = (await listRadioCheckouts()).find((c) => c.id === params.checkoutId);
  if (!row?.signature_path) return NextResponse.json({ error: "Sem assinatura registrada." }, { status: 404 });
  const sig = await readSignature(row.signature_path);
  if (!sig) return NextResponse.json({ error: "Assinatura indisponível." }, { status: 404 });
  if ("signedUrl" in sig) return NextResponse.redirect(sig.signedUrl);
  return new NextResponse(new Uint8Array(sig.png), { headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store" } });
}
