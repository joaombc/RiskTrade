import { describe, expect, it } from "vitest";
import { fastK } from "./stochastic";
import { readWilliams, williamsExits, williamsR } from "./williamsR";

/** [máxima, mínima, fechamento] */
const bars = (rows: [number, number, number][]) => rows.map(([high, low, close]) => ({ high, low, close }));

// Caso feito à mão, período 3:
// i2: faixa 8–12, fecha 12 (na máxima) → 0; i3: faixa 9–12, fecha 10 → −100 × 2 ÷ 3 = −66,67;
// i4: faixa 9–12, fecha 9 (na mínima) → −100; i5: faixa 9–12, fecha 11 → −33,33.
const SAMPLE = bars([
  [10, 8, 9],
  [11, 9, 10],
  [12, 10, 12],
  [12, 9, 10],
  [11, 9, 9],
  [12, 10, 11],
]);

describe("%R de Williams", () => {
  it("mede a distância do fechamento até a máxima da faixa, de 0 a −100", () => {
    const r = williamsR(SAMPLE, 3);
    expect(r.slice(0, 2)).toEqual([null, null]);
    expect(r[2]).toBeCloseTo(0);
    expect(r[3]).toBeCloseTo(-66.667, 2);
    expect(r[4]).toBeCloseTo(-100);
    expect(r[5]).toBeCloseTo(-33.333, 2);
  });

  it("é o %K rápido do estocástico menos 100", () => {
    const k = fastK(SAMPLE, 3);
    williamsR(SAMPLE, 3).forEach((r, i) => expect(r).toBe(k[i] === null ? null : k[i]! - 100));
  });
});

describe("sinais e leitura", () => {
  it("venda ao sair de cima de −20, compra ao sair de baixo de −80", () => {
    expect(williamsExits([-30, -15, -5, -25, -60, -85, -95, -70])).toEqual([
      { index: 3, kind: "sell", type: "exit" },
      { index: 7, kind: "buy", type: "exit" },
    ]);
  });

  it("zona e última saída", () => {
    expect(readWilliams([-30, -15, -5, -25, -60, -85, -95, -70, -40])).toEqual({
      value: -40,
      zone: "upper",
      lastExit: { index: 7, kind: "buy", type: "exit" },
    });
    expect(readWilliams([-10])?.zone).toBe("overbought");
    expect(readWilliams([-90])?.zone).toBe("oversold");
    expect(readWilliams([null])).toBeNull();
  });
});
