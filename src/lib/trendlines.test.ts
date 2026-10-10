import { describe, expect, it } from "vitest";
import type { Bar } from "./drawings/types";
import { findSwings, type LabeledSwing } from "./trend";
import { findTrendLines, lineAt, trendLinesToDrawings } from "./trendlines";

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

describe("linhas de tendência", () => {
  it("alta com fundos alinhados: LTA principal com 3 toques e o canal pelos topos", () => {
    // Fundos 104,5 / 109,5 / 114,5 a cada 10 candles: alinhados. Topos 110,5 / 115,5 / 120,5 / 125,5 também.
    const bars = zigzag([100, 110, 105, 115, 110, 120, 115, 125, 122]);
    const lines = findTrendLines(bars, findSwings(bars, W), "up");
    const main = lines.find((l) => l.role === "main")!;
    expect(main).toMatchObject({ side: "support", from: { index: 10, price: 104.5 }, through: { index: 20, price: 109.5 }, touches: 3 });
    expect(main.now).toBeCloseTo(lineAt(main.from, main.through, bars.length - 1));
    // Os dois últimos fundos estão na mesma reta: não há linha "recente" mais inclinada.
    expect(lines.some((l) => l.role === "recent")).toBe(false);
    const channel = lines.find((l) => l.role === "channel")!;
    expect(channel.touches).toBeGreaterThanOrEqual(3);
    // Topo 115,5 no candle 15, onde a LTA vale 107: o canal fica 8,5 acima dela.
    expect(channel.from.price - main.from.price).toBeCloseTo(8.5);
  });

  it("os dois últimos fundos mais inclinados que a principal viram a linha recente", () => {
    // Fundos 104,5 / 106,5 / 108,5 (alinhados, devagar) e depois 114,5: aceleração.
    const bars = zigzag([100, 110, 105, 112, 107, 114, 109, 122, 115, 126, 124]);
    const lines = findTrendLines(bars, findSwings(bars, W), "up");
    const main = lines.find((l) => l.role === "main")!;
    const recent = lines.find((l) => l.role === "recent")!;
    expect(main.touches).toBe(3);
    expect(recent.from.price).toBe(108.5);
    expect(recent.through.price).toBe(114.5);
  });

  it("sem canal quando o último topo já não alcança a paralela", () => {
    // Fundos alinhados (104,5 / 109,5 / 114,5); o último topo (121,5) fica 4 abaixo da paralela (125,5).
    const bars = zigzag([100, 110, 105, 115, 110, 120, 115, 121, 120]);
    const lines = findTrendLines(bars, findSwings(bars, W), "up");
    expect(lines.some((l) => l.role === "main")).toBe(true);
    expect(lines.some((l) => l.role === "channel")).toBe(false);
  });

  it("uma reta que algum fechamento atravessou não vale", () => {
    const closes = [100, 99, 100, 102, 104, 103, 101, 100.5, 101, 103, 105, 107, 106, 108, 110];
    const bars: Bar[] = closes.map((close, i) => ({ time: i, open: close, high: close + 0.5, low: close - 0.5, close, volume: 1 }));
    const low = (index: number): LabeledSwing => ({ index, kind: "low", price: bars[index].low, confirmedAt: index + 2, step: null });
    // Fundos em 98,5 (1) e 105,5 (12): a reta passaria de 102 no candle 7, e o fechamento ali é 100,5.
    expect(findTrendLines(bars, [low(1), low(12)], "up")).toEqual([]);
  });

  it("baixa: LTB por topos descendentes, com o preço abaixo", () => {
    const bars = zigzag([125, 115, 120, 110, 115, 105, 110, 100, 103]);
    const main = findTrendLines(bars, findSwings(bars, W), "down").find((l) => l.role === "main")!;
    expect(main.side).toBe("resistance");
    expect(main.touches).toBe(3);
    expect(main.through.price).toBeLessThan(main.from.price);
  });

  it("lateral: suporte e resistência da faixa, com os toques no mesmo nível", () => {
    const bars = zigzag([100, 110, 100, 110, 100, 110, 100, 105]);
    const lines = findTrendLines(bars, findSwings(bars, W), "lateral");
    expect(lines.map((l) => [l.role, l.now, l.touches])).toEqual([
      ["resistance", 110.5, 3],
      ["support", 99.5, 3],
    ]);
    expect(lines[0].from.index).toBe(5);
  });

  it("copiar para os desenhos: principal com canal vira canal; faixa vira suporte/resistência", () => {
    const up = zigzag([100, 110, 105, 115, 110, 120, 115, 125, 122]);
    const upDrawings = trendLinesToDrawings(up, findTrendLines(up, findSwings(up, W), "up"));
    expect(upDrawings.map((d) => d.kind)).toEqual(["channel"]);
    expect(upDrawings[0].points[0]).toEqual({ time: 10 * 86_400, price: 104.5 });

    const side = zigzag([100, 110, 100, 110, 100, 110, 100, 105]);
    const sideDrawings = trendLinesToDrawings(side, findTrendLines(side, findSwings(side, W), "lateral"));
    expect(sideDrawings).toEqual([
      { kind: "horizontal", points: [{ time: 25 * 86_400, price: 110.5 }], options: { roleReversal: true } },
      { kind: "horizontal", points: [{ time: 30 * 86_400, price: 99.5 }], options: { roleReversal: true } },
    ]);
  });

  it("sem candles, sem linhas", () => {
    expect(findTrendLines([], [], "up")).toEqual([]);
  });
});
