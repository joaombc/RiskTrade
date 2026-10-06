import { describe, expect, it } from "vitest";
import { channelSystem, priceChannel } from "./priceChannel";

const bar = (close: number, spread = 0.5) => ({ close, high: close + spread, low: close - spread });

describe("priceChannel", () => {
  it("usa a máxima e a mínima dos candles anteriores, sem o atual", () => {
    const bars = [10, 12, 11, 30].map((c) => bar(c));
    const { upper, lower } = priceChannel(bars, 3);
    expect(upper).toEqual([null, null, null, 12.5]);
    expect(lower).toEqual([null, null, null, 9.5]);
  });
});

describe("channelSystem", () => {
  // Lateral em 100, alta até 130, queda até 95.
  const closes = [
    ...Array.from({ length: 6 }, (_, i) => (i % 2 ? 101 : 99)),
    ...Array.from({ length: 8 }, (_, i) => 103 + i * 4),
    ...Array.from({ length: 10 }, (_, i) => 128 - i * 4),
  ];
  const bars = closes.map((c) => bar(c));

  it("versão contínua: compra no rompimento da máxima e inverte para venda na perda da mínima", () => {
    const signals = channelSystem(bars, 5);
    expect(signals.map((s) => s.kind)).toEqual(["buy", "sell"]);
    expect(closes[signals[0].index]).toBe(103);
  });

  it("versão não contínua: sai antes com o canal curto e fica de fora", () => {
    const continuous = channelSystem(bars, 5);
    const short = channelSystem(bars, 5, 2);
    expect(short.map((s) => s.kind)).toEqual(["buy", "exit", "sell"]);
    // A saída pelo canal de 2 vem antes da inversão pelo canal de 5.
    expect(short[1].index).toBeLessThan(continuous[1].index);
  });

  it("sem rompimento, sem sinal", () => {
    const flat = Array.from({ length: 30 }, (_, i) => bar(i % 2 ? 101 : 99));
    expect(channelSystem(flat, 20)).toEqual([]);
  });
});

describe("channelSystemState", () => {
  const closes = [
    ...Array.from({ length: 6 }, (_, i) => (i % 2 ? 101 : 99)),
    ...Array.from({ length: 8 }, (_, i) => 103 + i * 4),
  ];
  const bars = closes.map((c) => bar(c));

  it("informa a posição atual e desde qual candle", async () => {
    const { channelSystemState } = await import("./priceChannel");
    const state = channelSystemState(bars, 5);
    expect(state.position).toBe("long");
    expect(closes[state.since!]).toBe(103);
  });

  it("de fora depois da saída, na versão não contínua", async () => {
    const { channelSystemState } = await import("./priceChannel");
    // Perde a mínima de 2 candles (sai), sem perder a de 5 (não abre venda).
    const falling = [...closes, 125, 124].map((c) => bar(c));
    const state = channelSystemState(falling, 5, 2);
    expect(state.position).toBe("flat");
    expect(state.since).toBeNull();
    expect(state.signals.at(-1)?.kind).toBe("exit");
  });
});

describe("preferências da regra no gráfico", () => {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  } as Storage;

  it("salvam e recuperam, e corrigem combinações inválidas", async () => {
    const { loadFourWeekSettings, saveFourWeekSettings, DEFAULT_FOUR_WEEK } = await import("./priceChannel");
    expect(loadFourWeekSettings()).toEqual(DEFAULT_FOUR_WEEK);
    saveFourWeekSettings({ enabled: true, entryWeeks: 8, exitWeeks: 2 });
    expect(loadFourWeekSettings()).toEqual({ enabled: true, entryWeeks: 8, exitWeeks: 2 });
    // Saída de 2 semanas com entrada de 2 não é mais curta: vira contínua.
    store.set("risktrade:four-week:v1", JSON.stringify({ enabled: true, entryWeeks: 2, exitWeeks: 2 }));
    expect(loadFourWeekSettings().exitWeeks).toBeNull();
    store.set("risktrade:four-week:v1", JSON.stringify({ enabled: "sim", entryWeeks: 5, exitWeeks: 3 }));
    expect(loadFourWeekSettings()).toEqual({ enabled: false, entryWeeks: 4, exitWeeks: null });
    store.set("risktrade:four-week:v1", "{lixo");
    expect(loadFourWeekSettings()).toEqual(DEFAULT_FOUR_WEEK);
  });
});
