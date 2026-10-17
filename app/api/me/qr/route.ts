import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getVolunteerSession } from "@/lib/server/session";
import { getQrSecret } from "@/lib/server/env";
import { generateQrToken, msUntilNextWindow } from "@/lib/rules/qr-token";

export const dynamic = "force-dynamic";

// O QR sempre usa o relógio real (nunca o simulado), senão a validação no QG falharia.
export async function GET() {
  const session = await getVolunteerSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 });
  const now = Date.now();
  const token = generateQrToken(session.sub, getQrSecret(), now);
  const svg = await QRCode.toString(token, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });
  return NextResponse.json(
    { svg, refreshInMs: msUntilNextWindow(now) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
