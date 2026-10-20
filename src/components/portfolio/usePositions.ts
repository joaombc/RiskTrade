import { useSyncExternalStore } from "react";
import { isPosition, type Position, type PositionUnit, type UnitExit } from "@/lib/positions";

const STORAGE_KEY = "risktrade:portfolio:positions:v1";
const CHANGE_EVENT = "risktrade:portfolio-positions-change";
const EMPTY: Position[] = [];

// O snapshot precisa ser estável entre leituras; só reparseia quando o JSON muda.
let cachedRaw: string | null = null;
let cachedPositions: Position[] = EMPTY;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): Position[] {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedPositions;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedPositions = Array.isArray(parsed) ? parsed.filter(isPosition) : EMPTY;
  } catch {
    cachedPositions = EMPTY;
  }
  return cachedPositions;
}

function subscribe(onChange: () => void) {
  // "storage" mantém abas diferentes sincronizadas; o evento próprio cobre a aba atual.
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function write(update: (positions: Position[]) => Position[]) {
  const next = update(getSnapshot());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage bloqueado: sem persistência, mas também sem quebrar a página.
    cachedRaw = null;
    cachedPositions = next;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const mapPosition = (id: string, update: (p: Position) => Position) => write((list) => list.map((p) => (p.id === id ? update(p) : p)));

export const positionActions = {
  open(position: Position) {
    write((list) => [...list, position]);
  },

  /** Venda registrada de uma unidade (preço e data reais, informados pelo usuário). */
  recordExit(positionId: string, unitIds: string[], exit: UnitExit) {
    mapPosition(positionId, (p) => ({ ...p, units: p.units.map((u) => (unitIds.includes(u.id) && !u.exit ? { ...u, exit } : u)) }));
  },

  /** Nova camada da pirâmide. */
  addUnit(positionId: string, unit: PositionUnit) {
    mapPosition(positionId, (p) => ({ ...p, units: [...p.units, unit] }));
  },

  /** Apaga um registro feito por engano. */
  remove(positionId: string) {
    write((list) => list.filter((p) => p.id !== positionId));
  },
};

export function usePositions(): Position[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
