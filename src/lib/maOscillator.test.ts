import { describe, expect, it } from "vitest";
import { isWidening, maDifference, readMaOscillator } from "./maOscillator";

describe("diferença entre as médias", () => {
  it("é a curta menos a longa, só onde as duas existem", () => {
    expect(maDifference([null, 10, 12, 11], [null, null, 10, 12])).toEqual([null, null, 2, -1]);
  });

  it("diz se a barra cresceu em módulo; trocar de lado conta como crescer", () => {
    const diff = [1, 2, 1.5, -0.5, -1, null];
    expect(isWidening(diff, 0)).toBeNull();
    expect(isWidening(diff, 1)).toBe(true);
    expect(isWidening(diff, 2)).toBe(false);
    expect(isWidening(diff, 3)).toBe(true);
    expect(isWidening(diff, 4)).toBe(true);
    expect(isWidening(diff, 5)).toBeNull();
  });
});

describe("leitura", () => {
  it("médias se afastando: diferença, %, sequência e último cruzamento", () => {
    const slow = [100, 100, 100, 100, 100, 100];
    const diff = [-1, -0.5, 0.5, 1, 2, 3];
    expect(readMaOscillator(diff, slow)).toEqual({
      value: 3,
      percent: 3,
      widening: true,
      streak: 4,
      lastCross: { index: 2, dir: "up" },
    });
  });

  it("médias se aproximando: conta os candles em que a diferença encolheu", () => {
    const reading = readMaOscillator([1, 4, 3, 2, 1.5], [50, 50, 50, 50, 50])!;
    expect(reading.widening).toBe(false);
    expect(reading.streak).toBe(3);
    expect(reading.lastCross).toBeNull();
  });

  it("sem as duas médias no último candle, não há leitura", () => {
    expect(readMaOscillator([1, null], [1, null])).toBeNull();
  });
});
