import type { Bar } from "./drawings/types";
import { sma } from "./indicators";

/**
 * Bandas de Bollinger (Murphy, cap. 9): 2 desvios-padrão acima e abaixo de uma média de 20
 * períodos. Cálculos puros, a partir dos fechamentos.
 */

export const BOLLINGER_PERIOD = 20;
export const BOLLINGER_DEVIATIONS = 2;
/** Candles comparados para dizer se as bandas estão apertadas ou muito abertas. */
export const BANDWIDTH_LOOKBACK = 120;
/** Fechamentos seguidos do mesmo lado da média para caracterizar tendência forte. */
export const STRONG_TREND_BARS = 10;
/** Toques nas bandas mais antigos que isso não entram na leitura. */
export const RECENT_TOUCH_BARS = 5;

type Values = (number | null)[];

export interface BollingerBands {
  middle: Values;
  upper: Values;
  lower: Values;
  /** Largura das bandas em % da média: mede a volatilidade. */
  width: Values;
}

/**
 * Bandas alinhadas aos candles. Os fechamentos de `warmup` (anteriores ao período) entram no
 * cálculo, para as bandas já valerem no primeiro candle. Desvio-padrão populacional, como
 * Bollinger define.
 */
export function bollinger(
  bars: Pick<Bar, "close">[],
  warmup: number[] = [],
  period = BOLLINGER_PERIOD,
  deviations = BOLLINGER_DEVIATIONS,
): BollingerBands {
  const closes = [...warmup, ...bars.map((b) => b.close)];
  const middle = sma(closes, period);
  const upper: Values = [];
  const lower: Values = [];
  const width: Values = [];
  middle.forEach((mean, i) => {
    if (mean === null) {
      upper.push(null);
      lower.push(null);
      width.push(null);
      return;
    }
    const window = closes.slice(i - period + 1, i + 1);
    const deviation = Math.sqrt(window.reduce((sum, c) => sum + (c - mean) ** 2, 0) / period);
    upper.push(mean + deviations * deviation);
    lower.push(mean - deviations * deviation);
    width.push(((2 * deviations * deviation) / mean) * 100);
  });
  const skip = warmup.length;
  return { middle: middle.slice(skip), upper: upper.slice(skip), lower: lower.slice(skip), width: width.slice(skip) };
}

export interface BollingerReading {
  close: number;
  middle: number;
  upper: number;
  lower: number;
  /** Posição do fechamento nas bandas: 0 = banda de baixo, 1 = banda de cima (pode passar dos limites). */
  percentB: number;
  /** Toque mais recente numa banda, nos últimos RECENT_TOUCH_BARS candles. */
  touch: { band: "upper" | "lower"; index: number } | null;
  /**
   * Alvo pelo último cruzamento da média (Murphy): cruzou para cima → banda de cima; para
   * baixo → banda de baixo. `fromBand` indica se o cruzamento veio depois de um toque na banda
   * oposta, o caso clássico do livro.
   */
  target: { direction: "up" | "down"; price: number; crossIndex: number; fromBand: boolean } | null;
  /** Fechamentos seguidos do mesmo lado da média, com toque na banda daquele lado. */
  strongTrend: "up" | "down" | null;
  /** Largura atual e onde ela está entre as dos últimos BANDWIDTH_LOOKBACK candles (0 a 1). */
  width: { current: number; rank: number; state: "squeeze" | "wide" | "normal" };
}

/** Leitura das bandas no último candle, com as regras de Murphy. Null sem histórico suficiente. */
export function readBollinger(bars: Pick<Bar, "high" | "low" | "close">[], bands: BollingerBands): BollingerReading | null {
  const last = bars.length - 1;
  const [middle, upper, lower, width] = [bands.middle[last], bands.upper[last], bands.lower[last], bands.width[last]];
  if (last < 1 || middle == null || upper == null || lower == null || width == null) return null;
  const close = bars[last].close;

  const touchAt = (i: number): "upper" | "lower" | null => {
    const [u, l] = [bands.upper[i], bands.lower[i]];
    if (u == null || l == null) return null;
    if (bars[i].high >= u) return "upper";
    if (bars[i].low <= l) return "lower";
    return null;
  };
  let touch: BollingerReading["touch"] = null;
  for (let i = last; i >= Math.max(0, last - RECENT_TOUCH_BARS + 1); i--) {
    const band = touchAt(i);
    if (band) {
      touch = { band, index: i };
      break;
    }
  }

  // Último cruzamento do fechamento sobre a média.
  let target: BollingerReading["target"] = null;
  for (let i = last; i >= 1; i--) {
    const [m0, m1] = [bands.middle[i - 1], bands.middle[i]];
    if (m0 == null || m1 == null) break;
    const [c0, c1] = [bars[i - 1].close, bars[i].close];
    const direction = c0 <= m0 && c1 > m1 ? "up" : c0 >= m0 && c1 < m1 ? "down" : null;
    if (!direction) continue;
    // O toque na banda oposta conta se aconteceu desde o cruzamento anterior (até 20 candles antes).
    let fromBand = false;
    for (let j = i; j >= Math.max(0, i - BOLLINGER_PERIOD); j--) {
      if (touchAt(j) === (direction === "up" ? "lower" : "upper")) {
        fromBand = true;
        break;
      }
    }
    target = { direction, price: direction === "up" ? upper : lower, crossIndex: i, fromBand };
    break;
  }

  const recent = bars.slice(-STRONG_TREND_BARS).map((b, k) => ({ close: b.close, i: bars.length - STRONG_TREND_BARS + k }));
  const side = (want: "up" | "down") =>
    recent.length === STRONG_TREND_BARS &&
    recent.every(({ close: c, i }) => {
      const m = bands.middle[i];
      return m != null && (want === "up" ? c >= m : c <= m);
    }) &&
    recent.some(({ i }) => touchAt(i) === (want === "up" ? "upper" : "lower"));
  const strongTrend = side("up") ? "up" : side("down") ? "down" : null;

  const widths = bands.width.slice(-BANDWIDTH_LOOKBACK).filter((w): w is number => w != null);
  const rank = widths.length > 1 ? widths.filter((w) => w < width).length / (widths.length - 1) : 0.5;
  const state = rank <= 0.1 ? "squeeze" : rank >= 0.9 ? "wide" : "normal";

  return {
    close,
    middle,
    upper,
    lower,
    // Preços parados: as bandas coincidem e o preço está, por definição, no meio.
    percentB: upper > lower ? (close - lower) / (upper - lower) : 0.5,
    touch,
    target,
    strongTrend,
    width: { current: width, rank, state },
  };
}

const STORAGE_KEY = "risktrade:bollinger:v1";

/** Bandas ligadas no gráfico (vale para todos os ativos). Storage bloqueado: desligadas. */
export function loadBollingerEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveBollingerEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
