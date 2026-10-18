"use client";

import { useState } from "react";
import { TRAIT_INFO, TRAITS, type Trait } from "@/lib/rules/praise";
import { VolunteerPicker } from "./VolunteerPicker";
import { ExplainerModal } from "./ExplainerModal";
import { TraitIcon } from "./TraitIcon";

type Person = { id: string; name: string; team: string | null; traits: Trait[] };

export function PraiseArea({
  selfId,
  windowName,
  windowOpen,
  initial,
  videoUrl,
}: {
  selfId: string;
  windowName: string | null;
  windowOpen: boolean;
  initial: Person[];
  videoUrl: string | null;
}) {
  const [showVideo, setShowVideo] = useState(true);
  const [people, setPeople] = useState<Person[]>(initial);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (personId: string, trait: Trait) => {
    const person = people.find((p) => p.id === personId)!;
    const on = !person.traits.includes(trait);
    const apply = (state: boolean) =>
      setPeople((ps) => ps.map((p) => (p.id === personId ? { ...p, traits: state ? [...p.traits, trait] : p.traits.filter((t) => t !== trait) } : p)));
    apply(on);
    try {
      const res = await fetch("/api/praise", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: personId, trait, on }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível gravar.");
      setError(null);
    } catch (e) {
      apply(!on);
      setError(e instanceof Error ? e.message : "Falha de conexão. O elogio não foi gravado.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {showVideo && <ExplainerModal videoUrl={videoUrl} onClose={() => setShowVideo(false)} />}

      <p className="rounded-xl border border-nave-bezel p-4 text-sm">
        Elogio anônimo: <strong>ninguém da organização vê quem elogiou pelo app.</strong>
      </p>

      {!windowOpen ? (
        <p className="painel border-nave-warn p-4 text-lg">Janela fechada. O QG avisa quando abrir a próxima.</p>
      ) : (
        <>
          <p className="text-sm font-medium text-nave-success">Janela aberta: {windowName}</p>
          {error && <p role="alert" className="rounded border-2 border-nave-danger p-3 text-nave-danger">Erro: {error}</p>}
          <VolunteerPicker
            label="Quem você quer elogiar?"
            onPick={(v) => {
              if (v.id === selfId) return setError("Não dá para elogiar a si mesmo.");
              setError(null);
              setPeople((ps) => (ps.some((p) => p.id === v.id) ? ps : [{ id: v.id, name: v.fullName, team: v.teamName, traits: [] }, ...ps]));
            }}
          />
          <ul className="flex flex-col gap-3">
            {people.map((p) => (
              <li key={p.id} className="painel p-4">
                <p className="text-lg">{p.name}</p>
                <p className="mb-3 text-sm text-nave-text-secondary">{p.team ?? "Sem equipe"}</p>
                <div className="grid grid-cols-3 gap-2">
                  {TRAITS.map((t) => {
                    const on = p.traits.includes(t);
                    return (
                      <button
                        key={t}
                        aria-pressed={on}
                        onClick={() => toggle(p.id, t)}
                        className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border-2 text-sm ${
                          on ? "border-nave-gold bg-nave-gold text-nave-bg" : "border-nave-gold-dim text-nave-text-secondary"
                        }`}
                      >
                        <TraitIcon trait={t} />
                        <span>{TRAIT_INFO[t].label}</span>
                        <span className="text-xs">{on ? "Aceso" : "Apagado"}</span>
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
          {people.length === 0 && <p className="text-nave-text-secondary">Busque o nome de um colega para começar.</p>}
        </>
      )}
    </div>
  );
}
