import { describe, expect, it } from "vitest";
import type { Bar } from "./drawings/types";
import { pyramidQuantity, splitUnits, trackPosition, type Position } from "./positions";

const DAY = 86_400;
/** Candles ligando os pontos em linha reta, `per` candles por perna (máxima e mínima a 0,5 do fechamento). */
function zigzag(points: number[], per = 12): Bar[] {
  const closes: number[] = [points[0]];
  for (let k = 1; k < points.length; k++) for (let j = 1; j <= per; j++) closes.push(points[k - 1] + ((points[k] - points[k - 1]) * j) / per);
  return closes.map((close, i) => ({ time: i * DAY, open: closes[i - 1] ?? close, high: close + 0.5, low: close - 0.5, close, volume: 1 }));
}
const mirror = (bars: Bar[]): Bar[] => bars.map((b) => ({ ...b, open: 400 - b.open, high: 400 - b.low, low: 400 - b.high, close: 400 - b.close }));

/** Compra no candle 24 (preço 110, depois do fundo em 110), stop 104, 1º objetivo 125, alvo 145. */
function position(over: Partial<Position> = {}): Position {
  return {
    id: "p1",
    symbol: "TEST",
    name: "Test",
    side: "long",
    currency: "USD",
    target1: 125,
    target: 145,
    units: [
      { id: "t", kind: "trading", quantity: 50, entry: 110, at: 24 * DAY, stop: 104 },
      { id: "w", kind: "trending", quantity: 50, entry: 110, at: 24 * DAY, stop: 104 },
    ],
    ...over,
  };
}

// Alta: 100 → 120 → 110 (entrada) → 130 → 122 → 140 → 133.
const UP = zigzag([100, 120, 110, 130, 122, 140, 133]);

describe("gestão da posição", () => {
  it("no 1º objetivo, as duas unidades vão para o breakeven; depois, o stop sobe abaixo dos fundos", () => {
    const t = trackPosition(position(), UP)!;
    expect(t.events.filter((e) => e.key === "target1Hit")).toHaveLength(1);
    expect(t.events.filter((e) => e.key === "breakeven").map((e) => e.unitId).sort()).toEqual(["t", "w"]);
    const [trading, trending] = t.units;
    // Os stops nunca descem e ficaram acima da entrada: posição sem risco.
    expect(trading.stop).toBeGreaterThanOrEqual(110);
    expect(trending.stop).toBeGreaterThanOrEqual(110);
    expect(t.riskFree).toBe(true);
    expect(t.openRisk).toBe(0);
    // A unidade de trading ainda está aberta depois do 1º objetivo: realizar.
    expect(t.instructions).toContainEqual({ key: "takeProfit", unitId: "t", price: 125 });
    expect(t.pnl).toBeCloseTo((133 - 110) * 100);
  });

  it("o stop móvel da unidade de trading (curto prazo) fica mais perto que o da de tendência", () => {
    const t = trackPosition(position(), UP)!;
    expect(t.units[0].stop).toBeGreaterThanOrEqual(t.units[1].stop);
  });

  it("preço perde o stop: instrução de vender, com o preço provável da saída", () => {
    // Depois da entrada, cai direto para 100.
    const bars = zigzag([100, 120, 110, 100]);
    const t = trackPosition(position({ target1: null, target: null }), bars)!;
    expect(t.units.every((u) => u.status === "stopHit")).toBe(true);
    expect(t.instructions[0]).toMatchObject({ key: "sellStop", unitIds: ["t", "w"] });
    expect(t.units[0].stopFill).toBeLessThanOrEqual(104);
    expect(t.pnl).toBeLessThan(0);
  });

  it("venda registrada fecha a unidade com o preço informado", () => {
    const p = position();
    p.units[0].exit = { price: 125, at: 30 * DAY };
    const t = trackPosition(p, UP)!;
    expect(t.units[0]).toMatchObject({ status: "closed", pnlPerUnit: 15 });
    expect(t.instructions.some((i) => i.key === "takeProfit")).toBe(false);
  });

  it("perdendo dinheiro: nunca aumentar (regra 10c)", () => {
    const bars = zigzag([100, 120, 110, 106]);
    const t = trackPosition(position(), bars)!;
    expect(t.instructions).toContainEqual({ key: "noAddLoser" });
    expect(t.openRisk).toBe(6 * 100);
  });

  it("venda a descoberto: o espelho da compra", () => {
    const long = trackPosition(position(), UP)!;
    const short = trackPosition(
      position({
        side: "short",
        target1: 400 - 125,
        target: 400 - 145,
        units: position().units.map((u) => ({ ...u, entry: 400 - u.entry, stop: 400 - u.stop })),
      }),
      mirror(UP),
    )!;
    expect(short.pnl).toBeCloseTo(long.pnl);
    expect(short.units[1].stop).toBeCloseTo(400 - long.units[1].stop);
    expect(short.riskFree).toBe(true);
    expect(short.instructions).toContainEqual({ key: "takeProfit", unitId: "t", price: 275 });
  });
});

describe("unidades e pirâmide", () => {
  it("divide em trading e tendência, em lotes; um lote só fica inteiro na tendência", () => {
    expect(splitUnits(300, 100)).toEqual({ trading: 200, trending: 100 });
    expect(splitUnits(100, 1)).toEqual({ trading: 50, trending: 50 });
    expect(splitUnits(100, 100)).toEqual({ trading: 0, trending: 100 });
    expect(splitUnits(0.0361, 0.0001)).toEqual({ trading: 0.0181, trending: 0.018 });
  });

  it("cada camada da pirâmide é a metade da anterior", () => {
    const p = position();
    expect(pyramidQuantity(p, 1)).toBe(50);
    p.units.push({ id: "p", kind: "pyramid", quantity: 50, entry: 130, at: 40 * DAY, stop: 120 });
    expect(pyramidQuantity(p, 1)).toBe(25);
  });
});
