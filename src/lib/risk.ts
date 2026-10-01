/**
 * Gestão de risco: dimensionamento de posição pelo risco máximo aceito, validação da
 * relação recompensa/risco (mínimo 3:1, Murphy) e saída fracionada em terços.
 */

export type Direction = "long" | "short";

export interface RiskInput {
  capital: number;
  /** Percentual do capital arriscado na operação (ex.: 1 = 1%). */
  riskPercent: number;
  direction: Direction;
  entry: number;
  stop: number;
  target?: number;
  /** Múltiplo de negociação (1 para fracionário, 100 para lote padrão da B3). */
  lotSize: number;
}

export interface PartialExit {
  label: string;
  quantity: number;
  /** Preço de saída; ausente na parcial de condução (stop móvel). */
  price?: number;
  profit?: number;
  note: string;
}

export interface RiskPlan {
  riskPerUnit: number;
  maxRisk: number;
  quantity: number;
  positionValue: number;
  actualRisk: number;
  actualRiskPercent: number;
  /** A quantidade foi reduzida para caber no capital (sem alavancagem). */
  cappedByCapital: boolean;
  rewardPerUnit?: number;
  rewardRisk?: number;
  potentialProfit?: number;
  meetsMinRewardRisk?: boolean;
  partials?: PartialExit[];
  /** Pior resultado depois da 1ª parcial, com o stop movido para a entrada. */
  riskFreeProfit?: number;
  warnings: string[];
}

/** Nível do plano exibido como linha horizontal no gráfico. */
export interface PlanLevel {
  price: number;
  label: string;
  kind: "entry" | "stop" | "target" | "partial";
}

export type RiskResult = { ok: true; plan: RiskPlan } | { ok: false; errors: string[] };

export const MIN_REWARD_RISK = 3;
export const RECOMMENDED_MAX_RISK_PERCENT = 2;

/** Arredonda para baixo no múltiplo do lote, tolerando erro de ponto flutuante (499,9999… → 500). */
function floorToLot(quantity: number, lotSize: number): number {
  return Math.floor(quantity / lotSize + 1e-9) * lotSize;
}

export function computeRiskPlan(input: RiskInput): RiskResult {
  const { capital, riskPercent, direction, entry, stop, target, lotSize } = input;
  const errors: string[] = [];
  const long = direction === "long";

  if (!(capital > 0)) errors.push("Informe o capital total da conta.");
  if (!(riskPercent > 0 && riskPercent <= 100)) errors.push("O risco por operação deve estar entre 0% e 100%.");
  if (!(entry > 0)) errors.push("Informe o preço de entrada.");
  if (!(stop > 0)) errors.push("Defina o stop-loss antes de calcular a posição.");
  if (!(lotSize >= 1 && Number.isInteger(lotSize))) errors.push("O lote deve ser um número inteiro maior ou igual a 1.");
  if (errors.length > 0) return { ok: false, errors };

  if (long ? stop >= entry : stop <= entry) {
    errors.push(long ? "Na compra, o stop deve ficar abaixo da entrada." : "Na venda, o stop deve ficar acima da entrada.");
  }
  if (target !== undefined && (long ? target <= entry : target >= entry)) {
    errors.push(long ? "Na compra, o alvo deve ficar acima da entrada." : "Na venda, o alvo deve ficar abaixo da entrada.");
  }
  if (errors.length > 0) return { ok: false, errors };

  const warnings: string[] = [];
  if (riskPercent > RECOMMENDED_MAX_RISK_PERCENT) {
    warnings.push(`Risco de ${riskPercent}% por operação está acima do recomendado (1% a ${RECOMMENDED_MAX_RISK_PERCENT}%).`);
  }

  const riskPerUnit = Math.abs(entry - stop);
  const maxRisk = (capital * riskPercent) / 100;
  const byRisk = floorToLot(maxRisk / riskPerUnit, lotSize);
  const byCapital = floorToLot(capital / entry, lotSize);
  const quantity = Math.min(byRisk, byCapital);
  const cappedByCapital = byCapital < byRisk;

  if (quantity === 0) {
    warnings.push(
      byRisk === 0
        ? "O risco de um lote passa do risco máximo permitido: aproxime o stop, aumente o capital ou reduza o lote."
        : "O capital não cobre nem um lote ao preço de entrada.",
    );
  } else if (cappedByCapital) {
    warnings.push("A quantidade foi limitada pelo capital disponível; o risco efetivo ficou abaixo do máximo.");
  }

  const actualRisk = quantity * riskPerUnit;
  const plan: RiskPlan = {
    riskPerUnit,
    maxRisk,
    quantity,
    positionValue: quantity * entry,
    actualRisk,
    actualRiskPercent: (actualRisk / capital) * 100,
    cappedByCapital,
    warnings,
  };

  if (target !== undefined) {
    const rewardPerUnit = Math.abs(target - entry);
    const rewardRisk = rewardPerUnit / riskPerUnit;
    plan.rewardPerUnit = rewardPerUnit;
    plan.rewardRisk = rewardRisk;
    plan.potentialProfit = quantity * rewardPerUnit;
    plan.meetsMinRewardRisk = rewardRisk >= MIN_REWARD_RISK;
    Object.assign(plan, planThirds(input, target, quantity, riskPerUnit, rewardRisk, warnings));
  }

  return { ok: true, plan };
}

/**
 * Saída em terços: 1/3 no primeiro movimento (1R), quando o stop vai para a entrada e a
 * operação fica livre de risco; 1/3 no alvo do padrão; 1/3 conduzido com stop móvel.
 */
function planThirds(
  { direction, entry, lotSize }: RiskInput,
  target: number,
  quantity: number,
  riskPerUnit: number,
  rewardRisk: number,
  warnings: string[],
): Pick<RiskPlan, "partials" | "riskFreeProfit"> {
  const third = floorToLot(quantity / 3, lotSize);
  if (third === 0) {
    if (quantity > 0) warnings.push("Posição pequena demais para dividir em terços com o lote informado.");
    return {};
  }
  if (rewardRisk <= 1) {
    warnings.push("O alvo está a menos de 1R da entrada: não há espaço para a parcial de proteção antes dele.");
    return {};
  }

  const sign = direction === "long" ? 1 : -1;
  const firstPrice = entry + sign * riskPerUnit;
  const firstProfit = third * riskPerUnit;
  const targetProfit = third * Math.abs(target - entry);

  return {
    partials: [
      {
        label: "1º terço",
        quantity: third,
        price: firstPrice,
        profit: firstProfit,
        note: "Primeiro movimento (1R). Depois dela, mova o stop para a entrada.",
      },
      {
        label: "2º terço",
        quantity: third,
        price: target,
        profit: targetProfit,
        note: "Alvo do padrão.",
      },
      {
        label: "3º terço",
        quantity: quantity - 2 * third,
        note: "Condução: siga a tendência com stop móvel abaixo dos fundos (ou acima dos topos, na venda).",
      },
    ],
    riskFreeProfit: firstProfit,
  };
}

/**
 * Lê números digitados em formato brasileiro ou internacional:
 * "1.234,56", "1234,56", "1234.56" e "100.000" (milhar) viram números.
 */
export function parseDecimal(raw: string): number | undefined {
  const text = raw.trim().replace(/\s|R\$|US\$|\$/g, "");
  if (!text) return undefined;
  let normalized = text;
  if (text.includes(",")) normalized = text.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(text)) normalized = text.replace(/\./g, "");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}
