"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VolunteerPicker } from "@/components/VolunteerPicker";

type MealOption = { id: string; label: string; time: string };

type Result =
  | {
      status: "liberado";
      outsideTeamWindow: boolean;
      checkinId: string;
      volunteer: { fullName: string; teamName: string | null; dietNotes: string | null };
    }
  | {
      status: "ja_consumiu";
      at: string;
      byName: string | null;
      justNow: boolean;
      volunteer: { fullName: string; teamName: string | null; dietNotes: string | null };
    }
  | { status: "erro"; message: string };

const hm = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function CheckinConsole({ meals, defaultMealId }: { meals: MealOption[]; defaultMealId: string }) {
  const [mealId, setMealId] = useState(defaultMealId);
  const [mode, setMode] = useState<"camera" | "busca">("camera");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const showingRef = useRef(false);
  const lastTokenRef = useRef<{ token: string; at: number } | null>(null);
  const mealRef = useRef(mealId);
  mealRef.current = mealId;

  const submit = useCallback(async (body: Record<string, string>) => {
    if (showingRef.current) return;
    showingRef.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/qg/meals/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealId: mealRef.current, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ status: "erro", message: data.error ?? "Não foi possível registrar. Nada foi gravado." });
      } else {
        setResult(data as Result);
      }
    } catch {
      setResult({ status: "erro", message: "Falha de conexão. Nada foi gravado. Tente de novo." });
    } finally {
      setBusy(false);
    }
  }, []);

  const onDecode = useCallback(
    (token: string) => {
      const last = lastTokenRef.current;
      if (last && last.token === token && Date.now() - last.at < 5_000) return;
      lastTokenRef.current = { token, at: Date.now() };
      submit({ token });
    },
    [submit],
  );

  useEffect(() => {
    if (mode !== "camera") return;
    let scanner: { stop: () => Promise<void>; isScanning: boolean } | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const s = new Html5Qrcode("qr-reader", { verbose: false });
        scanner = s;
        await s.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } }, onDecode, () => {});
        setCameraError(null);
      } catch {
        setCameraError("Não foi possível abrir a câmera. Permita o acesso ou use a busca por nome.");
      }
    })();
    return () => {
      cancelled = true;
      if (scanner?.isScanning) scanner.stop().catch(() => {});
    };
  }, [mode, onDecode]);

  const close = () => {
    setResult(null);
    showingRef.current = false;
  };

  const undo = async (checkinId: string) => {
    if (!window.confirm("Desfazer este check-in? A ação fica registrada no histórico.")) return;
    try {
      const res = await fetch("/api/qg/meals/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkinId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data.error ?? "Não foi possível desfazer.");
        return;
      }
      close();
    } catch {
      window.alert("Falha de conexão. O check-in NÃO foi desfeito.");
    }
  };

  return (
    <div className="flex flex-col gap-4 text-base">
      <label className="flex flex-col gap-1">
        <span className="label-mono">Refeição</span>
        <select
          value={mealId}
          onChange={(e) => setMealId(e.target.value)}
          className="tap-target rounded border border-nave-gold bg-nave-bg px-3 text-lg text-nave-text"
        >
          {meals.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} · {m.time}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2" role="tablist">
        {(["camera", "busca"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`tap-target rounded border font-mono text-sm uppercase ${
              mode === m ? "border-nave-gold bg-nave-gold text-nave-bg" : "border-nave-gold-dim text-nave-text-secondary"
            }`}
          >
            {m === "camera" ? "Ler QR" : "Buscar nome"}
          </button>
        ))}
      </div>

      {mode === "camera" ? (
        <div className="flex flex-col gap-2">
          <div id="qr-reader" className="overflow-hidden rounded border border-nave-bezel bg-black" />
          {cameraError && <p role="alert" className="text-nave-danger">Erro: {cameraError}</p>}
          {busy && <p className="font-mono text-sm text-nave-text-secondary">Registrando…</p>}
        </div>
      ) : (
        <VolunteerPicker autoFocus label="Voluntário sem celular" onPick={(v) => submit({ volunteerId: v.id })} />
      )}

      {result && <ResultOverlay result={result} onClose={close} onUndo={undo} />}
    </div>
  );
}

function BigIcon({ kind }: { kind: "ok" | "no" | "warn" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="88" height="88" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      {kind === "ok" && <path d="m7.5 12.5 3 3 6-6.5" />}
      {kind === "no" && <path d="m8.5 8.5 7 7M15.5 8.5l-7 7" />}
      {kind === "warn" && <path d="M12 7v6M12 16.5h.01" />}
    </svg>
  );
}

function ResultOverlay({ result, onClose, onUndo }: { result: Result; onClose: () => void; onUndo: (id: string) => void }) {
  const tone =
    result.status === "liberado" ? "bg-[#0f5a2c]" : result.status === "ja_consumiu" ? "bg-[#8f1219]" : "bg-[#5a3d0a]";

  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="checkin-title" className={`fixed inset-0 z-[60] flex flex-col overflow-y-auto justify-between p-6 text-white ${tone}`}>
      <div className="flex flex-col gap-4">
        {result.status === "liberado" && (
          <>
            <BigIcon kind="ok" />
            <p id="checkin-title" className="text-5xl font-bold tracking-wide">LIBERADO</p>
            <Who v={result.volunteer} />
            {result.outsideTeamWindow && (
              <p className="rounded border-2 border-[#ffd27a] bg-black/30 p-3 text-lg">Atenção: fora do horário da equipe (não bloqueia)</p>
            )}
          </>
        )}
        {result.status === "ja_consumiu" && (
          <>
            <BigIcon kind="no" />
            <p id="checkin-title" className="text-4xl font-bold tracking-wide">{result.justNow ? "JÁ REGISTRADO AGORA" : "JÁ CONSUMIU"}</p>
            <Who v={result.volunteer} />
            <p className="text-xl">
              Esta refeição foi registrada às {hm(result.at)}
              {result.byName ? `, por ${result.byName}` : ""}.
            </p>
          </>
        )}
        {result.status === "erro" && (
          <>
            <BigIcon kind="warn" />
            <p id="checkin-title" className="text-4xl font-bold">NÃO REGISTRADO</p>
            <p className="text-xl">{result.message}</p>
          </>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <button autoFocus onClick={onClose} className="min-h-[64px] rounded bg-white text-xl font-bold uppercase text-black">
          Próximo
        </button>
        {result.status === "liberado" && (
          <button onClick={() => onUndo(result.checkinId)} className="min-h-[48px] rounded border border-white/70 text-base uppercase">
            Desfazer (registrado por engano)
          </button>
        )}
      </div>
    </div>
  );
}

function Who({ v }: { v: { fullName: string; teamName: string | null; dietNotes: string | null } }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-3xl font-semibold">{v.fullName}</p>
      <p className="text-xl opacity-90">{v.teamName ?? "Sem equipe"}</p>
      {v.dietNotes && (
        <p className="rounded bg-white p-3 text-2xl font-bold text-black">Restrição: {v.dietNotes}</p>
      )}
    </div>
  );
}
