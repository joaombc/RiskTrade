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
