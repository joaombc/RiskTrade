import { describe, expect, it } from "vitest";
import type { Bar } from "./drawings/types";
import {
  analyzeSignals,
  againstTrend,
  DEFAULT_RADAR_SETTINGS,
  loadRadarSettings,
  loadSeenSignals,
  newSignals,
  RADAR_INDICATORS,
  RADAR_RECENT_BARS,
  scoreRadar,
  signalKey,
  type RadarSignal,
} from "./radar";

const DAY = 86_400;
const bar = (i: number, close: number, high = close + 0.5, low = close - 0.5): Bar => ({ time: i * DAY, open: close, high, low, close, volume: 1000 });

/** 79 pregões andando de lado em torno de 100 e um último que fecha em 110. */
function breakout(): Bar[] {
  const flat = Array.from({ length: 79 }, (_, i) => bar(i, 100 + (i % 2 ? 0.5 : -0.5)));
  return [...flat, bar(79, 110, 111, 100)];
}

const signal = (indicator: RadarSignal["indicator"], kind: RadarSignal["kind"], barsAgo = 0): RadarSignal => ({ indicator, kind, barsAgo, time: (100 - barsAgo) * DAY });

describe("análise de um ativo", () => {
  it("rompimento da faixa no último candle: compra da regra das 4 semanas, há 0 pregões", () => {
    const a = analyzeSignals(breakout())!;
    expect(a.close).toBe(110);
    expect(a.time).toBe(79 * DAY);
    expect(a.signals).toContainEqual({ indicator: "fourWeek", kind: "buy", barsAgo: 0, time: 79 * DAY });
  });

  it("só sinais recentes, no máximo um por indicador, do mais novo para o mais antigo", () => {
    const a = analyzeSignals(breakout())!;
    expect(a.signals.every((s) => s.barsAgo < RADAR_RECENT_BARS)).toBe(true);
    const indicators = a.signals.map((s) => s.indicator);
    expect(new Set(indicators).size).toBe(indicators.length);
    expect(a.signals.map((s) => s.barsAgo)).toEqual([...a.signals.map((s) => s.barsAgo)].sort((x, y) => x - y));
  });

  it("sem histórico suficiente, não há análise", () => {
    expect(analyzeSignals(breakout().slice(0, 59))).toBeNull();
  });
});

describe("placar", () => {
  const all = RADAR_INDICATORS;

  it("compras − vendas: viés de alta com 2 ou mais", () => {
    const s = scoreRadar({ trend: "lateral", signals: [signal("macd", "buy"), signal("rsi", "buy"), signal("obv", "sell")] }, all);
    expect(s).toMatchObject({ buys: 2, sells: 1, score: 1, bias: "neutral" });
    const t = scoreRadar({ trend: "lateral", signals: [signal("macd", "buy"), signal("rsi", "buy")] }, all);
    expect(t).toMatchObject({ score: 2, bias: "bullish", strong: false });
  });

  it("sinais contra a tendência valem metade", () => {
    const down = { trend: "down" as const, signals: [signal("macd", "buy"), signal("rsi", "buy"), signal("ma", "buy")] };
    expect(scoreRadar(down, all)).toMatchObject({ buys: 3, score: 1.5, bias: "neutral" });
    expect(againstTrend(signal("macd", "buy"), "down")).toBe(true);
    expect(againstTrend(signal("macd", "sell"), "down")).toBe(false);
  });

  it("forte: 3 ou mais na direção do viés e a favor da tendência", () => {
    const up = { trend: "up" as const, signals: [signal("macd", "buy"), signal("rsi", "buy"), signal("ma", "buy")] };
    expect(scoreRadar(up, all)).toMatchObject({ score: 3, bias: "bullish", strong: true });
    const sells = { trend: "down" as const, signals: [signal("macd", "sell"), signal("rsi", "sell"), signal("obv", "sell")] };
    expect(scoreRadar(sells, all)).toMatchObject({ score: -3, bias: "bearish", strong: true });
  });

  it("só os indicadores escolhidos entram", () => {
    const a = { trend: "lateral" as const, signals: [signal("macd", "buy"), signal("rsi", "buy")] };
    expect(scoreRadar(a, ["macd"])).toMatchObject({ buys: 1, score: 1, bias: "neutral" });
  });
});

describe("sinais novos", () => {
  const results = [
    { symbol: "AAPL", signals: [signal("macd", "buy", 0), signal("rsi", "buy", 2)] },
    { symbol: "MSFT", signals: [signal("obv", "sell", 1)] },
  ];

  it("compara com os já vistos (ativo + indicador + direção + candle)", () => {
    const seen = new Set([signalKey("AAPL", results[0].signals[1]), signalKey("MSFT", results[1].signals[0])]);
    expect(newSignals(results, seen, RADAR_INDICATORS)).toEqual([{ symbol: "AAPL", signals: [results[0].signals[0]] }]);
  });

  it("ignora os indicadores desligados", () => {
    expect(newSignals(results, new Set(), ["obv"])).toEqual([{ symbol: "MSFT", signals: results[1].signals }]);
  });

  it("a chave muda com o candle: o mesmo indicador num candle novo é sinal novo", () => {
    expect(signalKey("AAPL", signal("macd", "buy", 0))).not.toBe(signalKey("AAPL", signal("macd", "buy", 1)));
  });
});

it("sem storage: preferências padrão e nada visto ainda", () => {
  expect(loadRadarSettings()).toEqual(DEFAULT_RADAR_SETTINGS);
  expect(loadSeenSignals()).toBeNull();
});
