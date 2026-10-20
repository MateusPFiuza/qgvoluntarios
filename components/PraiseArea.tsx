"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TRAIT_INFO, TRAITS, type Trait } from "@/lib/rules/praise";
import { normalizeForSearch } from "@/lib/rules/name-search";
import { loadDirectory, type DirectoryEntry } from "./VolunteerPicker";
import { ExplainerModal } from "./ExplainerModal";
import { TraitIcon } from "./TraitIcon";

type PersonRef = { id: string; name: string; team: string | null };
type Person = PersonRef & { traits: Trait[] };

const MIN_CHARS = 2;
const CLOSE_DRAG_PX = 80;

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
  const [selected, setSelected] = useState<PersonRef | null>(null);
  const [known, setKnown] = useState<Record<string, PersonRef>>(() => Object.fromEntries(initial.map((p) => [p.id, { id: p.id, name: p.name, team: p.team }])));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Trait | null>(null);

  useEffect(() => {
    if (!windowOpen) return;
    loadDirectory()
      .then(setAll)
      .catch((e) => setError(e instanceof Error ? e.message : "Falha de conexão."));
  }, [windowOpen]);

  const q = normalizeForSearch(query);
  const results = useMemo(() => {
    if (!all || q.length < MIN_CHARS) return [];
    return all.filter((v) => v.id !== selfId && normalizeForSearch(v.searchName || v.fullName).includes(q));
  }, [all, q, selfId]);
  const alreadyPraised = Object.values(known).filter((p) => (sent[p.id] ?? []).length > 0);

  const toggle = async (personId: string, trait: Trait) => {
    const current = sent[personId] ?? [];
    const on = !current.includes(trait);
    const apply = (state: boolean) =>
      setSent((s) => {
        const list = s[personId] ?? [];
        return { ...s, [personId]: state ? [...list.filter((t) => t !== trait), trait] : list.filter((t) => t !== trait) };
      });
    apply(on);
    setPending(trait);
    try {
      const res = await fetch("/api/praise", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: personId, trait, on }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível gravar.");
      setError(null);
    } catch (e) {
      apply(!on);
      setError(e instanceof Error ? e.message : "Falha de conexão. O elogio não foi gravado.");
    } finally {
      setPending(null);
    }
  };

  const open = (p: PersonRef) => {
    setError(null);
    setKnown((k) => ({ ...k, [p.id]: p }));
    setSelected(p);
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
          <label htmlFor="busca-elogio" className="font-display text-xl text-nave-text">
            Quem você quer elogiar?
          </label>
          <input
            id="busca-elogio"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite o nome (2 letras ou mais)"
            autoComplete="off"
            className="campo h-14 text-lg"
          />
          {error && !selected && (
            <p role="alert" className="rounded border-2 border-nave-danger p-3 text-nave-danger">
              Erro: {error}
            </p>
          )}

          {q.length >= MIN_CHARS ? (
            !all ? (
              <p className="text-sm text-nave-text-secondary">Carregando lista…</p>
            ) : results.length === 0 ? (
              <p className="text-nave-text-secondary">Ninguém com esse nome.</p>
            ) : (
              <PeopleList people={results.map((r) => ({ id: r.id, name: r.fullName, team: r.teamName }))} sent={sent} onOpen={open} />
            )
          ) : alreadyPraised.length > 0 ? (
            <>
              <p className="label-mono">Quem você já elogiou nesta janela</p>
              <PeopleList people={alreadyPraised} sent={sent} onOpen={open} />
            </>
          ) : (
            <p className="text-nave-text-secondary">Busque o nome de um colega para começar.</p>
          )}
        </>
      )}

      {selected && (
        <PraiseSheet
          person={selected}
          sent={sent[selected.id] ?? []}
          pending={pending}
          error={error}
          onToggle={(t) => toggle(selected.id, t)}
          onClose={() => {
            setSelected(null);
            setError(null);
          }}
        />
      )}
    </div>
  );
}

function PeopleList({
  people,
  sent,
  onOpen,
}: {
  people: PersonRef[];
  sent: Record<string, Trait[]>;
  onOpen: (p: PersonRef) => void;
}) {
  return (
    <ul className="flex flex-col divide-y divide-nave-bezel rounded-xl border border-nave-bezel">
      {people.map((p) => {
        const mine = sent[p.id] ?? [];
        return (
          <li key={p.id}>
            <button type="button" onClick={() => onOpen(p)} className="flex min-h-[60px] w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-nave-panel">
              <span className="min-w-0">
                <span className="block text-base">{p.name}</span>
                <span className="block text-sm text-nave-text-secondary">{p.team ?? "Sem equipe"}</span>
              </span>
              {mine.length > 0 && (
                <span className="flex shrink-0 gap-1 text-nave-gold" aria-label={`Você enviou: ${mine.map((t) => TRAIT_INFO[t].label).join(", ")}`}>
                  {TRAITS.filter((t) => mine.includes(t)).map((t) => (
                    <TraitIcon key={t} trait={t} size={20} />
                  ))}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PraiseSheet({
  person,
  sent,
  pending,
  error,
  onToggle,
  onClose,
}: {
  person: PersonRef;
  sent: Trait[];
  pending: Trait | null;
  error: string | null;
  onToggle: (t: Trait) => void;
  onClose: () => void;
}) {
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => (startY.current = e.touches[0].clientY)}
        onTouchMove={(e) => {
          if (startY.current !== null) setDragY(Math.max(0, e.touches[0].clientY - startY.current));
        }}
        onTouchEnd={() => {
          if (dragY > CLOSE_DRAG_PX) onClose();
          setDragY(0);
          startY.current = null;
        }}
        style={{ transform: `translateY(${dragY}px)` }}
        className="w-full max-w-md rounded-t-2xl border-t-2 border-nave-gold bg-nave-panel px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 md:max-w-2xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-nave-text-secondary/60" aria-hidden="true" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p id="sheet-title" className="font-display text-2xl text-nave-text">
              {person.name}
            </p>
            <p className="text-nave-text-secondary">{person.team ?? "Sem equipe"}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="tap-target shrink-0 rounded-lg border border-nave-bezel px-4 text-sm">
            Fechar
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TRAITS.map((t) => {
            const on = sent.includes(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                disabled={pending === t}
                onClick={() => onToggle(t)}
                className={`flex min-h-[112px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-1 text-sm transition-colors active:scale-95 ${
                  on ? "border-nave-gold bg-nave-gold text-nave-bg" : "border-nave-text-secondary text-nave-text"
                }`}
              >
                <TraitIcon trait={t} size={36} />
                <span className="text-base font-semibold">{TRAIT_INFO[t].label}</span>
                <span className="text-xs">{on ? "✓ Enviado" : "Não enviado"}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-nave-text-secondary">Toque para enviar. Toque de novo para retirar.</p>
        {error && (
          <p role="alert" className="mt-2 rounded border-2 border-nave-danger p-3 text-nave-danger">
            Erro: {error}
          </p>
        )}
      </div>
    </div>
  );
}
