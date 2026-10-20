"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { VolunteerPicker, type PickedVolunteer } from "@/components/VolunteerPicker";
import { SignatureField, type SignatureFieldHandle } from "./SignatureField";

type RadioRow = {
  id: string;
  number: number;
  status: "ok" | "defeito" | "perdido";
  notes: string | null;
  available: boolean;
  open: { checkoutId: string; holderName: string; holderTeam: string | null; since: string; overdue: boolean; hasSignature: boolean } | null;
  lastReturn: { at: string; battery: string | null; condition: string | null } | null;
};

type VolunteerDocs = {
  id: string;
  fullName: string;
  teamName: string | null;
  cpfMasked: string;
  rgMasked: string;
  openRadios: number[];
  requireTypedDocs: boolean;
};

const hm = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Não foi possível concluir. Nada foi gravado.");
  return data;
}

export function RadioConsole() {
  const [tab, setTab] = useState<"retirar" | "devolver" | "painel">("retirar");
  const [radios, setRadios] = useState<RadioRow[]>([]);
  const [isAdm, setIsAdm] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/qg/radios", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRadios(data.radios);
      setIsAdm(data.isAdm);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error && e.message ? e.message : "Falha de conexão.");
    }
  }, []);

  useEffect(() => {
    reload();
    const t = setInterval(() => !document.hidden && reload(), 10_000);
    return () => clearInterval(t);
  }, [reload]);

  return (
    <div className="flex flex-col gap-4 text-base lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      {/* No notebook (1024 px ou mais): lista de rádios à esquerda, formulário à direita. */}
      <section className="hidden lg:block" aria-label="Rádios agora">
        <RadioPanel radios={radios} isAdm={isAdm} onChange={reload} />
      </section>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-2" role="tablist">
          {(["retirar", "devolver", "painel"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`tap-target rounded border font-mono text-sm uppercase ${t === "painel" ? "lg:hidden" : ""} ${
                tab === t ? "border-nave-gold bg-nave-gold text-nave-bg" : "border-nave-gold-dim text-nave-text-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {loadError && (
          <p role="alert" className="text-nave-danger">
            {loadError}
          </p>
        )}
        {tab === "retirar" && <CheckoutFlow radios={radios} onDone={reload} />}
        {tab === "devolver" && <ReturnFlow radios={radios} onDone={reload} />}
        {tab === "painel" && (
          <div className="lg:hidden">
            <RadioPanel radios={radios} isAdm={isAdm} onChange={reload} />
          </div>
        )}
      </div>
    </div>
  );
}

function CheckoutFlow({ radios, onDone }: { radios: RadioRow[]; onDone: () => void }) {
  const [vol, setVol] = useState<VolunteerDocs | null>(null);
  const [radioId, setRadioId] = useState("");
  const [typedCpf, setTypedCpf] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const sigRef = useRef<SignatureFieldHandle>(null);
  const available = radios.filter((r) => r.available);

  const pick = async (p: PickedVolunteer) => {
    setMsg(null);
    try {
      const res = await fetch(`/api/qg/radios/volunteer/${p.id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVol(data);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error && e.message ? e.message : "Falha de conexão." });
    }
  };

  const confirm = async () => {
    if (!vol || !radioId) return setMsg({ ok: false, text: "Escolha o voluntário e o rádio." });
    if (sigRef.current?.isEmpty()) return setMsg({ ok: false, text: "A assinatura é obrigatória." });
    if (vol.openRadios.length > 0 && !window.confirm(`${vol.fullName} já está com o rádio ${vol.openRadios.join(", ")}. Registrar outro mesmo assim?`)) return;
    setBusy(true);
    try {
      const data = await postJson("/api/qg/radios/checkout", {
        radioId,
        volunteerId: vol.id,
        signature: sigRef.current!.toDataURL(),
        ...(vol.requireTypedDocs ? { typedCpfLast4: typedCpf } : {}),
      });
      setMsg({ ok: true, text: `Rádio ${data.radioNumber} retirado por ${vol.fullName}.` });
      setVol(null);
      setRadioId("");
      setTypedCpf("");
      sigRef.current?.clear();
      onDone();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Erro." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {msg && (
        <p role="status" className={`rounded border-2 p-3 text-lg ${msg.ok ? "border-nave-success text-nave-success" : "border-nave-danger text-nave-danger"}`}>
          
          {msg.text}
        </p>
      )}
      {!vol ? (
        <VolunteerPicker label="1. Quem vai retirar" onPick={pick} />
      ) : (
        <div className="painel flex flex-col gap-1 p-4">
          <p className="label-mono">1. Confira com o voluntário</p>
          <p className="text-xl">{vol.fullName}</p>
          <p className="text-nave-text-secondary">{vol.teamName ?? "Sem equipe"}</p>
          <p className="font-mono">CPF {vol.cpfMasked}</p>
          <p className="font-mono">RG {vol.rgMasked}</p>
          {vol.openRadios.length > 0 && <p className="text-nave-warn">Já está com o rádio {vol.openRadios.join(", ")}</p>}
          {vol.requireTypedDocs && (
            <label className="mt-2 flex flex-col gap-1">
              <span className="text-sm">4 últimos dígitos do CPF (digitados pelo voluntário)</span>
              <input inputMode="numeric" maxLength={4} value={typedCpf} onChange={(e) => setTypedCpf(e.target.value.replace(/\D/g, ""))} className="tap-target rounded border border-nave-gold-dim bg-nave-bg px-3 text-nave-text" />
            </label>
          )}
          <button onClick={() => setVol(null)} className="tap-target mt-2 self-start label-mono underline">
            Trocar voluntário
          </button>
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="label-mono">2. Rádio ({available.length} disponíveis)</span>
        <select value={radioId} onChange={(e) => setRadioId(e.target.value)} className="tap-target rounded border border-nave-gold bg-nave-bg px-3 text-lg text-nave-text">
          <option value="">Escolha o número</option>
          {available.map((r) => (
            <option key={r.id} value={r.id}>
              Rádio {r.number}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1">
        <span className="label-mono">3. Assinatura do voluntário</span>
        <SignatureField ref={sigRef} />
      </div>

      <button disabled={busy} onClick={confirm} className="min-h-[56px] rounded bg-nave-gold text-lg font-bold uppercase text-nave-bg disabled:opacity-50">
        {busy ? "Registrando…" : "Confirmar retirada"}
      </button>
    </div>
  );
}

function ReturnFlow({ radios, onDone }: { radios: RadioRow[]; onDone: () => void }) {
  const out = radios.filter((r) => r.open);
  const [checkoutId, setCheckoutId] = useState("");
  const [battery, setBattery] = useState<"carregado" | "parcial" | "descarregado" | "">("");
  const [condition, setCondition] = useState<"ok" | "defeito" | "">("");
  const [other, setOther] = useState<PickedVolunteer | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const selected = out.find((r) => r.open!.checkoutId === checkoutId);

  const submit = async () => {
    if (!checkoutId || !battery || !condition) return setMsg({ ok: false, text: "Escolha o rádio, a bateria e o estado." });
    try {
      await postJson("/api/qg/radios/return", { checkoutId, battery, condition, returnedByVolunteerId: other?.id ?? null });
      setMsg({ ok: true, text: `Rádio ${selected?.number} devolvido${condition === "defeito" ? " e bloqueado por defeito" : ""}.` });
      setCheckoutId("");
      setBattery("");
      setCondition("");
      setOther(null);
      onDone();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Erro." });
    }
  };

  const choice = (active: boolean) =>
    `tap-target rounded border px-2 text-sm uppercase ${active ? "border-nave-gold bg-nave-gold text-nave-bg" : "border-nave-gold-dim text-nave-text"}`;

  return (
    <div className="flex flex-col gap-4">
      {msg && (
        <p role="status" className={`rounded border-2 p-3 text-lg ${msg.ok ? "border-nave-success text-nave-success" : "border-nave-danger text-nave-danger"}`}>
          
          {msg.text}
        </p>
      )}
      <select value={checkoutId} onChange={(e) => setCheckoutId(e.target.value)} aria-label="Rádio devolvido" className="tap-target rounded border border-nave-gold bg-nave-bg px-3 text-lg text-nave-text">
        <option value="">Rádio devolvido ({out.length} fora)</option>
        {out.map((r) => (
          <option key={r.id} value={r.open!.checkoutId}>
            Rádio {r.number} · {r.open!.holderName}
            {r.open!.overdue ? " · NÃO DEVOLVIDO" : ""}
          </option>
        ))}
      </select>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 label-mono">Bateria</legend>
        <div className="grid grid-cols-3 gap-2">
          {(["carregado", "parcial", "descarregado"] as const).map((b) => (
            <button key={b} type="button" aria-pressed={battery === b} onClick={() => setBattery(b)} className={choice(battery === b)}>
              {b}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 label-mono">Estado</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["ok", "defeito"] as const).map((c) => (
            <button key={c} type="button" aria-pressed={condition === c} onClick={() => setCondition(c)} className={choice(condition === c)}>
              {c === "ok" ? "ok" : "defeito"}
            </button>
          ))}
        </div>
      </fieldset>
      {selected && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-nave-text-secondary">
            Quem devolveu: <strong className="text-nave-text">{other?.fullName ?? `${selected.open!.holderName} (quem retirou)`}</strong>
          </p>
          {!other && <VolunteerPicker label="Outra pessoa devolveu? Busque o nome" onPick={setOther} />}
        </div>
      )}
      <button onClick={submit} className="min-h-[56px] rounded bg-nave-gold text-lg font-bold uppercase text-nave-bg">
        Confirmar devolução
      </button>
    </div>
  );
}

function RadioPanel({ radios, isAdm, onChange }: { radios: RadioRow[]; isAdm: boolean; onChange: () => void }) {
  const overdue = radios.filter((r) => r.open?.overdue);
  const setStatus = async (radioId: string, status: "ok" | "perdido") => {
    if (!window.confirm(status === "ok" ? "Liberar este rádio para uso?" : "Marcar como perdido?")) return;
    try {
      await postJson("/api/qg/radios/release", { radioId, status });
      onChange();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Erro.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {overdue.length > 0 && (
        <div role="alert" className="rounded border-2 border-nave-danger p-3">
          <p className="font-bold text-nave-danger">{overdue.length} rádio(s) não devolvido(s) no fim do dia</p>
          <ul className="text-sm">
            {overdue.map((r) => (
              <li key={r.id}>
                Rádio {r.number} · {r.open!.holderName} · desde {hm(r.open!.since)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {radios.map((r) => (
          <li key={r.id} className={`painel flex items-center justify-between gap-2 p-3 ${r.open?.overdue ? "border-nave-danger" : ""}`}>
            <div className="min-w-0">
              <Link href={`/qg/radios/${r.id}`} className="font-mono text-lg text-nave-gold underline">
                Rádio {r.number}
              </Link>
              <p className="text-sm">
                {r.open ? (
                  <>
                    Com {r.open.holderName} {r.open.holderTeam ? `(${r.open.holderTeam})` : ""} · {hm(r.open.since)}
                    {r.open.overdue && <strong className="ml-1 text-nave-danger">NÃO DEVOLVIDO</strong>}
                  </>
                ) : r.status === "ok" ? (
                  <span className="text-nave-success">Disponível</span>
                ) : (
                  <span className="text-nave-danger">{r.status === "defeito" ? "Defeito" : "Perdido"}{r.notes ? ` · ${r.notes}` : ""}</span>
                )}
              </p>
              {r.lastReturn && !r.open && (
                <p className="text-xs text-nave-text-secondary">
                  Última devolução: bateria {r.lastReturn.battery}, {r.lastReturn.condition}
                </p>
              )}
            </div>
            {isAdm && !r.open && r.status !== "ok" && (
              <button onClick={() => setStatus(r.id, "ok")} className="tap-target shrink-0 rounded border border-nave-gold px-2 text-xs uppercase">
                Liberar
              </button>
            )}
            {isAdm && r.open?.overdue && (
              <button onClick={() => setStatus(r.id, "perdido")} className="tap-target shrink-0 rounded border border-nave-danger px-2 text-xs uppercase text-nave-danger">
                Perdido
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
