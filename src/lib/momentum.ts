import type { Bar } from "./drawings/types";

/**
 * Linha de momentum (Murphy, cap. 10): o fechamento de hoje menos o de N períodos atrás. Oscila
 * em torno de zero e mede a velocidade do movimento, por isso costuma virar antes do preço.
 * Cálculos puros, a partir dos fechamentos.
 */

/** 10 é o período mais usado; 20 e 40 seguem os ciclos (dobrando a cada passo). */
export const MOMENTUM_PERIODS = [10, 20, 40] as const;
export type MomentumPeriod = (typeof MOMENTUM_PERIODS)[number];

/** Candles comparados para dizer se o momentum está num extremo. */
export const MOMENTUM_LOOKBACK = 120;
/** Fração do maior valor absoluto do período a partir da qual o momentum é extremo. */
export const EXTREME_RATIO = 0.8;
/** Candles usados para dizer se o momentum está acelerando ou desacelerando. */
export const SLOPE_BARS = 3;

type Values = (number | null)[];

/**
 * Momentum alinhado aos candles. Os fechamentos de `warmup` (anteriores ao período) entram no
 * cálculo, para a linha já valer no primeiro candle.
 */
export function momentum(bars: Pick<Bar, "close">[], period: number, warmup: number[] = []): Values {
  const closes = [...warmup, ...bars.map((b) => b.close)];
  return closes.map((close, i) => (i >= period ? close - closes[i - period] : null)).slice(warmup.length);
}

export interface ZeroCross {
  index: number;
  /** "up": cruzou a linha zero para cima (compra); "down": para baixo (venda). */
  dir: "up" | "down";
}

/** Cruzamentos da linha zero. Um valor exatamente zero não conta como lado. */
export function zeroCrossings(values: Values): ZeroCross[] {
  const crosses: ZeroCross[] = [];
  let side: 1 | -1 | null = null;
  values.forEach((v, index) => {
    if (v === null || v === 0) return;
    const now = v > 0 ? 1 : -1;
    if (side !== null && now !== side) crosses.push({ index, dir: now > 0 ? "up" : "down" });
    side = now;
  });
  return crosses;
}

export interface MomentumReading {
  value: number;
  /** Momentum em % do fechamento de N períodos atrás: compara ativos e períodos. */
  percent: number;
  slope: "rising" | "falling" | "flat";
  /** Perto do maior valor (positivo ou negativo) dos últimos candles. */
  extreme: "high" | "low" | null;
  lastCross: ZeroCross | null;
}

/** Leitura do último candle; null se ainda não há momentum suficiente. */
export function readMomentum(bars: Pick<Bar, "close">[], values: Values): MomentumReading | null {
  const last = values.length - 1;
  const value = values[last];
  if (value === null || value === undefined) return null;
  const base = bars[last].close - value;
  const before = values[last - SLOPE_BARS];
  const slope = before === null || before === undefined || before === value ? "flat" : value > before ? "rising" : "falling";
  const recent = values.slice(-MOMENTUM_LOOKBACK).filter((v): v is number => v !== null);
  const top = Math.max(...recent);
  const bottom = Math.min(...recent);
  const extreme = value > 0 && value >= top * EXTREME_RATIO ? "high" : value < 0 && value <= bottom * EXTREME_RATIO ? "low" : null;
  return {
    value,
    percent: base === 0 ? 0 : (value / base) * 100,
    slope,
    extreme,
    lastCross: zeroCrossings(values).at(-1) ?? null,
  };
}

const STORAGE_KEY = "risktrade:momentum:v1";

/** Período da linha de momentum (vale para todos os ativos); null = desligada. Storage bloqueado: desligada. */
export function loadMomentumPeriod(): MomentumPeriod | null {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return (MOMENTUM_PERIODS as readonly number[]).includes(saved) ? (saved as MomentumPeriod) : null;
  } catch {
    return null;
  }
}

export function saveMomentumPeriod(period: MomentumPeriod | null): void {
  try {
    if (period) localStorage.setItem(STORAGE_KEY, String(period));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
