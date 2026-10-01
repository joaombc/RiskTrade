import { describe, expect, it } from "vitest";
import { computeRiskPlan, parseDecimal, type RiskInput, type RiskPlan } from "./risk";

const base: RiskInput = {
  capital: 100_000,
  riskPercent: 1,
  direction: "long",
  entry: 50,
  stop: 48,
  target: 56,
  lotSize: 1,
};

function plan(overrides: Partial<RiskInput> = {}): RiskPlan {
  const result = computeRiskPlan({ ...base, ...overrides });
  if (!result.ok) throw new Error(result.errors.join(" "));
  return result.plan;
}

describe("computeRiskPlan", () => {
  it("dimensiona a posição pelo risco máximo: 1% de 100 mil / R$ 2 por ação = 500 ações", () => {
    const p = plan();
    expect(p.maxRisk).toBe(1000);
    expect(p.riskPerUnit).toBe(2);
    expect(p.quantity).toBe(500);
    expect(p.positionValue).toBe(25_000);
    expect(p.actualRisk).toBe(1000);
    expect(p.cappedByCapital).toBe(false);
  });

  it("arredonda para baixo no múltiplo do lote", () => {
    expect(plan({ lotSize: 100, stop: 47.5 }).quantity).toBe(400); // 1000 / 2,5 = 400
    expect(plan({ lotSize: 100, stop: 47 }).quantity).toBe(300); // 1000 / 3 = 333 → 300
  });

  it("não perde uma ação por erro de ponto flutuante (50,10 − 48,10 = 2,0000000000000036)", () => {
    expect(plan({ entry: 50.1, stop: 48.1, target: 56.1 }).quantity).toBe(500);
  });

  it("limita pelo capital quando o stop é muito curto", () => {
    const p = plan({ stop: 49.9 }); // 1000 / 0,1 = 10.000 ações = R$ 500 mil
    expect(p.quantity).toBe(2000);
    expect(p.cappedByCapital).toBe(true);
    expect(p.actualRisk).toBeCloseTo(200);
  });

  it("valida a relação recompensa/risco mínima de 3:1", () => {
    expect(plan().rewardRisk).toBe(3);
    expect(plan().meetsMinRewardRisk).toBe(true);
    const weak = plan({ target: 54 });
    expect(weak.rewardRisk).toBe(2);
    expect(weak.meetsMinRewardRisk).toBe(false);
  });

  it("planeja saídas em terços com a 1ª parcial em 1R e o resto sem risco", () => {
    const p = plan({ lotSize: 100, capital: 200_000, riskPercent: 1 }); // 2000 / 2 = 1000 ações
    expect(p.partials?.map((x) => [x.quantity, x.price])).toEqual([
      [300, 52],
      [300, 56],
      [400, undefined],
    ]);
    expect(p.riskFreeProfit).toBe(600);
  });

  it("espelha os cálculos na venda", () => {
    const p = plan({ direction: "short", entry: 50, stop: 52, target: 44 });
    expect(p.quantity).toBe(500);
    expect(p.rewardRisk).toBe(3);
    expect(p.partials?.[0].price).toBe(48);
  });

  it("exige stop e alvo do lado correto da entrada", () => {
    const wrongStop = computeRiskPlan({ ...base, stop: 51 });
    expect(wrongStop.ok).toBe(false);
    const wrongTarget = computeRiskPlan({ ...base, direction: "short", stop: 52, target: 55 });
    expect(wrongTarget).toEqual({ ok: false, errors: ["Na venda, o alvo deve ficar abaixo da entrada."] });
  });

  it("exige o stop definido antes de calcular", () => {
    const result = computeRiskPlan({ ...base, stop: NaN });
    expect(result).toEqual({ ok: false, errors: ["Defina o stop-loss antes de calcular a posição."] });
  });

  it("avisa quando o risco passa de 2% ou quando nem um lote cabe no risco", () => {
    expect(plan({ riskPercent: 3 }).warnings[0]).toMatch(/acima do recomendado/);
    const tiny = plan({ capital: 1000, lotSize: 100 }); // risco 10 / (2 × 100) < 1 lote
    expect(tiny.quantity).toBe(0);
    expect(tiny.warnings.join(" ")).toMatch(/risco de um lote/);
  });

  it("não sugere terços quando a posição não comporta três lotes", () => {
    const p = plan({ capital: 40_000, lotSize: 100 }); // 400 / 2 = 200 ações = 2 lotes
    expect(p.partials).toBeUndefined();
    expect(p.warnings.join(" ")).toMatch(/pequena demais/);
  });
});

describe("parseDecimal", () => {
  it.each([
    ["49,70", 49.7],
    ["49.70", 49.7],
    ["1.234,56", 1234.56],
    ["100.000", 100_000],
    ["R$ 2.500,00", 2500],
    ["", undefined],
    ["abc", undefined],
  ])("%s → %s", (raw, expected) => {
    expect(parseDecimal(raw)).toBe(expected);
  });
});
