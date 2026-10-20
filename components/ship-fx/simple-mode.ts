// "Modo simples": preferência salva no aparelho que desliga as animações de fundo.
export const SIMPLE_MODE_KEY = "qg26:modo-simples";
export const SIMPLE_MODE_EVENT = "qg26:modo-simples";

export function readSimpleMode(): boolean {
  try {
    return window.localStorage.getItem(SIMPLE_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSimpleMode(on: boolean) {
  try {
    window.localStorage.setItem(SIMPLE_MODE_KEY, on ? "1" : "0");
  } catch {}
  window.dispatchEvent(new CustomEvent(SIMPLE_MODE_EVENT, { detail: on }));
}
