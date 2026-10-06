import { describe, expect, it } from "vitest";
import {
  averageVolume,
  customInterval,
  customRange,
  isIntraday,
  lastSessions,
  parseRange,
  rangeSpec,
  sameBars,
  toMarketStatus,
  type DailyBar,
} from "./market";

function bars(volumes: (number | null)[]): DailyBar[] {
  return volumes.map((volume, i) => ({ date: new Date(2026, 0, i + 1), volume }));
}

describe("averageVolume", () => {
  it("ignora a sessão atual (último candle) e usa as 20 anteriores", () => {
    const history = Array.from({ length: 25 }, (_, i) => i + 1); // 1..25
    // Sessões anteriores à atual: 1..24 → últimas 20 são 5..24, média 14.5
    expect(averageVolume(bars(history))).toBe(14.5);
  });

  it("descarta volumes nulos ou zerados", () => {
    const history = [...Array(20).fill(100), null, 0, 999];
    expect(averageVolume(bars(history))).toBe(100);
  });

  it("retorna null quando não há 20 sessões de histórico", () => {
    expect(averageVolume(bars(Array(20).fill(100)))).toBeNull();
  });
});

describe("toMarketStatus", () => {
  it.each([
    ["REGULAR", "open"],
    ["PRE", "pre"],
    ["PREPRE", "pre"],
    ["POST", "post"],
    ["POSTPOST", "post"],
    ["CLOSED", "closed"],
    [undefined, "closed"],
  ] as const)("%s → %s", (state, expected) => {
    expect(toMarketStatus(state)).toBe(expected);
  });
});

describe("lastSessions", () => {
  const H = 3600;
  // Dois pregões da B3 (fuso −3 h): 10h às 17h locais = 13h às 20h UTC, em 01/10 e 02/10.
  const day = (d: number, hUtc: number) => Date.UTC(2026, 9, d, hUtc) / 1000;
  const b3 = [13, 15, 17, 19].flatMap((h) => [day(1, h), day(2, h)]).sort((a, b) => a - b).map((time) => ({ time }));

  it("mantém só o último pregão no fuso da bolsa", () => {
    expect(lastSessions(b3, 1, -3 * H).map((b) => b.time)).toEqual([13, 15, 17, 19].map((h) => day(2, h)));
  });

  it("mantém tudo quando há menos pregões que o pedido", () => {
    expect(lastSessions(b3, 5, -3 * H)).toHaveLength(8);
  });

  it("usa janelas de 24 h em mercados contínuos (cripto)", () => {
    const crypto = Array.from({ length: 72 }, (_, i) => ({ time: day(1, 0) + i * H }));
    const last = lastSessions(crypto, 1, 0);
    expect(last).toHaveLength(24);
    expect(last[0].time).toBe(crypto[48].time);
  });
});

describe("sameBars", () => {
  const bar = (time: number, close: number, volume = 100) => ({ time, open: 1, high: 2, low: 0.5, close, volume });

  it("reconhece a mesma lista, mesmo em outro objeto", () => {
    expect(sameBars([bar(1, 1.5), bar(2, 1.6)], [bar(1, 1.5), bar(2, 1.6)])).toBe(true);
  });

  it("detecta o candle de hoje mudando de preço ou de volume", () => {
    const before = [bar(1, 1.5), bar(2, 1.6)];
    expect(sameBars(before, [bar(1, 1.5), bar(2, 1.7)])).toBe(false);
    expect(sameBars(before, [bar(1, 1.5), bar(2, 1.6, 150)])).toBe(false);
  });

  it("detecta um candle novo", () => {
    expect(sameBars([bar(1, 1.5)], [bar(1, 1.5), bar(2, 1.6)])).toBe(false);
  });
});

describe("período personalizado", () => {
  it("aceita de 1 a 5000 pregões inteiros", () => {
    expect(customRange(20)).toBe("n20");
    expect(customRange(5000)).toBe("n5000");
    expect([0, 5001, 2.5, NaN].map(customRange)).toEqual([null, null, null, null]);
  });

  it("valida o período vindo da URL ou da API", () => {
    expect(parseRange("1y")).toBe("1y");
    expect(parseRange("n200")).toBe("n200");
    expect(parseRange("n0")).toBeNull();
    expect(parseRange("n99999")).toBeNull();
    expect(parseRange("200")).toBeNull();
    expect(parseRange("constructor")).toBeNull();
  });

  it("escolhe o candle na mesma lógica dos botões", () => {
    expect([1, 2, 5, 6, 10, 11, 22, 23, 200].map(customInterval)).toEqual([
      "5m", "15m", "15m", "30m", "30m", "60m", "60m", "1d", "1d",
    ]);
    expect(isIntraday("n20")).toBe(true);
    expect(isIntraday("n200")).toBe(false);
  });

  it("busca dias corridos suficientes para os pregões pedidos e mostra só os últimos N", () => {
    const spec = rangeSpec("n200");
    expect(spec).toMatchObject({ interval: "1d", sessions: 200 });
    expect(spec.days).toBeGreaterThanOrEqual(280);
    expect(rangeSpec("1y")).toMatchObject({ label: "1A", days: 365 });
  });
});

