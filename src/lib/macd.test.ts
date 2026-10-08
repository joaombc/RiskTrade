import { describe, expect, it } from "vitest";
import { ema } from "./indicators";
import { macd, macdCrosses, readMacd } from "./macd";

const bars = (closes: number[]) => closes.map((close) => ({ close }));

describe("MACD", () => {
  it("caso feito à mão (2, 3, 2): numa reta, o MACD fica constante e o histograma zera", () => {
    // MME 2 de 1..6: –, 1,5, 2,5, 3,5, 4,5, 5,5. MME 3: –, –, 2, 3, 4, 5. MACD = 0,5 a partir do 3º candle.
    const { macd: line, signal, histogram } = macd(bars([1, 2, 3, 4, 5, 6]), [], 2, 3, 2);
    expect(line).toEqual([null, null, 0.5, 0.5, 0.5, 0.5]);
    expect(signal).toEqual([null, null, null, 0.5, 0.5, 0.5]);
    expect(histogram).toEqual([null, null, null, 0, 0, 0]);
  });

  it("MACD = MME rápida − MME lenta; sinal = MME do MACD; histograma = MACD − sinal", () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + 10 * Math.sin(i / 6) + i * 0.2);
    const { macd: line, signal, histogram } = macd(bars(closes));
    const fast = ema(closes, 12);
    const slow = ema(closes, 26);
    expect(line[40]).toBeCloseTo(fast[40]! - slow[40]!);
    expect(line[24]).toBeNull();
    // O MACD começa no candle 25 (índice da MME 26); o sinal, 8 candles depois.
    expect(signal[32]).toBeNull();
    expect(signal[33]).toBeCloseTo(line.slice(25, 34).reduce((a, b) => a! + b!, 0)! / 9);
    expect(histogram[50]).toBeCloseTo(line[50]! - signal[50]!);
  });

  it("os fechamentos anteriores ao período adiantam as linhas", () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + i);
    const full = macd(bars(closes));
    const split = macd(bars(closes.slice(40)), closes.slice(0, 40));
    expect(split.macd[0]).toBeCloseTo(full.macd[40]!);
    expect(split.signal[0]).toBeCloseTo(full.signal[40]!);
  });
});

describe("cruzamentos e leitura", () => {
  const lines = {
    macd: [-2, -1.5, -1, -0.4, 0.3, 1, 1.4, 1.5, 1.3],
    signal: [-1, -1, -1, -0.8, -0.3, 0.3, 0.8, 1.2, 1.4],
    histogram: [-1, -0.5, 0, 0.4, 0.6, 0.7, 0.6, 0.3, -0.1],
  };

  it("cruzamento com o sinal = histograma cruzando o zero, com a posição do MACD", () => {
    expect(macdCrosses(lines)).toEqual([
      { index: 3, dir: "up", aboveZero: false },
      { index: 8, dir: "down", aboveZero: true },
    ]);
  });

  it("leitura: valores, histograma e cruzamentos", () => {
    expect(readMacd(lines)).toEqual({
      macd: 1.3,
      signal: 1.4,
      histogram: -0.1,
      widening: true,
      streak: 1,
      lastCross: { index: 8, dir: "down", aboveZero: true },
      lastZeroCross: { index: 4, dir: "up" },
    });
  });

  it("sem as três séries no último candle, não há leitura", () => {
    expect(readMacd({ macd: [1], signal: [null], histogram: [null] })).toBeNull();
  });
});
