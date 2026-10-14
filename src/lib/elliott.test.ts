import { describe, expect, it } from "vitest";
import type { Bar } from "./drawings/types";
import { buildCount, elliottCounts, ratioFit } from "./elliott";
import { findSwings } from "./trend";

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
const counts = (pivots: number[]) => {
  const bars = zigzag(pivots);
  return elliottCounts(bars, findSwings(bars, W));
};
const sw = (kind: "low" | "high", price: number, index: number) => ({ kind, price, index });

// Impulso de livro: onda 2 ≈ 0,6 da 1; onda 3 ≈ 1,6 × a 1; onda 4 ≈ 0,4 da 3; onda 5 ≈ a 1. O 106 inicial faz do 100 um
// fundo confirmado (o início da onda 1); o último pivô só confirma o topo da 5.
const IMPULSE = [106, 100, 110, 104, 120.2, 114, 124, 122];

describe("contagem de Elliott", () => {
  it("impulso completo: ondas 0 a 5, regras respeitadas, e o preço agora na onda A", () => {
    const [best] = counts(IMPULSE);
    expect(best.direction).toBe("up");
    expect(best.points.map((p) => [p.label, p.price])).toEqual([
      ["0", 99.5],
      ["1", 110.5],
      ["2", 103.5],
      ["3", 120.7],
      ["4", 113.5],
      ["5", 124.5],
    ]);
    expect(best.current).toBe("A");
    expect(best.rules).toEqual({ wave2: true, wave3: true, wave4: true });
    expect(best.ratios.map((r) => [r.key, +r.value.toFixed(2)])).toEqual([
      ["wave2", 0.64],
      ["wave3", 1.56],
      ["wave4", 0.42],
      ["wave5", 1],
    ]);
    expect(best.fit).toBeGreaterThan(0.9);
    // Na onda A: retrações do impulso inteiro (99,5 → 124,5); a contagem cai se o preço passar o topo da 5.
    expect(best.levels.map((l) => [l.ratio, +l.price.toFixed(2)])).toEqual([
      [0.618, 109.05],
      [0.5, 112],
      [0.382, 114.95],
    ]);
    expect(best.invalidation).toEqual({ price: 124.5, side: "above" });
  });

  it("na onda 4: retrações da onda 3 e invalidação no topo da onda 1", () => {
    const [best] = counts([106, 100, 110, 104, 120.2, 117]);
    expect(best.points.map((p) => p.label)).toEqual(["0", "1", "2", "3"]);
    expect(best.current).toBe("4");
    expect(best.levels.map((l) => l.ratio)).toEqual([0.618, 0.5, 0.382, 0.236]);
    expect(best.invalidation).toEqual({ price: 110.5, side: "below" });
  });

  it("baixa: o mesmo desenho espelhado, com a invalidação do outro lado", () => {
    const [best] = counts(IMPULSE.map((p) => 200 - p));
    expect(best.direction).toBe("down");
    expect(best.current).toBe("A");
    expect(best.invalidation).toEqual({ price: 75.5, side: "below" });
  });

  it("contagem já derrubada pelo preço fica de fora", () => {
    // Na onda 4, o fechamento cai a 109, abaixo do topo da onda 1 (110,5).
    const list = counts([106, 100, 110, 104, 120.2, 109]);
    expect(list.some((c) => c.points.length === 4 && c.current === "4")).toBe(false);
  });

  it("correção depois do impulso: A e B rotulados, preço na onda C com alvos C = A e 1,618 × A", () => {
    const [best] = counts([...IMPULSE.slice(0, -1), 114, 119, 117]);
    expect(best.points.map((p) => p.label)).toEqual(["0", "1", "2", "3", "4", "5", "A", "B"]);
    expect(best.current).toBe("C");
    expect(best.levels.map((l) => l.ratio)).toEqual([1.618, 1]);
  });
});

describe("ponto provisório", () => {
  it("o extremo depois do último topo entra como ponto em formação quando é o único jeito de contar", () => {
    // Impulso de 1 e 2 confirmados (fundo 99,5, topo 110,5); a correção até 104 ainda não virou fundo confirmado.
    const bars = zigzag([106, 100, 110, 104]);
    const [best] = elliottCounts(bars, findSwings(bars, W));
    expect(best.points.map((p) => [p.label, p.price, p.provisional ?? false])).toEqual([
      ["0", 99.5, false],
      ["1", 110.5, false],
      ["2", 103.5, true],
    ]);
    expect(best.current).toBe("3");
  });

  it("no empate, a contagem só com pontos confirmados vem antes", () => {
    const [best] = counts(IMPULSE);
    expect(best.points.some((p) => p.provisional)).toBe(false);
  });
});

describe("regras", () => {
  it("onda 4 no território da onda 1 derruba a contagem", () => {
    expect(buildCount([sw("low", 100, 0), sw("high", 110, 5), sw("low", 104, 10), sw("high", 120, 15), sw("low", 108, 20)], 5)).toBeNull();
  });

  it("onda 2 além do início da onda 1 derruba a contagem", () => {
    expect(buildCount([sw("low", 100, 0), sw("high", 110, 5), sw("low", 99, 10)], 3)).toBeNull();
  });

  it("onda 3 a mais curta derruba a contagem", () => {
    const swings = [sw("low", 100, 0), sw("high", 110, 5), sw("low", 105, 10), sw("high", 113, 15), sw("low", 111, 20), sw("high", 122, 25)];
    // Onda 1 = 10, onda 3 = 8, onda 5 = 11.
    expect(buildCount(swings, 6)).toBeNull();
  });

  it("encaixe: 1 na proporção ideal ou dentro da faixa, caindo com o erro", () => {
    expect(ratioFit(1.618, 1.618)).toBe(1);
    expect(ratioFit(0.55, [0.5, 0.618])).toBe(1);
    expect(ratioFit(0.25, [0.5, 0.618])).toBe(0.5);
    expect(ratioFit(5, 1)).toBe(0);
  });
});
