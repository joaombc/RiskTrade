import type { Bar } from "./drawings/types";

/**
 * Estocástico de George Lane (Murphy, cap. 10): onde o fechamento está dentro da faixa entre a
 * máxima e a mínima dos últimos N períodos. Versão lenta (N, 3, 3): o %K é a média de 3 do %K
 * rápido, e o %D é a média de 3 do %K. Cálculos puros, a partir de máximas, mínimas e fechamentos.
 */

/** 14 é o padrão; 5 serve ao curto prazo; 21 acompanha o ciclo mensal. */
export const STOCHASTIC_PERIODS = [5, 14, 21] as const;
export type StochasticPeriod = (typeof STOCHASTIC_PERIODS)[number];
export const SMOOTHING = 3;

export const OVERBOUGHT = 80;
export const OVERSOLD = 20;

type Values = (number | null)[];

/** Média dos últimos `n` valores; null enquanto não há `n` valores seguidos. */
function rollingMean(values: Values, n: number): Values {
  return values.map((_, i) => {
    if (i < n - 1) return null;
    const window = values.slice(i - n + 1, i + 1);
    return window.some((v) => v === null) ? null : (window as number[]).reduce((a, b) => a + b, 0) / n;
  });
}

/** %K rápido: 100 × (fechamento − mínima de N) ÷ (máxima de N − mínima de N); 50 se a faixa for nula. */
export function fastK(bars: Pick<Bar, "high" | "low" | "close">[], period: number): Values {
  return bars.map((bar, i) => {
    if (i < period - 1) return null;
    const window = bars.slice(i - period + 1, i + 1);
    const high = Math.max(...window.map((b) => b.high));
    const low = Math.min(...window.map((b) => b.low));
    return high === low ? 50 : (100 * (bar.close - low)) / (high - low);
  });
}

export interface StochasticLines {
  k: Values;
  d: Values;
}

/** Estocástico lento (N, 3, 3), alinhado aos candles. */
export function stochastic(bars: Pick<Bar, "high" | "low" | "close">[], period: number, smoothing = SMOOTHING): StochasticLines {
  const k = rollingMean(fastK(bars, period), smoothing);
  return { k, d: rollingMean(k, smoothing) };
}

export interface StochasticCross {
  index: number;
  dir: "up" | "down";
  /** Sinal de Murphy: cruzamento para cima com o %D abaixo de 20, ou para baixo com o %D acima de 80. */
  signal: "buy" | "sell" | null;
}

/** Cruzamentos do %K com o %D, marcando os que acontecem nas zonas extremas. */
export function stochasticCrosses({ k, d }: StochasticLines, overbought = OVERBOUGHT, oversold = OVERSOLD): StochasticCross[] {
  const result: StochasticCross[] = [];
  for (let i = 1; i < k.length; i++) {
    const [k0, d0, k1, d1] = [k[i - 1], d[i - 1], k[i], d[i]];
    if (k0 === null || d0 === null || k1 === null || d1 === null) continue;
    if (k0 <= d0 && k1 > d1) result.push({ index: i, dir: "up", signal: d1 <= oversold ? "buy" : null });
    else if (k0 >= d0 && k1 < d1) result.push({ index: i, dir: "down", signal: d1 >= overbought ? "sell" : null });
  }
  return result;
}

export interface StochasticReading {
  k: number;
  d: number;
  /** Zona pelo %D, a linha que Murphy usa para os sinais. */
  zone: "overbought" | "oversold" | "upper" | "lower";
  lastCross: StochasticCross | null;
  lastSignal: StochasticCross | null;
}

/** Leitura do último candle; null se ainda não há %K e %D. */
export function readStochastic(lines: StochasticLines): StochasticReading | null {
  const k = lines.k.at(-1);
  const d = lines.d.at(-1);
  if (k === null || k === undefined || d === null || d === undefined) return null;
  const crosses = stochasticCrosses(lines);
  return {
    k,
    d,
    zone: d >= OVERBOUGHT ? "overbought" : d <= OVERSOLD ? "oversold" : d >= 50 ? "upper" : "lower",
    lastCross: crosses.at(-1) ?? null,
    lastSignal: crosses.filter((c) => c.signal).at(-1) ?? null,
  };
}

const STORAGE_KEY = "risktrade:stochastic:v1";

/** Período do estocástico (vale para todos os ativos); null = desligado. Storage bloqueado: desligado. */
export function loadStochasticPeriod(): StochasticPeriod | null {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return (STOCHASTIC_PERIODS as readonly number[]).includes(saved) ? (saved as StochasticPeriod) : null;
  } catch {
    return null;
  }
}

export function saveStochasticPeriod(period: StochasticPeriod | null): void {
  try {
    if (period) localStorage.setItem(STORAGE_KEY, String(period));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
