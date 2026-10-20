import { describe, expect, it } from "vitest";
import { backtest, optimize, PARAM_GRID, systemSignals, type SystemSignal } from "./backtest";
import type { Bar } from "./drawings/types";

/** Candles com abertura e fechamento dados (máxima e mínima nos extremos dos dois). */
const bars = (prices: [number, number][]): Bar[] =>
  prices.map(([open, close], i) => ({ time: i, open, close, high: Math.max(open, close), low: Math.min(open, close), volume: 1 }));

describe("backtest", () => {
  const series = bars([
    [100, 100],
    [100, 100], // sinal de compra aqui
    [110, 120], // compra na abertura: 110
    [120, 130], // sinal de venda aqui
    [121, 100], // vira vendido na abertura: 121
    [100, 90],
  ]);
  const signals: SystemSignal[] = [
    { index: 1, kind: "buy" },
    { index: 3, kind: "sell" },
  ];

  it("executa na abertura do candle seguinte ao sinal, sem custos", () => {
    const result = backtest(series, signals, { mode: "longShort", costPercent: 0 });
    expect(result.trades).toHaveLength(2);
    expect(result.trades[0]).toMatchObject({ direction: 1, entryIndex: 2, entryPrice: 110, exitIndex: 4, exitPrice: 121, open: false });
    expect(result.trades[0].returnPercent).toBeCloseTo(10);
    // Vendido de 121 a 90 (fechamento do último candle): ganho de 31/121, ainda aberta.
    expect(result.trades[1]).toMatchObject({ direction: -1, entryPrice: 121, open: true });
    expect(result.trades[1].returnPercent).toBeCloseTo((31 / 121) * 100);
    expect(result.totalReturn).toBeCloseTo((1.1 * (1 + 31 / 121) - 1) * 100);
    expect(result.winRate).toBe(100);
    expect(result.profitFactor).toBeNull();
    expect(result.buyHoldReturn).toBeCloseTo(-10);
    expect(result.exposure).toBeCloseTo(4 / 6);
  });

  it("só comprado: o sinal de venda zera a posição", () => {
    const result = backtest(series, signals, { mode: "longOnly", costPercent: 0 });
    expect(result.trades).toHaveLength(1);
    expect(result.equity.at(-1)).toBeCloseTo(1.1);
  });

  it("custos descontados na entrada e na saída", () => {
    const result = backtest(series, signals, { mode: "longOnly", costPercent: 1 });
    expect(result.trades[0].returnPercent).toBeCloseTo((0.99 * 1.1 * 0.99 - 1) * 100);
  });

  it("fator de lucro em capital: ganhos ÷ perdas, coerente com o retorno total", () => {
    // +50% com 1 de capital (ganho 0,5) e depois −40% com 1,5 (perda 0,6): perdeu no total.
    const result = backtest(
      bars([[100, 100], [100, 100], [100, 150], [150, 150], [150, 100], [100, 100], [100, 60], [60, 60]]),
      [
        { index: 1, kind: "buy" },
        { index: 3, kind: "exit" },
        { index: 4, kind: "buy" },
        { index: 6, kind: "exit" },
      ],
      { mode: "longOnly", costPercent: 0 },
    );
    expect(result.trades.map((t) => t.returnPercent)).toEqual([expect.closeTo(50), expect.closeTo(-40)]);
    expect(result.totalReturn).toBeCloseTo(-10);
    expect(result.profitFactor).toBeCloseTo(0.5 / 0.6);
  });

  it("drawdown: maior queda desde um pico", () => {
    const result = backtest(bars([[100, 100], [100, 100], [100, 150], [150, 75], [75, 120]]), [{ index: 0, kind: "buy" }], {
      mode: "longOnly",
      costPercent: 0,
    });
    expect(result.maxDrawdown).toBeCloseTo(50);
    expect(result.trades[0].open).toBe(true);
  });

  it("sinal no último candle não é executado", () => {
    expect(backtest(series, [{ index: 5, kind: "buy" }]).trades).toHaveLength(0);
  });
});

describe("sistemas e otimização", () => {
  // Onda de 120 candles (uma reta faria o histograma do MACD ficar em zero): os sistemas de
  // tendência acertam as viradas com atraso.
  const wave = Array.from({ length: 240 }, (_, i) => 100 + 20 * Math.sin((2 * Math.PI * i) / 120));
  const series = bars(wave.map((c, i) => [i === 0 ? c : wave[i - 1], c]));

  it("cada sistema gera sinais nas viradas", () => {
    for (const id of ["maCross", "fourWeek", "sar", "macd"] as const) {
      const signals = systemSignals(id, PARAM_GRID[id][0], series);
      expect(signals.length, id).toBeGreaterThan(0);
      expect(signals.map((s) => s.kind)).toContain("sell");
    }
  });

  it("otimização: uma linha por combinação, do maior retorno para o menor", () => {
    const rows = optimize("maCross", series, [], { mode: "longShort", costPercent: 0 });
    expect(rows).toHaveLength(PARAM_GRID.maCross.length);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].result.totalReturn).toBeGreaterThanOrEqual(rows[i].result.totalReturn);
  });

  it("grade da regra das 4 semanas: saída nunca maior que a entrada, sem repetir", () => {
    expect(PARAM_GRID.fourWeek).toEqual([
      { entry: 10, exit: 10 },
      { entry: 10, exit: 5 },
      { entry: 20, exit: 20 },
      { entry: 20, exit: 10 },
      { entry: 20, exit: 5 },
      { entry: 40, exit: 40 },
      { entry: 40, exit: 10 },
      { entry: 40, exit: 5 },
    ]);
  });
});
