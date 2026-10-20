import type { Bar } from "./drawings/types";

/**
 * SAR parabólico de J. Welles Wilder ("stop and reverse"). O ponto acompanha o preço como um stop
 * móvel que acelera: a cada novo extremo, o fator de aceleração sobe (0,02 até 0,20). Quando o
 * preço cruza o ponto, a posição vira. Cálculos puros, a partir das máximas e mínimas.
 */

export const SAR_START = 0.02;
export const SAR_STEP = 0.02;
export const SAR_MAX = 0.2;

export interface SarPoint {
  sar: number;
  /** true: comprado (o SAR fica abaixo do preço); false: vendido (acima). */
  long: boolean;
}

export interface SarFlip {
  index: number;
  /** "buy": virou para comprado; "sell": para vendido. */
  kind: "buy" | "sell";
}

/** SAR de cada candle (null no primeiro, que só define a direção inicial). */
export function parabolicSar(
  bars: Pick<Bar, "high" | "low" | "close">[],
  start = SAR_START,
  step = SAR_STEP,
  max = SAR_MAX,
): (SarPoint | null)[] {
  const out: (SarPoint | null)[] = bars.map(() => null);
  if (bars.length < 2) return out;
  let long = bars[1].close >= bars[0].close;
  let sar = long ? Math.min(bars[0].low, bars[1].low) : Math.max(bars[0].high, bars[1].high);
  let ep = long ? Math.max(bars[0].high, bars[1].high) : Math.min(bars[0].low, bars[1].low);
  let af = start;
  out[1] = { sar, long };
  for (let i = 2; i < bars.length; i++) {
    let next = sar + af * (ep - sar);
    // O SAR não pode entrar nos dois candles anteriores.
    next = long ? Math.min(next, bars[i - 1].low, bars[i - 2].low) : Math.max(next, bars[i - 1].high, bars[i - 2].high);
    if (long && bars[i].low < next) {
      // Virou: o novo SAR é o extremo da alta anterior.
      long = false;
      next = ep;
      ep = bars[i].low;
      af = start;
    } else if (!long && bars[i].high > next) {
      long = true;
      next = ep;
      ep = bars[i].high;
      af = start;
    } else if (long && bars[i].high > ep) {
      ep = bars[i].high;
      af = Math.min(af + step, max);
    } else if (!long && bars[i].low < ep) {
      ep = bars[i].low;
      af = Math.min(af + step, max);
    }
    sar = next;
    out[i] = { sar, long };
  }
  return out;
}

/** Viradas do SAR: compra quando passa a comprado, venda quando passa a vendido. */
export function sarFlips(points: (SarPoint | null)[]): SarFlip[] {
  const flips: SarFlip[] = [];
  for (let i = 1; i < points.length; i++) {
    const [prev, now] = [points[i - 1], points[i]];
    if (prev && now && prev.long !== now.long) flips.push({ index: i, kind: now.long ? "buy" : "sell" });
  }
  return flips;
}

export interface SarReading {
  sar: number;
  long: boolean;
  /** Primeiro candle da posição atual. */
  since: number;
  /** Distância do fechamento ao SAR, em % do fechamento. */
  distance: number;
  lastFlip: SarFlip | null;
}

/** Leitura do último candle; null sem SAR. */
export function readSar(bars: Pick<Bar, "close">[], points: (SarPoint | null)[]): SarReading | null {
  const last = points[points.length - 1];
  if (!last) return null;
  const flips = sarFlips(points);
  const lastFlip = flips.at(-1) ?? null;
  const close = bars[bars.length - 1].close;
  return {
    sar: last.sar,
    long: last.long,
    since: lastFlip?.index ?? points.findIndex((p) => p !== null),
    distance: (Math.abs(close - last.sar) / close) * 100,
    lastFlip,
  };
}

const STORAGE_KEY = "risktrade:sar:v1";

/** SAR parabólico ligado no gráfico (vale para todos os ativos). Storage bloqueado: desligado. */
export function loadSarEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveSarEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
