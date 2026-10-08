import { describe, expect, it } from "vitest";
import { failureSwings, readRsi, rsi, zoneExits } from "./rsi";

const bars = (closes: number[]) => closes.map((close) => ({ close }));
/** IFR com failure swing de topo: A = 75, B = 60, C = 68; perde 60 no índice 9. */
const top = [50, 60, 75, 65, 60, 66, 68, 64, 62, 58, 57, 56];

describe("IFR de Wilder", () => {
  it("calcula com a suavização de Wilder (caso feito à mão, período 2)", () => {
    // Variações: +1, −1, +2, +1. Primeiras médias: altas 0,5 e baixas 0,5 → 50.
    // Depois: altas (0,5 + 2) ÷ 2 = 1,25 e baixas 0,25 → RS 5 → 83,33; altas 1,125 e baixas 0,125 → RS 9 → 90.
    const values = rsi(bars([10, 11, 10, 12, 13]), 2);
    expect(values[0]).toBeNull();
    expect(values[1]).toBeNull();
    expect(values[2]).toBeCloseTo(50);
    expect(values[3]).toBeCloseTo(83.333, 2);
    expect(values[4]).toBeCloseTo(90);
  });

  it("usa os fechamentos anteriores ao período para valer desde o primeiro candle", () => {
    const values = rsi(bars([12, 13]), 2, [10, 11, 10]);
    expect(values[0]).toBeCloseTo(83.333, 2);
    expect(values[1]).toBeCloseTo(90);
  });

  it("só altas dá 100; preço parado dá 50", () => {
    expect(rsi(bars([1, 2, 3, 4]), 2).at(-1)).toBe(100);
    expect(rsi(bars([5, 5, 5, 5]), 2).at(-1)).toBe(50);
  });
});

describe("sinais", () => {
  it("saída das zonas: venda ao voltar abaixo de 70, compra ao voltar acima de 30", () => {
    expect(zoneExits([65, 72, 75, 69, 50, 28, 25, 31])).toEqual([
      { index: 3, kind: "sell", type: "exit" },
      { index: 7, kind: "buy", type: "exit" },
    ]);
  });

  it("failure swing de topo: acima de 70, repique mais baixo e perda do fundo intermediário", () => {
    expect(failureSwings(top)).toEqual([{ index: 9, kind: "sell", type: "failure" }]);
  });

  it("failure swing de fundo é o espelho", () => {
    expect(failureSwings(top.map((v) => 100 - v))).toEqual([{ index: 9, kind: "buy", type: "failure" }]);
  });

  it("o padrão se desfaz se o IFR passar o topo A antes de perder o fundo B", () => {
    expect(failureSwings([50, 60, 75, 65, 60, 66, 68, 70, 78, 61, 59, 58, 57])).toEqual([]);
  });
});

describe("leitura", () => {
  it("diz a zona e os últimos sinais", () => {
    const reading = readRsi([...top, 25, 31])!;
    expect(reading.value).toBe(31);
    expect(reading.zone).toBe("lower");
    expect(reading.lastExit).toEqual({ index: 13, kind: "buy", type: "exit" });
    expect(reading.lastFailure).toEqual({ index: 9, kind: "sell", type: "failure" });
  });

  it("sem IFR no último candle, não há leitura", () => {
    expect(readRsi([null, null])).toBeNull();
  });
});
