import { describe, expect, it } from "vitest";
import { diCrosses, dmi, readAdx } from "./adx";
import { cci, cciExits, readCci } from "./cci";
import type { Bar } from "./drawings/types";
import { parabolicSar, readSar, sarFlips } from "./parabolicSar";
import { readRoc, roc } from "./roc";

const bar = (high: number, low: number, close: number, i = 0): Bar => ({ time: i, open: close, high, low, close, volume: 1 });
/** Alta constante: máxima i+1, mínima i, fechamento i+0,5. */
const rising = (n: number, from = 0) => Array.from({ length: n }, (_, k) => bar(from + k + 1, from + k, from + k + 0.5, k));

describe("ADX / movimento direcional", () => {
  it("alta constante: +DI = 100 × 1 ÷ 1,5, −DI = 0, ADX = 100 (tendência forte)", () => {
    // Cada candle: +DM = 1 e true range = máxima − fechamento anterior = 1,5.
    const lines = dmi(rising(40));
    expect(lines.plusDI[13]).toBeNull();
    expect(lines.plusDI[14]).toBeCloseTo(66.67, 1);
    expect(lines.minusDI[14]).toBe(0);
    // O ADX é a média de 14 DX: começa no candle 27.
    expect(lines.adx[26]).toBeNull();
    expect(lines.adx[27]).toBeCloseTo(100);
    expect(readAdx(lines)).toMatchObject({ strength: "strong", direction: "up", lastCross: null });
  });

  it("alta e depois queda: +DI cruza −DI para baixo (venda)", () => {
    const up = rising(30);
    const down = Array.from({ length: 30 }, (_, k) => bar(30 - k, 29 - k, 29.5 - k, 30 + k));
    const crosses = diCrosses(dmi([...up, ...down]));
    expect(crosses.at(-1)).toMatchObject({ dir: "down" });
    expect(crosses.at(-1)!.index).toBeGreaterThanOrEqual(30);
  });
});

describe("SAR parabólico", () => {
  const up = rising(20);
  const down = Array.from({ length: 15 }, (_, k) => bar(18 - k, 17 - k, 17.5 - k, 20 + k));
  const points = parabolicSar([...up, ...down]);

  it("na alta fica abaixo do preço e nunca entra nos dois candles anteriores", () => {
    for (let i = 2; i < 20; i++) {
      expect(points[i]!.long).toBe(true);
      expect(points[i]!.sar).toBeLessThanOrEqual(Math.min(up[i - 1].low, up[i - 2].low));
    }
  });

  it("vira para vendido quando a mínima perde o SAR, que salta para a máxima da alta", () => {
    const flips = sarFlips(points);
    expect(flips).toHaveLength(1);
    expect(flips[0].kind).toBe("sell");
    expect(points[flips[0].index]!.sar).toBe(20);
    const reading = readSar([...up, ...down], points)!;
    expect(reading).toMatchObject({ long: false, since: flips[0].index });
  });
});

describe("ROC", () => {
  it("variação em % contra o fechamento de N candles atrás, com aquecimento", () => {
    expect(roc([{ close: 100 }, { close: 110 }, { close: 121 }], 1)).toEqual([null, expect.closeTo(10), expect.closeTo(10)]);
    expect(roc([{ close: 121 }], 2, [100, 110])).toEqual([expect.closeTo(21)]);
    expect(readRoc([null, -2, 3])).toMatchObject({ value: 3, extreme: "high", lastCross: { index: 2, dir: "up" } });
  });
});

describe("CCI", () => {
  it("(preço típico − média) ÷ (0,015 × desvio médio)", () => {
    // Preços típicos 1, 2, 3: média 2, desvio médio 2/3 → (3 − 2) ÷ (0,015 × 2/3) = 100.
    const values = cci([bar(1, 1, 1), bar(2, 2, 2), bar(3, 3, 3)], 3);
    expect(values[0]).toBeNull();
    expect(values[1]).toBeNull();
    expect(values[2]).toBeCloseTo(100);
  });

  it("venda ao voltar abaixo de +100; compra ao voltar acima de −100", () => {
    expect(cciExits([150, 90, -120, -80])).toEqual([
      { index: 1, kind: "sell", type: "exit" },
      { index: 3, kind: "buy", type: "exit" },
    ]);
    expect(readCci([150, 90, -120])).toMatchObject({ zone: "oversold", lastExit: { kind: "sell" } });
  });
});
