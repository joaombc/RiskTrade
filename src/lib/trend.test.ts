import { describe, expect, it } from "vitest";
import type { Bar } from "./drawings/types";
import { compareSwing, findSwings, loadTrendDegree, readTrend, trendStates } from "./trend";

/** Candles que ligam os pivôs em linha reta, `step` candles entre um e outro (máxima/mínima a ±0,5 do fechamento). */
function zigzag(pivots: number[], step = 5): Bar[] {
  const closes: number[] = [];
  pivots.forEach((p, k) => {
    if (k === 0) return closes.push(p);
    const from = pivots[k - 1];
    for (let s = 1; s <= step; s++) closes.push(from + ((p - from) * s) / step);
  });
  return closes.map((close, i) => ({ time: i * 86_400, open: close, high: close + 0.5, low: close - 0.5, close, volume: 1 }));
}

const W = 2;

describe("topos e fundos", () => {
  it("alternados e comparados com o anterior do mesmo tipo", () => {
    const bars = zigzag([100, 110, 105, 115, 108, 120, 112]);
    const swings = findSwings(bars, W);
    expect(swings.map((s) => [s.kind, s.price, s.step])).toEqual([
      ["high", 110.5, null],
      ["low", 104.5, null],
      ["high", 115.5, "higher"],
      ["low", 107.5, "higher"],
      ["high", 120.5, "higher"],
    ]);
    // Confirmado `W` candles depois.
    expect(swings[0]).toMatchObject({ index: 5, confirmedAt: 7 });
  });

  it("dois topos seguidos: fica o mais alto", () => {
    // O recuo a 102,5 entre os topos 110 e 112 não é fundo: o 102 três candles antes é mais baixo.
    const closes = [100, 101, 101.5, 102, 110, 105, 102.5, 106, 112, 107, 104, 103, 102, 101, 100];
    const bars = closes.map((close, i) => ({ time: i, open: close, high: close + 0.5, low: close - 0.5, close, volume: 1 }));
    const highs = findSwings(bars, 3).filter((s) => s.kind === "high");
    expect(highs.map((s) => s.price)).toEqual([112.5]);
  });

  it("no mesmo nível: diferença de até meio ATR", () => {
    expect(compareSwing(100.4, 100, 0.5)).toBe("equal");
    expect(compareSwing(100.6, 100, 0.5)).toBe("higher");
    expect(compareSwing(99.4, 100, 0.5)).toBe("lower");
  });
});

describe("tendência", () => {
  it("topos e fundos subindo = alta", () => {
    const bars = zigzag([100, 110, 105, 115, 110, 120, 115, 125]);
    const r = readTrend(bars, W)!;
    expect(r.trend).toBe("up");
    expect(r.broken).toBeNull();
    expect(r.lastLow!.price).toBe(114.5);
    expect(r.invalidation).toEqual({ below: 114.5, above: null });
  });

  it("topos e fundos descendo = baixa", () => {
    const bars = zigzag([125, 115, 120, 110, 115, 105, 110, 100]);
    const r = readTrend(bars, W)!;
    expect(r.trend).toBe("down");
    expect(r.invalidation).toEqual({ below: null, above: 110.5 });
  });

  it("topos e fundos no mesmo nível = lateral, com a faixa como invalidação", () => {
    const bars = zigzag([100, 110, 100, 110, 100, 110, 100, 105]);
    const r = readTrend(bars, W)!;
    expect(r.trend).toBe("lateral");
    expect(r.invalidation).toEqual({ below: 99.5, above: 110.5 });
  });

  it("fundos subindo com topos no mesmo nível ainda é alta (o topo igual é só um aviso)", () => {
    const bars = zigzag([100, 110, 103, 115, 108, 115, 111]);
    expect(readTrend(bars, W)!.trend).toBe("up");
  });

  it("topos subindo e fundos descendo (sem direção comum) = lateral", () => {
    const bars = zigzag([100, 110, 98, 114, 94, 118, 105]);
    expect(readTrend(bars, W)!.trend).toBe("lateral");
  });

  it("alta quebrada: o fechamento perde o último fundo", () => {
    // Último fundo em 114,5; a queda final fecha em 112 antes de um novo fundo se confirmar.
    const bars = zigzag([100, 110, 105, 115, 110, 120, 115, 125, 112], 5);
    const r = readTrend(bars, W)!;
    expect(r).toMatchObject({ trend: "lateral", broken: "up" });
  });

  it("a quebra vale até um novo topo ou fundo: voltar acima do fundo não reativa a alta", () => {
    // Alta com último fundo em 114,5; depois do topo 125, fecha em 113 (quebra) e volta a 116 no candle seguinte.
    const base = zigzag([100, 110, 105, 115, 110, 120, 115, 125]);
    const tail = [120, 116, 113, 116, 118, 119, 120].map((close, k) => ({
      time: (base.length + k) * 86_400, open: close, high: close + 0.5, low: close - 0.5, close, volume: 1,
    }));
    const bars = [...base, ...tail];
    const states = trendStates(bars, 4);
    const breakAt = base.length + 2;
    expect(states[breakAt - 1]).toEqual({ trend: "up", broken: null });
    // O fundo em 113 só se confirma 4 candles depois; até lá, a quebra continua valendo.
    expect(states.slice(breakAt, breakAt + 4)).toEqual(Array(4).fill({ trend: "lateral", broken: "up" }));
    expect(bars[breakAt + 1].close).toBeGreaterThan(114.5);
  });

  it("sem olhar o futuro: só vale depois de dois topos e dois fundos confirmados", () => {
    const bars = zigzag([100, 110, 105, 115, 110, 120]);
    const states = trendStates(bars, W);
    // 2º fundo no candle 20 (110 − 0,5), confirmado no 22.
    expect(states[21]).toBeNull();
    expect(states[22]).toEqual({ trend: "up", broken: null });
  });

  it("desde quando: primeiro candle da tendência atual", () => {
    const bars = zigzag([100, 110, 105, 115, 110, 120, 115, 125]);
    expect(readTrend(bars, W)!.since).toBe(22);
  });

  it("sem topos e fundos suficientes, não há leitura", () => {
    expect(readTrend(zigzag([100, 110]), W)).toBeNull();
  });
});

it("sem storage, a tendência fica desligada", () => {
  expect(loadTrendDegree()).toBeNull();
});
