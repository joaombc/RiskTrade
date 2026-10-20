import { describe, expect, it } from "vitest";
import type { Bar } from "./drawings/types";
import { finalAction, lotOf, openGaps, sizePosition, tradePlan, type TradePlan } from "./tradePlan";

/** Candles ligando os pontos em linha reta, `per` candles por perna (máxima e mínima a 0,5 do fechamento). */
function zigzag(points: number[], per = 15): Bar[] {
  const closes: number[] = [points[0]];
  for (let k = 1; k < points.length; k++) {
    for (let j = 1; j <= per; j++) closes.push(points[k - 1] + ((points[k] - points[k - 1]) * j) / per);
  }
  return closes.map((close, i) => ({ time: i * 86_400, open: closes[i - 1] ?? close, high: close + 0.5, low: close - 0.5, close, volume: 1 }));
}

/** Espelho em torno de 400: a alta vira baixa com preços positivos. */
const mirror = (bars: Bar[]): Bar[] => bars.map((b) => ({ ...b, open: 400 - b.open, high: 400 - b.low, low: 400 - b.high, close: 400 - b.close }));

// Alta em degraus: fundos e topos cada vez mais altos.
const UP = [100, 120, 110, 135, 124, 150];

describe("plano do ativo", () => {
  it("alta, preço na zona de 40–60% da última perna: comprar agora, stop abaixo do suporte", () => {
    // Última perna: fundo 124 → topo 150 (26); recuo até 137 = 50%.
    const plan = tradePlan(zigzag([...UP, 137]), null);
    expect(plan).toMatchObject({ side: "long", action: "enterNow", dailyTrend: "up", order: "market" });
    expect(plan.entryZone![0]).toBeCloseTo(150.5 - 0.6 * (150.5 - 123.5), 0);
    expect(plan.stop!).toBeLessThan(plan.entry!);
    expect(plan.target!).toBeGreaterThan(plan.entry!);
    expect(plan.confluence).toContain("retracement");
    expect(plan.reasons.map((r) => r.key)).toContain("inZone");
  });

  it("alta, preço ainda perto do topo: comprar na queda até a zona (ordem limitada)", () => {
    const plan = tradePlan(zigzag([...UP, 147]), null);
    expect(plan).toMatchObject({ side: "long", action: "enterLimit", order: "limit" });
    expect(plan.entry!).toBeLessThan(plan.close);
    expect(plan.entry).toBe(plan.entryZone![1]);
  });

  it("baixa: o mesmo plano espelhado, do lado vendido", () => {
    const up = tradePlan(zigzag([...UP, 137]), null);
    const down = tradePlan(mirror(zigzag([...UP, 137])), null);
    expect(down).toMatchObject({ side: "short", action: "enterNow", dailyTrend: "down" });
    expect(down.entry!).toBeCloseTo(400 - up.entry!, 0);
    expect(down.stop!).toBeCloseTo(400 - up.stop!, 0);
    expect(down.stop!).toBeGreaterThan(down.entry!);
    expect(down.target!).toBeLessThan(down.entry!);
    expect(down.rewardRisk!).toBeCloseTo(up.rewardRisk!, 0);
  });

  it("semanal contra o diário: o plano fica pronto, mas a orientação é aguardar (regra 14)", () => {
    const weeklyDown = mirror(zigzag(UP, 6));
    const plan = tradePlan(zigzag([...UP, 137]), weeklyDown);
    expect(plan.weeklyTrend).toBe("down");
    expect(plan.action).toBe("wait");
    expect(plan.reasons).toContainEqual({ key: "weekly", trend: "down", agrees: false });
  });

  it("sem histórico suficiente: ficar de fora", () => {
    const plan = tradePlan(zigzag([100, 101], 5), null);
    expect(plan).toMatchObject({ side: null, action: "stayOut", reasons: [{ key: "noTrendData" }] });
  });
});

describe("quantidade e ação final", () => {
  const base = { capital: 100_000, maxInvested: 50, maxPerAsset: 15, riskPerTrade: 2, fx: 1, lot: 1 };

  it("o menor entre o risco até o stop, o limite por ativo e o caixa", () => {
    // Risco: 2.000 ÷ 2 = 1.000 ações; por ativo: 15.000 ÷ 50 = 300 → 300 ações.
    expect(sizePosition({ ...base, entry: 50, stop: 48 })).toEqual({ quantity: 300, value: 15_000, risk: 600, limitedBy: "asset" });
    // Stop longe: 2.000 ÷ 20 = 100 ações.
    expect(sizePosition({ ...base, entry: 50, stop: 30 })).toMatchObject({ quantity: 100, limitedBy: "risk", risk: 2_000 });
    // Caixa: 50.000 − 45.000 já investidos = 5.000 ÷ 50 = 100 ações.
    expect(sizePosition({ ...base, entry: 50, stop: 48, invested: 45_000 })).toMatchObject({ quantity: 100, limitedBy: "cash" });
  });

  it("lotes de 100 na B3, câmbio da moeda do ativo e frações em cripto", () => {
    expect(sizePosition({ ...base, entry: 50, stop: 48, lot: 100 }).quantity).toBe(300);
    expect(sizePosition({ ...base, entry: 51, stop: 48, lot: 100 }).quantity).toBe(200);
    // Ativo em dólar, conta em reais (5,5): 15.000 ÷ (50 × 5,5) = 54,5 → 54.
    expect(sizePosition({ ...base, entry: 50, stop: 48, fx: 5.5 }).quantity).toBe(54);
    expect(sizePosition({ ...base, entry: 80_000, stop: 76_000, lot: 0.0001 })).toMatchObject({ quantity: 0.1875, limitedBy: "asset" });
    expect([lotOf("PETR4.SA"), lotOf("BTC-USD"), lotOf("AAPL")]).toEqual([100, 0.0001, 1]);
  });

  it("ganho/risco abaixo do mínimo vira aguardar; vendido sem operar vendido, ficar de fora", () => {
    const plan = { side: "long", action: "enterNow", rewardRisk: 2 } as TradePlan;
    expect(finalAction(plan, 3, false)).toEqual({ action: "wait", reason: { key: "rewardRiskLow", rewardRisk: 2, min: 3 } });
    expect(finalAction({ ...plan, rewardRisk: 3.2 }, 3, false)).toEqual({ action: "enterNow", reason: null });
    expect(finalAction({ ...plan, side: "short" }, 3, false)).toEqual({ action: "stayOut", reason: { key: "shortDisabled" } });
  });

  it("gaps de alta ainda abertos", () => {
    const bars = zigzag([100, 110], 10);
    bars.push({ time: 99, open: 115, high: 116, low: 114, close: 115, volume: 1 });
    expect(openGaps(bars)).toEqual([[110.5, 114]]);
    bars.push({ time: 100, open: 112, high: 113, low: 110, close: 111, volume: 1 });
    expect(openGaps(bars)).toEqual([]);
  });
});

describe("rompimentos", () => {
  it("lateral com semanal de alta: comprar no rompimento do topo da faixa", () => {
    // Topos e fundos no mesmo nível: faixa de 100 a 120.
    const flat = zigzag([100, 120, 100, 120, 100, 120, 110]);
    const weeklyUp = zigzag(UP, 6);
    const plan = tradePlan(flat, weeklyUp);
    expect(plan).toMatchObject({ dailyTrend: "lateral", side: "long", action: "enterStop", order: "stop" });
    expect(plan.entry!).toBeCloseTo(120.5, 0);
    expect(plan.stop!).toBeLessThan(plan.entry!);
  });

  it("lateral com semanal de baixa e o preço já abaixo da faixa: não manda vender acima do preço", () => {
    const flat = zigzag([100, 120, 100, 120, 100, 120, 110]);
    const broken = [...flat, ...zigzag([110, 92], 4).slice(1).map((b, k) => ({ ...b, time: (flat.length + k) * 86_400 }))];
    const plan = tradePlan(broken, mirror(zigzag(UP, 6)));
    expect(plan.side).toBe("short");
    if (plan.action === "enterStop") expect(plan.entry!).toBeLessThan(plan.close);
    else expect(["enterNow", "enterLimit", "wait"]).toContain(plan.action);
  });
});
