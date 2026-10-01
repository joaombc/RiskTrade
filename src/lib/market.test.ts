import { describe, expect, it } from "vitest";
import { averageVolume, toMarketStatus, type DailyBar } from "./market";

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
