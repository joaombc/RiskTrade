import type { Bar } from "./drawings/types";
import { ema } from "./indicators";
import { isWidening } from "./maOscillator";
import { zeroCrossings, type ZeroCross } from "./momentum";

/**
 * MACD de Gerald Appel e histograma de Thomas Aspray (Murphy, cap. 10). MACD = MME 12 − MME 26;
 * sinal = MME 9 do MACD; histograma = MACD − sinal. Cálculos puros, a partir dos fechamentos.
 */

export const MACD_FAST = 12;
export const MACD_SLOW = 26;
export const MACD_SIGNAL = 9;

type Values = (number | null)[];

export interface MacdLines {
  macd: Values;
  signal: Values;
  histogram: Values;
}

/**
 * MACD alinhado aos candles. Os fechamentos de `warmup` (anteriores ao período) entram no cálculo,
 * para as linhas começarem antes.
 */
export function macd(
  bars: Pick<Bar, "close">[],
  warmup: number[] = [],
  fast = MACD_FAST,
  slow = MACD_SLOW,
  signalPeriod = MACD_SIGNAL,
): MacdLines {
  const closes = [...warmup, ...bars.map((b) => b.close)];
  const fastLine = ema(closes, fast);
  const slowLine = ema(closes, slow);
  const line: Values = closes.map((_, i) => (fastLine[i] === null || slowLine[i] === null ? null : fastLine[i]! - slowLine[i]!));
  // A linha de sinal é a MME do próprio MACD, a partir do primeiro valor dele.
  const first = line.findIndex((v) => v !== null);
  const signal: Values =
    first < 0 ? line.map(() => null) : [...line.slice(0, first).map(() => null), ...ema(line.slice(first) as number[], signalPeriod)];
  const histogram: Values = line.map((v, i) => (v === null || signal[i] === null ? null : v - signal[i]!));
  const skip = warmup.length;
  return { macd: line.slice(skip), signal: signal.slice(skip), histogram: histogram.slice(skip) };
}

export interface MacdCross extends ZeroCross {
  /** O cruzamento aconteceu com o MACD acima de zero? (Compras abaixo de zero e vendas acima pesam mais.) */
  aboveZero: boolean;
}

/** Cruzamentos do MACD com a linha de sinal: são os cruzamentos do histograma com o zero. */
export function macdCrosses({ macd: line, histogram }: MacdLines): MacdCross[] {
  return zeroCrossings(histogram).map((c) => ({ ...c, aboveZero: (line[c.index] ?? 0) > 0 }));
}

export interface MacdReading {
  macd: number;
  signal: number;
  histogram: number;
  /** O histograma cresceu (em módulo) no último candle? */
  widening: boolean;
  /** Candles seguidos com o histograma no mesmo sentido (crescendo ou encolhendo). */
  streak: number;
  lastCross: MacdCross | null;
  /** Último cruzamento da linha zero pelo próprio MACD. */
  lastZeroCross: ZeroCross | null;
}

/** Leitura do último candle; null se ainda não há as três séries. */
export function readMacd(lines: MacdLines): MacdReading | null {
  const last = lines.histogram.length - 1;
  const [line, signal, histogram] = [lines.macd[last], lines.signal[last], lines.histogram[last]];
  if (line === null || line === undefined || signal === null || signal === undefined || histogram === null || histogram === undefined) {
    return null;
  }
  const widening = isWidening(lines.histogram, last) ?? true;
  let streak = 1;
  for (let i = last - 1; i > 0 && isWidening(lines.histogram, i) === widening; i--) streak++;
  return {
    macd: line,
    signal,
    histogram,
    widening,
    streak,
    lastCross: macdCrosses(lines).at(-1) ?? null,
    lastZeroCross: zeroCrossings(lines.macd).at(-1) ?? null,
  };
}

const STORAGE_KEY = "risktrade:macd:v1";

/** MACD ligado no gráfico (vale para todos os ativos). Storage bloqueado: desligado. */
export function loadMacdEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMacdEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
