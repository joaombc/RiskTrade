import { fmt } from "../i18n/format";

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

/** Mensagens do cálculo de risco; o padrão é português, e a interface passa as do idioma atual. */
export interface RiskMessages {
  noCapital: string;
  badRiskPercent: string;
  noEntry: string;
  noStop: string;
  badLot: string;
  stopLong: string;
  stopShort: string;
  targetLong: string;
  targetShort: string;
  /** Com {risk} e {max}. */
  riskAboveRecommended: string;
  lotAboveRisk: string;
  capitalBelowLot: string;
  cappedByCapital: string;
  tooSmallForThirds: string;
  targetBelow1R: string;
  partial1: string;
  partial2: string;
  partial3: string;
  note1: string;
  note2: string;
  note3: string;
}

export const PT_RISK_MESSAGES: RiskMessages = {
  noCapital: "Informe o capital total da conta.",
  badRiskPercent: "O risco por operação deve estar entre 0% e 100%.",
  noEntry: "Informe o preço de entrada.",
  noStop: "Defina o stop-loss antes de calcular a posição.",
  badLot: "O lote deve ser um número inteiro maior ou igual a 1.",
  stopLong: "Na compra, o stop deve ficar abaixo da entrada.",
  stopShort: "Na venda, o stop deve ficar acima da entrada.",
  targetLong: "Na compra, o alvo deve ficar acima da entrada.",
  targetShort: "Na venda, o alvo deve ficar abaixo da entrada.",
  riskAboveRecommended: "Risco de {risk}% por operação está acima do recomendado (1% a {max}%).",
  lotAboveRisk: "O risco de um lote passa do risco máximo permitido: aproxime o stop, aumente o capital ou reduza o lote.",
  capitalBelowLot: "O capital não cobre nem um lote ao preço de entrada.",
  cappedByCapital: "A quantidade foi limitada pelo capital disponível; o risco efetivo ficou abaixo do máximo.",
  tooSmallForThirds: "Posição pequena demais para dividir em terços com o lote informado.",
  targetBelow1R: "O alvo está a menos de 1R da entrada: não há espaço para a parcial de proteção antes dele.",
  partial1: "1º terço",
  partial2: "2º terço",
  partial3: "3º terço",
  note1: "Primeiro movimento (1R). Depois dela, mova o stop para a entrada.",
  note2: "Alvo do padrão.",
  note3: "Condução: siga a tendência com stop móvel abaixo dos fundos (ou acima dos topos, na venda).",
};

/** Arredonda para baixo no múltiplo do lote, tolerando erro de ponto flutuante (499,9999… → 500). */
function floorToLot(quantity: number, lotSize: number): number {
  return Math.floor(quantity / lotSize + 1e-9) * lotSize;
}

export function computeRiskPlan(input: RiskInput, messages: RiskMessages = PT_RISK_MESSAGES): RiskResult {
  const m = messages;
  const { capital, riskPercent, direction, entry, stop, target, lotSize } = input;
  const errors: string[] = [];
  const long = direction === "long";

  if (!(capital > 0)) errors.push(m.noCapital);
  if (!(riskPercent > 0 && riskPercent <= 100)) errors.push(m.badRiskPercent);
  if (!(entry > 0)) errors.push(m.noEntry);
  if (!(stop > 0)) errors.push(m.noStop);
  if (!(lotSize >= 1 && Number.isInteger(lotSize))) errors.push(m.badLot);
  if (errors.length > 0) return { ok: false, errors };

  if (long ? stop >= entry : stop <= entry) {
    errors.push(long ? m.stopLong : m.stopShort);
  }
  if (target !== undefined && (long ? target <= entry : target >= entry)) {
    errors.push(long ? m.targetLong : m.targetShort);
  }
  if (errors.length > 0) return { ok: false, errors };

  const warnings: string[] = [];
  if (riskPercent > RECOMMENDED_MAX_RISK_PERCENT) {
    warnings.push(fmt(m.riskAboveRecommended, { risk: riskPercent, max: RECOMMENDED_MAX_RISK_PERCENT }));
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
        ? m.lotAboveRisk
        : m.capitalBelowLot,
    );
  } else if (cappedByCapital) {
    warnings.push(m.cappedByCapital);
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
    Object.assign(plan, planThirds(input, target, quantity, riskPerUnit, rewardRisk, warnings, m));
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
  m: RiskMessages,
): Pick<RiskPlan, "partials" | "riskFreeProfit"> {
  const third = floorToLot(quantity / 3, lotSize);
  if (third === 0) {
    if (quantity > 0) warnings.push(m.tooSmallForThirds);
    return {};
  }
  if (rewardRisk <= 1) {
    warnings.push(m.targetBelow1R);
    return {};
  }

  const sign = direction === "long" ? 1 : -1;
  const firstPrice = entry + sign * riskPerUnit;
  const firstProfit = third * riskPerUnit;
  const targetProfit = third * Math.abs(target - entry);

  return {
    partials: [
      {
        label: m.partial1,
        quantity: third,
        price: firstPrice,
        profit: firstProfit,
        note: m.note1,
      },
      {
        label: m.partial2,
        quantity: third,
        price: target,
        profit: targetProfit,
        note: m.note2,
      },
      {
        label: m.partial3,
        quantity: quantity - 2 * third,
        note: m.note3,
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
