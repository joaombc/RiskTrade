import { describe, expect, it } from "vitest";
import type { Bar } from "./drawings/types";
import { computeOBV, findDivergences, isRecent } from "./indicators";

function bars(closes: number[], volumes?: number[]): Bar[] {
  return closes.map((close, i) => ({
    time: i * 86_400,
    open: close,
    high: close + 0.5,
    low: close - 0.5,
    close,
    volume: volumes?.[i] ?? 100,
  }));
}

describe("computeOBV", () => {
  it("soma volume nas altas, subtrai nas baixas e mantém nos dias sem variação", () => {
    expect(computeOBV(bars([10, 11, 10.5, 10.5, 12], [500, 100, 200, 300, 400]))).toEqual([0, 100, -100, -100, 300]);
  });
});

describe("findDivergences", () => {
  // Dois topos (índices 5 e 15) com o 2º mais alto. Rodada A: a alta até o 2º topo vem
  // com volume forte (OBV confirma). Rodada B: a mesma alta com volume fraco (OBV não confirma).
  const closes = [10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 11, 12, 13, 14, 16, 15, 14, 13, 12, 11];
  const strong = closes.map((_, i) => (i >= 11 && i <= 15 ? 300 : 100));
  const weak = closes.map((_, i) => (i >= 11 && i <= 15 ? 30 : 100));

  it("não acusa divergência quando o OBV confirma o novo topo", () => {
    const b = bars(closes, strong);
    expect(findDivergences(b, computeOBV(b))).toEqual([]);
  });

  it("acusa divergência baixista: topo mais alto no preço com OBV mais baixo", () => {
    const b = bars(closes, weak);
    const [div] = findDivergences(b, computeOBV(b));
    expect(div).toMatchObject({ kind: "bearish", from: 5, to: 15, priceFrom: 15.5, priceTo: 16.5 });
    expect(div.obvTo).toBeLessThan(div.obvFrom);
  });

  it("não acusa divergência quando o OBV confirma o topo um candle antes do preço", () => {
    // No topo exato do preço (15) o OBV está abaixo do topo anterior (5), mas no candle 14
    // ele já tinha superado: o fluxo confirmou, só que com um dia de diferença.
    const obv = closes.map(() => 0);
    obv[5] = 1000;
    obv[14] = 1200;
    obv[15] = 900;
    expect(findDivergences(bars(closes), obv)).toEqual([]);
  });

  it("acusa divergência altista: fundo mais baixo no preço com OBV mais alto", () => {
    const inverted = closes.map((c) => 30 - c);
    const b = bars(inverted, weak);
    const [div] = findDivergences(b, computeOBV(b));
    expect(div).toMatchObject({ kind: "bullish", from: 5, to: 15, priceFrom: 14.5, priceTo: 13.5 });
    expect(div.obvTo).toBeGreaterThan(div.obvFrom);
  });
});

describe("isRecent", () => {
  it("considera recente o sinal nas últimas barras", () => {
    const div = { kind: "bearish" as const, from: 5, to: 90, priceFrom: 1, priceTo: 2, obvFrom: 2, obvTo: 1 };
    expect(isRecent(div, 100)).toBe(true);
    expect(isRecent({ ...div, to: 50 }, 100)).toBe(false);
  });
});
