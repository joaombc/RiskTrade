import { describe, expect, it } from "vitest";
import type { Bar } from "./drawings/types";
import { defaultBoxSize, pfRows, pointFigure, readPointFigure, stepBoxSize } from "./pointFigure";

const DAY = 86_400;
/** Candles a partir de [máxima, mínima], um por dia (abertura e fechamento no meio). */
const bars = (hl: [number, number][], start = Date.UTC(2026, 0, 5) / 1000): Bar[] =>
  hl.map(([high, low], i) => ({ time: start + i * DAY, open: (high + low) / 2, high, low, close: (high + low) / 2, volume: 1 }));

// Caixa 1, reversão 3. Começa em 10.
const SEQUENCE: [number, number][] = [
  [10, 10], // 0: referência
  [13, 11], // 1: +3 caixas → coluna de X 10–13
  [14, 12], // 2: X até 14
  [14, 12], // 3: nem estende nem reverte (precisaria de 11)
  [13, 11], // 4: reversão de 3 → O de 13 a 11
  [10, 9], //  5: O até 9
  [12, 10], // 6: +3 a partir de 9 → X de 10 a 12
  [15, 12], // 7: X até 15 → passa o topo do X anterior (14): compra em 15
  [14, 11], // 8: reversão → O de 14 a 11
  [10, 8], //  9: O até 8 → perde o fundo do O anterior (9): venda em 8
];

describe("ponto e figura (reversão de 3 caixas)", () => {
  const pf = pointFigure(bars(SEQUENCE), 1);

  it("colunas alternadas de X e O pelo método máxima/mínima", () => {
    expect(pf.columns.map((c) => [c.kind, c.low, c.high])).toEqual([
      ["X", 10, 14],
      ["O", 9, 13],
      ["X", 10, 15],
      ["O", 8, 14],
    ]);
    // Caixas na ordem do preenchimento, com o candle de cada uma.
    expect(pf.columns[1].boxes.map((b) => [b.level, b.index])).toEqual([
      [13, 4],
      [12, 4],
      [11, 4],
      [10, 5],
      [9, 5],
    ]);
  });

  it("compra: X acima do topo do X anterior; venda: O abaixo do fundo do O anterior", () => {
    expect(pf.signals).toEqual([
      { kind: "buy", column: 2, level: 15, index: 7 },
      { kind: "sell", column: 3, level: 8, index: 9 },
    ]);
  });

  it("numa coluna de X, estender tem prioridade sobre reverter no mesmo candle", () => {
    const wide = pointFigure(bars([[10, 10], [13, 11], [15, 10]]), 1);
    expect(wide.columns.map((c) => [c.kind, c.low, c.high])).toEqual([["X", 10, 15]]);
  });

  it("o mês aparece na primeira caixa de cada mês (1–9, A, B, C)", () => {
    // Dezembro e depois janeiro.
    const pfMonths = pointFigure(bars([[10, 10], [13, 11], [16, 13]], Date.UTC(2025, 11, 30) / 1000), 1);
    const months = pfMonths.columns[0].boxes.filter((b) => b.month).map((b) => [b.level, b.month]);
    expect(months).toEqual([
      [10, "C"],
      [14, "1"],
    ]);
  });

  it("leitura: coluna atual, último sinal e os níveis do próximo sinal", () => {
    expect(readPointFigure(pf)).toEqual({
      current: pf.columns[3],
      lastSignal: { kind: "sell", column: 3, level: 8, index: 9 },
      // Próxima coluna de X precisa passar 15 (topo do último X): compra em 16.
      buy: { price: 16, triggered: false },
      // A coluna de O atual já perdeu o fundo do O anterior (9).
      sell: { price: 8, triggered: true },
    });
  });

  it("sem candles ou sem movimento de 3 caixas, não há colunas", () => {
    expect(pointFigure([], 1).columns).toEqual([]);
    expect(readPointFigure(pointFigure(bars([[10, 10], [11, 9]]), 1))).toBeNull();
  });
});

describe("tamanho da caixa", () => {
  it("padrão pela tabela tradicional e ~1% fora dela", () => {
    expect([3, 12, 50, 150, 336].map(defaultBoxSize)).toEqual([0.25, 0.5, 1, 2, 4]);
    expect(defaultBoxSize(0.5)).toBe(0.005);
    expect(defaultBoxSize(98_000)).toBe(1000);
  });

  it("− / + andam pela escala de tamanhos redondos", () => {
    expect(stepBoxSize(4, 1)).toBe(5);
    expect(stepBoxSize(5, 1)).toBe(10);
    expect(stepBoxSize(1, -1)).toBe(0.5);
    expect(stepBoxSize(0.25, 1)).toBe(0.4);
  });

  it("linhas do gráfico: da mínima à máxima do período", () => {
    expect(pfRows(bars(SEQUENCE), 1)).toBe(8);
    expect(pfRows(bars(SEQUENCE), 2)).toBe(4);
  });
});
