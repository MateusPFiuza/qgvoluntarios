"use client";

import { useEffect, useMemo, useState } from "react";
import { TRAIT_INFO, TRAITS, type Trait } from "@/lib/rules/praise";
import { normalizeForSearch } from "@/lib/rules/name-search";
import { loadDirectory, type DirectoryEntry } from "./VolunteerPicker";
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
  const [sent, setSent] = useState<Record<string, Trait[]>>(() => Object.fromEntries(initial.map((p) => [p.id, p.traits])));
  const [all, setAll] = useState<DirectoryEntry[] | null>(null);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cardError, setCardError] = useState<{ id: string; msg: string } | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!windowOpen) return;
    loadDirectory()
      .then(setAll)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Falha de conexão."));
  }, [windowOpen]);

  const q = normalizeForSearch(query);
  const people = useMemo(() => {
    if (!all) return [];
    return all.filter((v) => v.id !== selfId && (!q || normalizeForSearch(v.searchName || v.fullName).includes(q)));
  }, [all, q, selfId]);

  const toggle = async (personId: string, trait: Trait) => {
    const key = `${personId}:${trait}`;
    if (pending[key]) return;
    const on = !(sent[personId] ?? []).includes(trait);
    const apply = (state: boolean) =>
      setSent((s) => {
        const list = (s[personId] ?? []).filter((t) => t !== trait);
        return { ...s, [personId]: state ? [...list, trait] : list };
      });
    apply(on);
    setPending((p) => ({ ...p, [key]: true }));
    try {
      const res = await fetch("/api/praise", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: personId, trait, on }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível gravar.");
      setCardError((e) => (e?.id === personId ? null : e));
    } catch (e) {
      apply(!on);
      setCardError({ id: personId, msg: e instanceof Error ? e.message : "Falha de conexão. O elogio não foi gravado." });
    } finally {
      setPending((p) => ({ ...p, [key]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {showVideo && <ExplainerModal videoUrl={videoUrl} onClose={() => setShowVideo(false)} />}

      <p className="rounded-xl border border-nave-bezel p-4 text-sm">
        Elogio anônimo: <strong>ninguém da organização vê quem elogiou pelo app.</strong>
      </p>

      {!windowOpen ? (
        <p className="painel p-4 text-lg">Janela fechada. O QG avisa quando abrir a próxima.</p>
      ) : (
        <>
          <p className="text-sm font-medium text-nave-success">Janela aberta: {windowName}</p>
          <div className="sticky top-0 z-10 -mx-1 bg-nave-bg px-1 py-2">
            <label htmlFor="busca-elogio" className="sr-only">
              Buscar voluntário
            </label>
            <input
              id="busca-elogio"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pelo nome"
              autoComplete="off"
              className="campo h-12 text-lg"
            />
          </div>
          <p className="text-sm text-nave-text-secondary">Toque no ícone para enviar. Toque de novo para retirar.</p>

          {loadError ? (
            <p role="alert" className="rounded border-2 border-nave-danger p-3 text-nave-danger">
              Erro: {loadError}
            </p>
          ) : !all ? (
            <p className="text-sm text-nave-text-secondary">Carregando lista…</p>
          ) : people.length === 0 ? (
            <p className="text-nave-text-secondary">Ninguém com esse nome.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {people.map((p) => {
                const mine = sent[p.id] ?? [];
                return (
                  <li key={p.id} className="rounded-xl border border-nave-bezel px-4 py-4">
                    <p className="text-base font-semibold text-nave-text">{p.fullName}</p>
                    <p className="mb-3 text-sm text-nave-text-secondary">{p.teamName ?? "Sem equipe"}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {TRAITS.map((t) => {
                        const on = mine.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            aria-pressed={on}
                            aria-label={`${TRAIT_INFO[t].label} para ${p.fullName}: ${on ? "enviado" : "não enviado"}`}
                            onClick={() => toggle(p.id, t)}
                            className={`flex min-h-[80px] flex-col items-center justify-center gap-2 rounded-lg border-2 px-2 py-3 text-xs transition-colors active:scale-95 ${
                              on ? "border-nave-gold bg-nave-gold text-nave-bg shadow-[0_0_0_2px_rgba(232,184,90,0.35)]" : "border-nave-gold-dim text-nave-text"
                            }`}
                          >
                            <TraitIcon trait={t} size={24} />
                            <span className="text-sm font-semibold leading-tight">{TRAIT_INFO[t].label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {cardError?.id === p.id && (
                      <p role="alert" className="mt-2 rounded border-2 border-nave-danger p-2 text-sm text-nave-danger">
                        Erro: {cardError.msg}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
