import type { Bar } from "./drawings/types";

/**
 * Sistema de Movimento Direcional de J. Welles Wilder: +DI, −DI e ADX. Os DI medem a força das
 * altas e das baixas; o ADX mede a força da tendência, sem dizer a direção. Todas as médias usam a
 * suavização de Wilder. Cálculos puros, a partir das máximas, mínimas e fechamentos.
 */

export const ADX_PERIOD = 14;
/** ADX acima disso: tendência forte (seguidores de tendência). */
export const ADX_STRONG = 25;
/** ADX abaixo disso: sem tendência (osciladores e operações na faixa). */
export const ADX_WEAK = 20;
/** Candles usados para dizer se o ADX está subindo ou caindo. */
const SLOPE_BARS = 3;

type Values = (number | null)[];

export interface DmiLines {
  plusDI: Values;
  minusDI: Values;
  adx: Values;
}

/** +DI, −DI e ADX alinhados aos candles. Os DI começam no candle `period`; o ADX, no `2 × period − 1`. */
export function dmi(bars: Pick<Bar, "high" | "low" | "close">[], period = ADX_PERIOD): DmiLines {
  const n = bars.length;
  const plusDI: Values = new Array(n).fill(null);
  const minusDI: Values = new Array(n).fill(null);
  const adx: Values = new Array(n).fill(null);
  let tr = 0;
  let plus = 0;
  let minus = 0;
  const dx: number[] = [];
  let adxValue: number | null = null;
  for (let i = 1; i < n; i++) {
    const up = bars[i].high - bars[i - 1].high;
    const down = bars[i - 1].low - bars[i].low;
    const plusDM = up > down && up > 0 ? up : 0;
    const minusDM = down > up && down > 0 ? down : 0;
    const range = Math.max(bars[i].high - bars[i].low, Math.abs(bars[i].high - bars[i - 1].close), Math.abs(bars[i].low - bars[i - 1].close));
    // Os primeiros `period` valores são somados; depois, suavização de Wilder (tira 1/period e soma o novo).
    if (i <= period) {
      tr += range;
      plus += plusDM;
      minus += minusDM;
      if (i < period) continue;
    } else {
      tr = tr - tr / period + range;
      plus = plus - plus / period + plusDM;
      minus = minus - minus / period + minusDM;
    }
    const pdi = tr === 0 ? 0 : (100 * plus) / tr;
    const mdi = tr === 0 ? 0 : (100 * minus) / tr;
    plusDI[i] = pdi;
    minusDI[i] = mdi;
    dx.push(pdi + mdi === 0 ? 0 : (100 * Math.abs(pdi - mdi)) / (pdi + mdi));
    if (dx.length === period) adxValue = dx.reduce((a, b) => a + b, 0) / period;
    else if (dx.length > period) adxValue = (adxValue! * (period - 1) + dx[dx.length - 1]) / period;
    if (adxValue !== null) adx[i] = adxValue;
  }
  return { plusDI, minusDI, adx };
}

export interface DiCross {
  index: number;
  /** "up": +DI passou acima de −DI (compra); "down": abaixo (venda). */
  dir: "up" | "down";
}

/** Cruzamentos de +DI com −DI. */
export function diCrosses({ plusDI, minusDI }: DmiLines): DiCross[] {
  const crosses: DiCross[] = [];
  for (let i = 1; i < plusDI.length; i++) {
    const [p0, m0, p1, m1] = [plusDI[i - 1], minusDI[i - 1], plusDI[i], minusDI[i]];
    if (p0 === null || m0 === null || p1 === null || m1 === null) continue;
    if (p0 <= m0 && p1 > m1) crosses.push({ index: i, dir: "up" });
    else if (p0 >= m0 && p1 < m1) crosses.push({ index: i, dir: "down" });
  }
  return crosses;
}

export interface AdxReading {
  adx: number;
  plusDI: number;
  minusDI: number;
  /** strong: ADX ≥ 25; weak: < 20; moderate: entre os dois. */
  strength: "strong" | "moderate" | "weak";
  slope: "rising" | "falling" | "flat";
  /** Quem domina: +DI acima de −DI (alta) ou abaixo (baixa). */
  direction: "up" | "down";
  lastCross: DiCross | null;
}

/** Leitura do último candle; null se o ADX ainda não começou. */
export function readAdx(lines: DmiLines): AdxReading | null {
  const last = lines.adx.length - 1;
  const [adx, plusDI, minusDI] = [lines.adx[last], lines.plusDI[last], lines.minusDI[last]];
  if (adx == null || plusDI == null || minusDI == null) return null;
  const before = lines.adx[last - SLOPE_BARS];
  return {
    adx,
    plusDI,
    minusDI,
    strength: adx >= ADX_STRONG ? "strong" : adx < ADX_WEAK ? "weak" : "moderate",
    slope: before == null || Math.abs(adx - before) < 0.5 ? "flat" : adx > before ? "rising" : "falling",
    direction: plusDI >= minusDI ? "up" : "down",
    lastCross: diCrosses(lines).at(-1) ?? null,
  };
}

const STORAGE_KEY = "risktrade:adx:v1";

/** ADX ligado no gráfico (vale para todos os ativos). Storage bloqueado: desligado. */
export function loadAdxEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveAdxEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
