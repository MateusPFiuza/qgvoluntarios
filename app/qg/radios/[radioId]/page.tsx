import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/server/guard";
import { listActiveVolunteersWithDiet, listRadioCheckouts, listRadios } from "@/lib/server/repo";
import { QgShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

const fmt = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "-";

export default async function RadioHistoryPage({ params }: { params: { radioId: string } }) {
  await requireAdminPage("radios");
  const [radios, history, volunteers] = await Promise.all([listRadios(), listRadioCheckouts({ radioId: params.radioId }), listActiveVolunteersWithDiet()]);
  const radio = radios.find((r) => r.id === params.radioId);
  if (!radio) notFound();
  const name = (id: string | null) => (id ? volunteers.find((v) => v.id === id)?.full_name ?? "?" : "-");

  return (
    <QgShell title={`Rádio ${radio.number}`} back="/qg/radios">
      <p className="painel p-3">
        Situação: <strong>{radio.status}</strong>
        {radio.notes ? ` · ${radio.notes}` : ""}
        {radio.is_mock && <span className="selo-exemplo ml-2">exemplo</span>}
      </p>
      {history.length === 0 && <p className="text-nave-text-secondary">Nenhuma retirada registrada.</p>}
      <ul className="flex flex-col gap-2">
        {history.map((h) => (
          <li key={h.id} className="painel flex flex-col gap-1 p-3 text-sm">
            <p className="text-base">{name(h.volunteer_id)}</p>
            <p>Retirada: {fmt(h.checked_out_at)} · registrada por {name(h.checked_out_by)}</p>
            <p>
              Devolução: {h.returned_at ? `${fmt(h.returned_at)} · bateria ${h.battery_state} · ${h.condition}` : <strong className="text-nave-danger">em aberto</strong>}
              {h.returned_by_volunteer_id && h.returned_by_volunteer_id !== h.volunteer_id ? ` · entregue por ${name(h.returned_by_volunteer_id)}` : ""}
            </p>
            {h.signature_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/qg/radios/signature/${h.id}`} alt={`Assinatura de ${name(h.volunteer_id)}`} className="mt-1 h-20 w-48 rounded bg-white object-contain" />
            ) : (
              <p className="text-xs text-nave-text-secondary">Sem assinatura{h.is_mock ? " (registro de exemplo)" : ""}</p>
            )}
          </li>
        ))}
      </ul>
    </QgShell>
  );
}
