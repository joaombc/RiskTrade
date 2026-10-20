import { describe, expect, it } from "vitest";
import { backtest, loadBacktestSettings } from "./backtest";
import { CONDITION_OPTIONS, conditionEvaluator, customSignals, isValidCondition, mirror, type Condition } from "./customSystem";
import type { Bar } from "./drawings/types";

const fromCloses = (closes: number[]): Bar[] =>
  closes.map((close, i) => {
    const open = i === 0 ? close : closes[i - 1];
    return { time: i, open, close, high: Math.max(open, close) + 0.5, low: Math.min(open, close) - 0.5, volume: 1 };
  });
// Onda de 120 candles: altas e quedas longas.
const wave = fromCloses(Array.from({ length: 360 }, (_, i) => 100 + 20 * Math.sin((2 * Math.PI * i) / 120)));

const priceAbove20: Condition = { id: "priceMa", side: "bull", params: [20] };
const crossUp: Condition = { id: "maCross", side: "bull", params: [5, 20] };

describe("condições", () => {
  it("o espelho troca o lado, menos no ADX", () => {
    expect(mirror(crossUp)).toEqual({ ...crossUp, side: "bear" });
    const adx: Condition = { id: "adx", side: "bull", params: [25] };
    expect(mirror(adx)).toBe(adx);
  });

  it("só aceita condições do catálogo", () => {
    expect(isValidCondition(crossUp)).toBe(true);
    expect(isValidCondition({ id: "maCross", side: "bull", params: [7, 9] })).toBe(false);
    expect(isValidCondition({ id: "xyz", side: "bull", params: [] })).toBe(false);
    expect(CONDITION_OPTIONS.filter((c) => c.id === "adx")).toHaveLength(3);
  });

  it("todas as condições do catálogo podem ser avaliadas", () => {
    const flags = conditionEvaluator(wave);
    for (const c of CONDITION_OPTIONS) {
      const values = flags(c);
      expect(values, `${c.id}:${c.side}`).toHaveLength(wave.length);
    }
  });

  it("evento só no candle do cruzamento; estado enquanto durar", () => {
    const flags = conditionEvaluator(wave);
    const events = flags(crossUp).filter(Boolean).length;
    const states = flags(priceAbove20).filter(Boolean).length;
    expect(events).toBeGreaterThan(0);
    expect(events).toBeLessThan(5);
    expect(states).toBeGreaterThan(100);
  });
});

describe("sistema montado", () => {
  it("entrada exige todas as condições; saída, qualquer uma", () => {
    const rules = { entry: [crossUp, priceAbove20], exit: [mirror(crossUp)] };
    const signals = customSignals(wave, rules, false);
    expect(signals.length).toBeGreaterThan(1);
    const flags = conditionEvaluator(wave);
    for (const s of signals) {
      if (s.kind === "buy") expect(flags(crossUp)[s.index] && flags(priceAbove20)[s.index]).toBe(true);
      else expect(s.kind).toBe("exit");
    }
    // Alterna entrada e saída, começando pela entrada.
    signals.forEach((s, k) => expect(s.kind).toBe(k % 2 === 0 ? "buy" : "exit"));
  });

  it("comprado e vendido: a venda usa as regras espelhadas", () => {
    const signals = customSignals(wave, { entry: [crossUp], exit: [] }, true);
    expect(signals.map((s) => s.kind)).toContain("sell");
    const result = backtest(wave, signals, { mode: "longShort", costPercent: 0, stopPercent: null });
    expect(result.trades.some((t) => t.direction === -1)).toBe(true);
  });

  it("sem condições de entrada, não há sinais", () => {
    expect(customSignals(wave, { entry: [], exit: [crossUp] }, true)).toEqual([]);
  });

  it("configurações salvas inválidas voltam ao padrão (sem localStorage, no teste)", () => {
    expect(loadBacktestSettings().rules.entry.length).toBeGreaterThan(0);
  });
});
