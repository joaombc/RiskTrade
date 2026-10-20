import { describe, expect, it } from "vitest";
import { PROFILE_LIMITS } from "./portfolioAccount";
import { closedTrades, currentStreak, drawdown, equityCurve, exposures, guidance, tradeStats } from "./portfolioSummary";
import type { Position } from "./positions";

const limits = PROFILE_LIMITS.standard; // 50% / 15% / 2% / 25% / 3:1

describe("uso dos limites", () => {
  it("total, por ativo e por grupo, com os estouros marcados", () => {
    const e = exposures(
      [
        { symbol: "AAPL", group: "technology", value: 16_000 },
        { symbol: "MSFT", group: "technology", value: 12_000 },
        { symbol: "PETR4.SA", group: "energy", value: 10_000 },
      ],
      100_000,
      limits,
    );
    expect(e.invested).toMatchObject({ value: 38_000, pct: expect.closeTo(38), over: false });
    expect(e.byAsset[0]).toMatchObject({ key: "AAPL", pct: expect.closeTo(16), over: true });
    expect(e.byGroup[0]).toMatchObject({ key: "technology", value: 28_000, pct: expect.closeTo(28), over: true });
    expect(e.byGroup[1]).toMatchObject({ key: "energy", over: false });
  });
});

const pos = (id: string, side: "long" | "short", entry: number, exit: number, quantity = 10, day = 1): Position => ({
  id,
  symbol: id,
  name: id,
  side,
  currency: "USD",
  target1: null,
  target: null,
  units: [{ id: `${id}-u`, kind: "trending", quantity, entry, at: day * 86_400, stop: 0, exit: { price: exit, at: (day + 5) * 86_400 } }],
});

describe("histórico", () => {
  it("resultado das encerradas, também na venda a descoberto; abertas ficam de fora", () => {
    const open: Position = { ...pos("OPEN", "long", 10, 0), units: [{ id: "x", kind: "trending", quantity: 1, entry: 10, at: 0, stop: 9 }] };
    const trades = closedTrades([pos("A", "long", 100, 110, 10, 1), pos("B", "short", 50, 45, 10, 3), open]);
    expect(trades.map((t) => [t.position.id, t.pnl, t.pnlPct])).toEqual([
      ["B", 50, 10],
      ["A", 100, 10],
    ]);
  });

  it("estatísticas: acerto, ganho médio contra perda média", () => {
    expect(tradeStats([300, -100, -100, 500, -100])).toEqual({ trades: 5, winRate: 40, avgWin: 400, avgLoss: -100, payoff: 4, total: 500 });
    expect(tradeStats([])).toMatchObject({ trades: 0, winRate: null, payoff: null });
  });

  it("curva de capital, sequência atual e queda desde o pico", () => {
    const curve = equityCurve(1_000, [
      { closedAt: 2, pnl: 200 },
      { closedAt: 1, pnl: 100 },
      { closedAt: 3, pnl: -260 },
    ]);
    expect(curve.map((p) => p.value)).toEqual([1_000, 1_100, 1_300, 1_040]);
    expect(drawdown(curve)).toBeCloseTo(20);
    expect(currentStreak([-1, -2, 3])).toEqual({ kind: "losses", count: 2 });
    expect(currentStreak([])).toBeNull();
  });
});

describe("orientações de Murphy", () => {
  it("depois de 3 ganhos seguidos, não aumentar; fechar primeiro as perdedoras; tudo num grupo só", () => {
    const g = guidance({
      results: [10, 20, 30, -5],
      curve: [{ value: 100 }, { value: 130 }],
      open: [
        { symbol: "AAPL", group: "technology", pnl: -50 },
        { symbol: "MSFT", group: "technology", pnl: 80 },
      ],
      limits,
    });
    expect(g).toEqual([
      { key: "afterWins", count: 3 },
      { key: "closeLosersFirst", symbols: ["AAPL"] },
      { key: "oneGroup", group: "technology", count: 2 },
    ]);
  });

  it("queda do capital de 10% ou mais e posições demais", () => {
    const open = Array.from({ length: 7 }, (_, k) => ({ symbol: `S${k}`, group: k % 2 ? ("energy" as const) : ("technology" as const), pnl: 1 }));
    const g = guidance({ results: [-1, -1, -1], curve: [{ value: 100 }, { value: 85 }], open, limits });
    expect(g).toEqual([
      { key: "afterLosses", count: 3 },
      { key: "drawdown", pct: expect.closeTo(15) },
      { key: "tooMany", count: 7, max: 3 },
    ]);
  });
});
