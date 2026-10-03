import { describe, expect, it } from "vitest";
import { averageVolume, lastSessions, toMarketStatus, type DailyBar } from "./market";

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
