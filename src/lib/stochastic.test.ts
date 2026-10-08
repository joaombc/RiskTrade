import { describe, expect, it } from "vitest";
import { fastK, readStochastic, stochastic, stochasticCrosses } from "./stochastic";

/** [máxima, mínima, fechamento] */
const bars = (rows: [number, number, number][]) => rows.map(([high, low, close]) => ({ high, low, close }));

// Caso feito à mão, período 3:
// i2: faixa 8–12, fechamento 12 → 100; i3: faixa 9–12, fecha 10 → 33,33; i4: faixa 9–12, fecha 9 → 0;
// i5: faixa 9–12, fecha 11 → 66,67; i6: faixa 9–13, fecha 13 → 100.
const SAMPLE = bars([
  [10, 8, 9],
  [11, 9, 10],
  [12, 10, 12],
  [12, 9, 10],
  [11, 9, 9],
  [12, 10, 11],
  [13, 11, 13],
]);

describe("estocástico", () => {
  it("%K rápido: posição do fechamento na faixa dos últimos N candles", () => {
    const k = fastK(SAMPLE, 3);
    expect(k.slice(0, 2)).toEqual([null, null]);
    expect(k[2]).toBeCloseTo(100);
    expect(k[3]).toBeCloseTo(33.333, 2);
    expect(k[4]).toBeCloseTo(0);
    expect(k[5]).toBeCloseTo(66.667, 2);
    expect(k[6]).toBeCloseTo(100);
  });

  it("versão lenta: %K = média de 3 do rápido, %D = média de 3 do %K", () => {
    const { k, d } = stochastic(SAMPLE, 3);
    // %K: (100 + 33,33 + 0) ÷ 3 = 44,44; (33,33 + 0 + 66,67) ÷ 3 = 33,33; (0 + 66,67 + 100) ÷ 3 = 55,56.
    expect(k[4]).toBeCloseTo(44.444, 2);
    expect(k[5]).toBeCloseTo(33.333, 2);
    expect(k[6]).toBeCloseTo(55.556, 2);
    // %D: (44,44 + 33,33 + 55,56) ÷ 3 = 44,44.
    expect(d.slice(0, 6).every((v) => v === null)).toBe(true);
    expect(d[6]).toBeCloseTo(44.444, 2);
  });

  it("faixa sem variação dá 50", () => {
    expect(fastK(bars([[5, 5, 5], [5, 5, 5]]), 2)[1]).toBe(50);
  });
});

describe("cruzamentos e sinais", () => {
  it("marca como sinal só os cruzamentos nas zonas extremas (pelo %D)", () => {
    const lines = {
      k: [10, 12, 30, 60, 85, 90, 78, 60],
      d: [15, 15, 15, 40, 82, 85, 84, 70],
    };
    expect(stochasticCrosses(lines)).toEqual([
      { index: 2, dir: "up", signal: "buy" },
      { index: 6, dir: "down", signal: "sell" },
    ]);
  });

  it("cruzamento no meio da faixa não é sinal", () => {
    expect(stochasticCrosses({ k: [40, 60], d: [50, 50] })).toEqual([{ index: 1, dir: "up", signal: null }]);
  });
});

describe("leitura", () => {
  it("zona pelo %D, último cruzamento e último sinal", () => {
    const reading = readStochastic({ k: [10, 12, 30, 60, 55, 48], d: [15, 15, 15, 40, 50, 52] })!;
    expect(reading).toEqual({
      k: 48,
      d: 52,
      zone: "upper",
      lastCross: { index: 5, dir: "down", signal: null },
      lastSignal: { index: 2, dir: "up", signal: "buy" },
    });
  });

  it("sem %K e %D no último candle, não há leitura", () => {
    expect(readStochastic({ k: [null], d: [null] })).toBeNull();
  });
});
