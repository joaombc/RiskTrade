import { bollinger, readBollinger } from "./bollinger";
import type { Bar } from "./drawings/types";
import { computeOBV, findDivergences } from "./indicators";
import { macd, macdCrosses } from "./macd";
import { momentum, zeroCrossings } from "./momentum";
import { computeMovingAverage, findCrossSignals } from "./movingAverages";
import { defaultBoxSize, pointFigure } from "./pointFigure";
import { channelSystem, FOUR_WEEKS } from "./priceChannel";
import { failureSwings, rsi, zoneExits } from "./rsi";
import { stochastic, stochasticCrosses } from "./stochastic";
import { readTrend, trendStates, TREND_WINDOWS, type Trend } from "./trend";
import { williamsExits, williamsR } from "./williamsR";

/**
 * Radar de sinais: roda os indicadores do app sobre os candles diários de um ativo e junta os
 * sinais de compra e venda recentes, com os parâmetros clássicos de Murphy. Mostra a confluência
 * dos sinais técnicos; não é recomendação de investimento. Cálculos puros.
 */

export const RADAR_INDICATORS = [
  "ma",
  "macd",
  "rsi",
  "stochastic",
  "williams",
  "momentum",
  "bollinger",
  "trend",
  "pointFigure",
  "fourWeek",
  "obv",
] as const;
export type RadarIndicator = (typeof RADAR_INDICATORS)[number];

/** Sinais nos últimos 5 pregões (uma semana) contam como recentes. */
export const RADAR_RECENT_BARS = 5;

export interface RadarSignal {
  indicator: RadarIndicator;
  kind: "buy" | "sell";
  /** Pregões desde o sinal (0 = último candle). */
  barsAgo: number;
  /** Horário do candle do sinal (unix, segundos): identifica o sinal entre varreduras. */
  time: number;
  /** Variante do sinal, quando o indicador tem mais de uma (IFR: saída da zona ou failure swing). */
  detail?: "exit" | "failure";
}

export interface RadarAnalysis {
  close: number;
  /** Horário do último candle. */
  time: number;
  /** Tendência intermediária pelos topos e fundos (Murphy, cap. 4); null sem histórico suficiente. */
  trend: Trend | null;
  signals: RadarSignal[];
}

type Hit = { index: number; kind: "buy" | "sell"; detail?: RadarSignal["detail"] };

/** Os sinais de cada indicador, em índices dos candles. */
function hitsByIndicator(bars: Bar[], warmup: number[]): Record<RadarIndicator, Hit[]> {
  const sma = (period: number) => computeMovingAverage(bars, { kind: "sma", period }, warmup);
  const rsiValues = rsi(bars, 14, warmup);
  const bands = bollinger(bars, warmup);
  const target = readBollinger(bars, bands)?.target;
  const states = trendStates(bars, TREND_WINDOWS.intermediate);
  const trendChanges: Hit[] = [];
  states.forEach((s, i) => {
    const before = states[i - 1];
    if (!s || !before || s.trend === before.trend || s.trend === "lateral") return;
    trendChanges.push({ index: i, kind: s.trend === "up" ? "buy" : "sell" });
  });
  const pf = pointFigure(bars, defaultBoxSize(bars[bars.length - 1].close));

  return {
    ma: findCrossSignals([
      { period: 10, values: sma(10) },
      { period: 50, values: sma(50) },
    ]).flatMap((s) => (s.kind === "buy" || s.kind === "sell" ? [{ index: s.index, kind: s.kind }] : [])),
    macd: macdCrosses(macd(bars, warmup)).map((c) => ({ index: c.index, kind: c.dir === "up" ? "buy" : "sell" })),
    rsi: [
      ...zoneExits(rsiValues).map((s) => ({ index: s.index, kind: s.kind, detail: "exit" as const })),
      ...failureSwings(rsiValues).map((s) => ({ index: s.index, kind: s.kind, detail: "failure" as const })),
    ],
    stochastic: stochasticCrosses(stochastic(bars, 14)).flatMap((c) => (c.signal ? [{ index: c.index, kind: c.signal }] : [])),
    williams: williamsExits(williamsR(bars, 14)).map((s) => ({ index: s.index, kind: s.kind })),
    momentum: zeroCrossings(momentum(bars, 10, warmup)).map((c) => ({ index: c.index, kind: c.dir === "up" ? "buy" : "sell" })),
    // Cruzamento da média vindo da banda oposta: o caso clássico das bandas (Murphy, cap. 9).
    bollinger: target?.fromBand ? [{ index: target.crossIndex, kind: target.direction === "up" ? "buy" : "sell" }] : [],
    trend: trendChanges,
    pointFigure: pf.signals.map((s) => ({ index: s.index, kind: s.kind })),
    fourWeek: channelSystem(bars, FOUR_WEEKS).flatMap((s) => (s.kind === "exit" ? [] : [{ index: s.index, kind: s.kind }])),
    obv: findDivergences(bars, computeOBV(bars)).map((d) => ({ index: d.to, kind: d.kind === "bullish" ? "buy" : "sell" })),
  };
}

/** Sinais dos últimos RADAR_RECENT_BARS pregões de cada indicador; null com menos de 60 candles. */
export function analyzeSignals(bars: Bar[], warmup: number[] = []): RadarAnalysis | null {
  if (bars.length < 60) return null;
  const last = bars.length - 1;
  const signals: RadarSignal[] = [];
  const hits = hitsByIndicator(bars, warmup);
  for (const indicator of RADAR_INDICATORS) {
    // Por indicador, vale o sinal mais recente da janela (um cruzamento que já se desfez não conta duas vezes).
    const recent = hits[indicator].filter((h) => last - h.index < RADAR_RECENT_BARS).sort((a, b) => b.index - a.index)[0];
    if (!recent) continue;
    signals.push({
      indicator,
      kind: recent.kind,
      barsAgo: last - recent.index,
      time: bars[recent.index].time,
      ...(recent.detail ? { detail: recent.detail } : {}),
    });
  }
  return {
    close: bars[last].close,
    time: bars[last].time,
    trend: readTrend(bars, TREND_WINDOWS.intermediate)?.trend ?? null,
    signals: signals.sort((a, b) => a.barsAgo - b.barsAgo),
  };
}

/** Resultado de um ativo na API do radar: a análise, ou erro ao buscar o histórico. */
export type RadarItem = { symbol: string; analysis: RadarAnalysis | null } | { symbol: string; error: true };

export type RadarBias = "bullish" | "bearish" | "neutral";

export interface RadarScore {
  buys: number;
  sells: number;
  /** Compras − vendas, com os sinais contra a tendência valendo metade. */
  score: number;
  bias: RadarBias;
  /** 3 ou mais sinais na direção do viés e a favor da tendência. */
  strong: boolean;
}

/** Sinal contra a tendência intermediária (compra na baixa, venda na alta). */
export const againstTrend = (signal: RadarSignal, trend: Trend | null) =>
  (signal.kind === "buy" && trend === "down") || (signal.kind === "sell" && trend === "up");

/** Placar com os indicadores escolhidos: viés de alta com score ≥ 2, de baixa com ≤ −2. */
export function scoreRadar(analysis: Pick<RadarAnalysis, "signals" | "trend">, enabled: readonly RadarIndicator[]): RadarScore {
  const active = analysis.signals.filter((s) => enabled.includes(s.indicator));
  const weight = (s: RadarSignal) => (againstTrend(s, analysis.trend) ? 0.5 : 1);
  const buys = active.filter((s) => s.kind === "buy");
  const sells = active.filter((s) => s.kind === "sell");
  const score = buys.reduce((t, s) => t + weight(s), 0) - sells.reduce((t, s) => t + weight(s), 0);
  const bias: RadarBias = score >= 2 ? "bullish" : score <= -2 ? "bearish" : "neutral";
  const withTrend = (bias === "bullish" ? buys : bias === "bearish" ? sells : []).filter((s) => !againstTrend(s, analysis.trend));
  return { buys: buys.length, sells: sells.length, score, bias, strong: withTrend.length >= 3 };
}

/** Identifica um sinal entre varreduras: ativo, indicador, direção e candle. */
export const signalKey = (symbol: string, s: RadarSignal) => `${symbol}|${s.indicator}|${s.kind}|${s.time}`;

/** Sinais (dos indicadores escolhidos) que ainda não estavam em `seen`. */
export function newSignals(
  results: { symbol: string; signals: RadarSignal[] }[],
  seen: ReadonlySet<string>,
  enabled: readonly RadarIndicator[],
): { symbol: string; signals: RadarSignal[] }[] {
  return results
    .map((r) => ({ symbol: r.symbol, signals: r.signals.filter((s) => enabled.includes(s.indicator) && !seen.has(signalKey(r.symbol, s))) }))
    .filter((r) => r.signals.length > 0);
}

// ─── Preferências (navegador) ──────────────────────────────────────────────────

export const RADAR_INTERVALS = [5, 15, 30, 60] as const;
export type RadarInterval = (typeof RADAR_INTERVALS)[number];

export interface RadarSettings {
  indicators: RadarIndicator[];
  /** Minutos entre as varreduras. */
  interval: RadarInterval;
}

export const DEFAULT_RADAR_SETTINGS: RadarSettings = { indicators: [...RADAR_INDICATORS], interval: 15 };

const SETTINGS_KEY = "risktrade:radar:settings:v1";
const SEEN_KEY = "risktrade:radar:seen:v1";
/** Chaves vistas guardadas; as mais antigas saem primeiro. */
const MAX_SEEN = 1000;

export function loadRadarSettings(): RadarSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null") as Partial<RadarSettings> | null;
    if (!raw) return DEFAULT_RADAR_SETTINGS;
    const indicators = Array.isArray(raw.indicators) ? RADAR_INDICATORS.filter((i) => raw.indicators!.includes(i)) : DEFAULT_RADAR_SETTINGS.indicators;
    const interval = RADAR_INTERVALS.includes(raw.interval as RadarInterval) ? (raw.interval as RadarInterval) : DEFAULT_RADAR_SETTINGS.interval;
    return { indicators, interval };
  } catch {
    return DEFAULT_RADAR_SETTINGS;
  }
}

export function saveRadarSettings(settings: RadarSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}

/** Sinais já vistos; null na primeira vez (nada guardado ainda). */
export function loadSeenSignals(): Set<string> | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

export function saveSeenSignals(seen: Set<string>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-MAX_SEEN)));
  } catch {
    // Storage bloqueado: os sinais voltam a contar como novos na próxima sessão.
  }
}
