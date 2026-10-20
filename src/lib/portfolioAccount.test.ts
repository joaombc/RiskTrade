import { describe, expect, it } from "vitest";
import {
  accountBudget,
  DEFAULT_ACCOUNT,
  limitErrors,
  limitWarnings,
  parseAccount,
  PROFILE_LIMITS,
  profileOf,
  type AccountLimits,
} from "./portfolioAccount";

describe("conta da carteira", () => {
  it("conta de 100.000 nos limites de Murphy: os números do capítulo", () => {
    const budget = accountBudget({ ...DEFAULT_ACCOUNT, capital: 100_000, limits: PROFILE_LIMITS.murphy })!;
    expect(budget).toEqual({ investable: 50_000, reserve: 50_000, perAsset: 15_000, perGroup: 25_000, riskPerTrade: 5_000, maxPositions: 3 });
    expect(accountBudget({ ...DEFAULT_ACCOUNT, capital: null })).toBeNull();
  });

  it("reconhece o perfil pelos limites; limites mexidos são personalizados", () => {
    expect(profileOf(PROFILE_LIMITS.conservative)).toBe("conservative");
    expect(profileOf({ ...PROFILE_LIMITS.standard, riskPerTrade: 1.5 })).toBeNull();
  });

  it("erros: fora da faixa e limites incoerentes", () => {
    const ok = PROFILE_LIMITS.standard;
    expect(limitErrors(ok)).toEqual([]);
    expect(limitErrors({ ...ok, riskPerTrade: 0 })).toEqual([{ key: "riskPerTrade", kind: "range", min: 0.1, max: 10 }]);
    expect(limitErrors({ ...ok, maxInvested: 10 }).map((e) => e.kind)).toEqual(["assetAboveInvested", "groupAboveInvested"]);
    expect(limitErrors({ ...ok, maxPerGroup: 10 })).toEqual([{ key: "maxPerGroup", kind: "groupBelowAsset" }]);
  });

  it("avisos: mais arriscado que Murphy", () => {
    expect(limitWarnings(PROFILE_LIMITS.murphy)).toEqual([]);
    expect(limitWarnings(PROFILE_LIMITS.aggressive)).toEqual(["maxInvested", "maxPerAsset", "maxPerGroup", "minRewardRisk"]);
  });

  it("storage inválido volta ao padrão", () => {
    expect(parseAccount(null)).toEqual(DEFAULT_ACCOUNT);
    const broken = parseAccount({ capital: -5, currency: "EUR", limits: { maxInvested: 500 } as unknown as AccountLimits });
    expect(broken).toEqual(DEFAULT_ACCOUNT);
    expect(parseAccount({ capital: 20_000, currency: "USD", limits: PROFILE_LIMITS.murphy })).toEqual({
      capital: 20_000,
      currency: "USD",
      limits: PROFILE_LIMITS.murphy,
      profile: "murphy",
    });
  });
});
