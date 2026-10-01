import { DRAWING_KINDS, type Drawing } from "./types";

const KEY_PREFIX = "risktrade:drawings:v1:";

function isDrawing(value: unknown): value is Drawing {
  if (!value || typeof value !== "object") return false;
  const d = value as Partial<Drawing>;
  return (
    typeof d.id === "string" &&
    DRAWING_KINDS.includes(d.kind as Drawing["kind"]) &&
    Array.isArray(d.points) &&
    d.points.every((p) => Number.isFinite(p?.time) && Number.isFinite(p?.price)) &&
    typeof d.options === "object" &&
    d.options !== null
  );
}

/** Desenhos salvos para o ativo. Dados corrompidos ou storage bloqueado resultam em lista vazia. */
export function loadDrawings(symbol: string): Drawing[] {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + symbol);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isDrawing) : [];
  } catch {
    return [];
  }
}

export function saveDrawings(symbol: string, drawings: Drawing[]): void {
  try {
    if (drawings.length === 0) localStorage.removeItem(KEY_PREFIX + symbol);
    else localStorage.setItem(KEY_PREFIX + symbol, JSON.stringify(drawings));
  } catch {
    // Storage cheio ou bloqueado (modo privado): os desenhos continuam valendo nesta sessão.
  }
}
