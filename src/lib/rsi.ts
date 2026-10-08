import type { Bar } from "./drawings/types";

/**
 * IFR (Índice de Força Relativa) de J. Welles Wilder (Murphy, cap. 10). Vai de 0 a 100:
 * 100 − 100 ÷ (1 + média das altas ÷ média das baixas). As médias usam a suavização de Wilder.
 * Cálculos puros, a partir dos fechamentos.
 */

/** 14 é o período de Wilder; 9 e 25 são as variações que Murphy cita. */
export const RSI_PERIODS = [9, 14, 25] as const;
export type RsiPeriod = (typeof RSI_PERIODS)[number];

export const OVERBOUGHT = 70;
export const OVERSOLD = 30;
/** Janela (candles de cada lado) para achar topos e fundos do IFR nos failure swings. */
export const PIVOT_WINDOW = 2;

type Values = (number | null)[];

/**
 * IFR alinhado aos candles. Os fechamentos de `warmup` (anteriores ao período) entram no cálculo,
 * para a linha já valer no primeiro candle.
 */
export function rsi(bars: Pick<Bar, "close">[], period: number, warmup: number[] = []): Values {
  const closes = [...warmup, ...bars.map((b) => b.close)];
  const values: Values = closes.map(() => null);
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    if (i <= period) {
      // Primeira média: aritmética das `period` primeiras variações.
      avgGain += gain / period;
      avgLoss += loss / period;
      if (i < period) continue;
    } else {
      // Suavização de Wilder: (média anterior × (n − 1) + valor atual) ÷ n.
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    values[i] = avgLoss === 0 ? (avgGain === 0 ? 50 : 100) : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return values.slice(warmup.length);
}

export type RsiSignalKind = "buy" | "sell";

export interface RsiSignal {
  index: number;
  kind: RsiSignalKind;
  /** "exit": voltou para dentro da faixa 30–70; "failure": failure swing de Wilder. */
  type: "exit" | "failure";
}

/** Saídas das zonas: abaixo de 70 depois de estar acima (venda); acima de 30 depois de estar abaixo (compra). */
export function zoneExits(values: Values, overbought = OVERBOUGHT, oversold = OVERSOLD): RsiSignal[] {
  const signals: RsiSignal[] = [];
  for (let i = 1; i < values.length; i++) {
    const [prev, now] = [values[i - 1], values[i]];
    if (prev === null || now === null) continue;
    if (prev >= overbought && now < overbought) signals.push({ index: i, kind: "sell", type: "exit" });
    else if (prev <= oversold && now > oversold) signals.push({ index: i, kind: "buy", type: "exit" });
  }
  return signals;
}

interface Pivot {
  index: number;
  kind: "high" | "low";
}

/** Topos e fundos do IFR: maior (ou menor) valor numa janela de `w` candles de cada lado. */
function pivots(values: Values, w = PIVOT_WINDOW): Pivot[] {
  const result: Pivot[] = [];
  for (let i = w; i < values.length - w; i++) {
    const v = values[i];
    const around = values.slice(i - w, i + w + 1);
    if (v === null || around.some((x) => x === null)) continue;
    const others = [...around.slice(0, w), ...around.slice(w + 1)] as number[];
    if (others.every((x) => v > x)) result.push({ index: i, kind: "high" });
    else if (others.every((x) => v < x)) result.push({ index: i, kind: "low" });
  }
  return result;
}

/**
 * Failure swings de Wilder. De topo: o IFR passa de 70 (A), recua (B), repica sem superar A (C) e
 * então perde o fundo B: venda. De fundo: o espelho abaixo de 30, com compra ao superar o topo B.
 */
export function failureSwings(values: Values, overbought = OVERBOUGHT, oversold = OVERSOLD): RsiSignal[] {
  const points = pivots(values);
  const signals: RsiSignal[] = [];
  for (let p = 0; p + 2 < points.length; p++) {
    const [a, b, c] = [points[p], points[p + 1], points[p + 2]];
    const [va, vb, vc] = [values[a.index]!, values[b.index]!, values[c.index]!];
    const top = a.kind === "high" && b.kind === "low" && c.kind === "high" && va > overbought && vc < va;
    const bottom = a.kind === "low" && b.kind === "high" && c.kind === "low" && va < oversold && vc > va;
    if (!top && !bottom) continue;
    // Confirmação: o IFR rompe o ponto B antes de voltar além de A (que desfaria o padrão).
    for (let m = c.index + 1; m < values.length; m++) {
      const v = values[m];
      if (v === null) continue;
      if (top ? v > va : v < va) break;
      if (top ? v < vb : v > vb) {
        signals.push({ index: m, kind: top ? "sell" : "buy", type: "failure" });
        break;
      }
    }
  }
  // Dois padrões podem confirmar no mesmo candle: fica um sinal só.
  return signals.filter((s, i) => signals.findIndex((o) => o.index === s.index && o.kind === s.kind) === i);
}

export interface RsiReading {
  value: number;
  zone: "overbought" | "oversold" | "upper" | "lower";
  lastExit: RsiSignal | null;
  lastFailure: RsiSignal | null;
}

/** Leitura do último candle; null se ainda não há IFR. */
export function readRsi(values: Values): RsiReading | null {
  const value = values[values.length - 1];
  if (value === null || value === undefined) return null;
  const zone = value >= OVERBOUGHT ? "overbought" : value <= OVERSOLD ? "oversold" : value >= 50 ? "upper" : "lower";
  return { value, zone, lastExit: zoneExits(values).at(-1) ?? null, lastFailure: failureSwings(values).at(-1) ?? null };
}

const STORAGE_KEY = "risktrade:rsi:v1";

/** Período do IFR (vale para todos os ativos); null = desligado. Storage bloqueado: desligado. */
export function loadRsiPeriod(): RsiPeriod | null {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return (RSI_PERIODS as readonly number[]).includes(saved) ? (saved as RsiPeriod) : null;
  } catch {
    return null;
  }
}

export function saveRsiPeriod(period: RsiPeriod | null): void {
  try {
    if (period) localStorage.setItem(STORAGE_KEY, String(period));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
