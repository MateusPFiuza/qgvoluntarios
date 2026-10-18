"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TRAIT_INFO, TRAITS, type Trait } from "@/lib/rules/praise";
import { VolunteerPicker, type PickedVolunteer } from "@/components/VolunteerPicker";

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Não foi possível concluir.");
}

function useAction() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
      setError(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão.");
    }
  };
  return { error, run };
}

export function WindowControl({ open }: { open: { id: string; name: string } | null }) {
  const [name, setName] = useState("");
  const { error, run } = useAction();
  return (
    <div className="flex flex-col gap-3">
      {open ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-nave-success">Aberta: {open.name}</p>
          <button
            onClick={() => window.confirm(`Fechar a janela "${open.name}"?`) && run(() => post("/api/qg/praise/window", { action: "close", windowId: open.id }))}
            className="tap-target rounded border border-nave-danger px-3 font-mono text-xs uppercase text-nave-danger"
          >
            Fechar janela
          </button>
        </div>
      ) : (
        <p className="text-nave-text-secondary">Nenhuma janela aberta. Voluntários veem &quot;janela fechada&quot;.</p>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => post("/api/qg/praise/window", { action: "open", name })).then(() => setName(""));
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da nova janela" aria-label="Nome da nova janela" className="tap-target min-w-0 flex-1 rounded border border-nave-gold-dim bg-nave-bg px-3 text-nave-text" />
        <button className="tap-target rounded bg-nave-gold px-3 font-mono text-xs uppercase text-nave-bg">Abrir</button>
      </form>
      {open && <p className="text-xs text-nave-text-secondary">Abrir uma nova janela fecha a atual.</p>}
      {error && <p role="alert" className="text-nave-danger">{error}</p>}
    </div>
  );
}

export function AwardPinForm() {
  const [who, setWho] = useState<PickedVolunteer | null>(null);
  const [trait, setTrait] = useState<Trait>("feliz");
  const { error, run } = useAction();
  return (
    <div className="flex flex-col gap-2">
      {who ? (
        <p>
          Voluntário: <strong>{who.fullName}</strong>{" "}
          <button onClick={() => setWho(null)} className="ml-2 text-xs underline">
            trocar
          </button>
        </p>
      ) : (
        <VolunteerPicker label="Conceder pin para" onPick={setWho} />
      )}
      <select value={trait} onChange={(e) => setTrait(e.target.value as Trait)} aria-label="Pin" className="tap-target rounded border border-nave-gold-dim bg-nave-bg px-3 text-nave-text">
        {TRAITS.map((t) => (
          <option key={t} value={t}>
            {TRAIT_INFO[t].label} · {TRAIT_INFO[t].pin}
          </option>
        ))}
      </select>
      <button disabled={!who} onClick={() => who && run(() => post("/api/qg/pins", { action: "award", volunteerId: who.id, trait })).then(() => setWho(null))} className="tap-target rounded bg-nave-gold font-mono text-sm uppercase text-nave-bg disabled:opacity-40">
        Conceder pin
      </button>
      {error && <p role="alert" className="text-nave-danger">{error}</p>}
    </div>
  );
}

export function PinAwardActions({ id, delivered }: { id: string; delivered: boolean }) {
  const { error, run } = useAction();
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex gap-1">
        <button onClick={() => run(() => post("/api/qg/pins", { action: delivered ? "undeliver" : "deliver", awardId: id }))} className="tap-target rounded border border-nave-gold px-2 text-xs uppercase">
          {delivered ? "Desfazer entrega" : "Marcar entregue"}
        </button>
        {!delivered && (
          <button onClick={() => window.confirm("Remover esta concessão?") && run(() => post("/api/qg/pins", { action: "remove", awardId: id }))} className="tap-target rounded border border-nave-danger px-2 text-xs uppercase text-nave-danger">
            Remover
          </button>
        )}
      </div>
      {error && <p className="text-xs text-nave-danger">{error}</p>}
    </div>
  );
}
