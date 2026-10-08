import { describe, expect, it } from "vitest";
import { momentum, readMomentum, zeroCrossings } from "./momentum";

const bars = (closes: number[]) => closes.map((close) => ({ close }));

describe("momentum", () => {
  it("é o fechamento menos o de N períodos atrás", () => {
    expect(momentum(bars([10, 11, 13, 12, 15]), 2)).toEqual([null, null, 3, 1, 2]);
  });

  it("usa os fechamentos anteriores ao período para valer desde o primeiro candle", () => {
    expect(momentum(bars([13, 12, 15]), 2, [10, 11])).toEqual([3, 1, 2]);
  });
});

describe("cruzamentos da linha zero", () => {
  it("marca compra para cima e venda para baixo, ignorando zeros e lacunas", () => {
    expect(zeroCrossings([null, -2, -1, 0, 3, 2, -1, null, -2, 4])).toEqual([
      { index: 4, dir: "up" },
      { index: 6, dir: "down" },
      { index: 9, dir: "up" },
    ]);
  });
});

describe("leitura", () => {
  it("diz o valor, a % e se está acelerando", () => {
    const closes = [100, 100, 100, 100, 101, 103, 106, 110];
    const values = momentum(bars(closes), 4);
    const reading = readMomentum(bars(closes), values)!;
    expect(reading.value).toBe(10);
    expect(reading.percent).toBeCloseTo(10);
    expect(reading.slope).toBe("rising");
    expect(reading.extreme).toBe("high");
    expect(reading.lastCross).toBeNull();
  });

  it("aponta desaceleração e o último cruzamento", () => {
    const closes = [110, 108, 104, 100, 98, 99, 103, 108, 110, 111, 111];
    const values = momentum(bars(closes), 3);
    const reading = readMomentum(bars(closes), values)!;
    expect(reading.slope).toBe("falling");
    expect(reading.lastCross).toEqual({ index: 6, dir: "up" });
  });

  it("sem momentum no último candle, não há leitura", () => {
    expect(readMomentum(bars([1, 2]), momentum(bars([1, 2]), 10))).toBeNull();
  });
});
