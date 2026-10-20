import { describe, expect, it } from "vitest";
import { mergeAlerts, planAlerts, positionAlerts } from "./portfolioAlerts";
import type { Position, PositionTracking } from "./positions";
import type { TradePlan } from "./tradePlan";

const NOW = Date.parse("2026-10-20T15:00:00Z") / 1000;
const plan = (over: Partial<TradePlan> = {}): TradePlan => ({
  side: "long",
  action: "enterLimit",
  close: 105,
  atr: 2,
  dailyTrend: "up",
  weeklyTrend: "up",
  entry: 100,
  entryZone: [98, 100],
  order: "limit",
  stop: 95,
  target1: 110,
  target: 120,
  rewardRisk: 4,
  confluence: [],
  reasons: [],
  ...over,
});

describe("alertas do plano", () => {
  it("sem leitura anterior, nada (só registra)", () => {
    expect(planAlerts("AAPL", undefined, plan(), "enterNow", NOW)).toEqual([]);
  });

  it("novo sinal de entrada quando o plano passa de aguardar para entrar", () => {
    const alerts = planAlerts("AAPL", { action: "wait", side: "long", trend: "up" }, plan(), "enterLimit", NOW);
    expect(alerts).toEqual([
      expect.objectContaining({ kind: "entrySignal", tone: "buy", action: "enterLimit", price: 100, id: "plan:AAPL:entrySignal:long:2026-10-20:enterLimit" }),
    ]);
  });

  it("chegou à zona (limitada → agora), rompeu (stop → agora) e perto da zona", () => {
    expect(planAlerts("A", { action: "enterLimit", side: "long", trend: "up" }, plan({ action: "enterNow" }), "enterNow", NOW)[0].kind).toBe("inZone");
    expect(planAlerts("A", { action: "enterStop", side: "long", trend: "up" }, plan({ action: "enterNow" }), "enterNow", NOW)[0].kind).toBe("breakout");
    const near = planAlerts("A", { action: "enterLimit", side: "long", trend: "up" }, plan({ close: 100.8 }), "enterLimit", NOW);
    expect(near.map((a) => a.kind)).toEqual(["nearZone"]);
  });

  it("tendência virou; venda a descoberto com o tom de venda", () => {
    const alerts = planAlerts("A", { action: "stayOut", side: "long", trend: "up" }, plan({ side: "short", dailyTrend: "down" }), "enterLimit", NOW);
    expect(alerts.map((a) => [a.kind, a.tone])).toEqual([
      ["entrySignal", "sell"],
      ["trendChanged", "sell"],
    ]);
  });
});

describe("alertas da posição", () => {
  const position: Position = { id: "p", symbol: "AAPL", name: "Apple", side: "long", currency: "USD", target1: 110, target: 120, units: [] };
  const tracking = (over: Partial<PositionTracking>): PositionTracking => ({
    price: 112,
    units: [],
    events: [],
    instructions: [],
    pnl: 0,
    openRisk: 0,
    riskFree: true,
    averageEntry: 100,
    trendAgainst: false,
    closed: false,
    ...over,
  });

  it("só os eventos recentes; ajustes de stop do mesmo candle viram um alerta", () => {
    const t = tracking({
      events: [
        { key: "target1Hit", price: 110, time: 100 },
        { key: "breakeven", unitId: "a", to: 100, time: 200 },
        { key: "breakeven", unitId: "b", to: 100, time: 200 },
        { key: "stopRaised", unitId: "a", from: 100, to: 104, time: 300 },
        { key: "stopRaised", unitId: "b", from: 100, to: 102, time: 300 },
      ],
    });
    expect(positionAlerts(position, t, 150, NOW).map((a) => [a.kind, a.price])).toEqual([
      ["breakeven", 100],
      ["raiseStop", 104],
    ]);
  });

  it("stop atingido e tendência virou pedem saída; pirâmide uma vez por camada", () => {
    const t = tracking({
      events: [{ key: "stopHit", unitId: "a", price: 95, time: 500 }],
      instructions: [{ key: "trendReversed" }, { key: "pyramid" }],
    });
    const alerts = positionAlerts(position, t, 0, NOW);
    expect(alerts.map((a) => [a.kind, a.tone])).toEqual([
      ["stopHit", "sell"],
      ["trendReversed", "sell"],
      ["pyramid", "buy"],
    ]);
    expect(alerts[2].id).toBe("pos:p:pyramid:0");
  });
});

describe("histórico", () => {
  it("junta sem repetir, os novos primeiro, até o máximo", () => {
    const { history, added } = mergeAlerts([{ id: "a" }, { id: "b" }], [{ id: "b" }, { id: "c" }, { id: "d" }], 3);
    expect(added.map((a) => a.id)).toEqual(["c", "d"]);
    expect(history.map((a) => a.id)).toEqual(["d", "c", "a"]);
  });
});
