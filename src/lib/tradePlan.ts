import type { Bar } from "./drawings/types";
import { atr, nearestLevels } from "./premarket";
import { findSwings, readTrend, TREND_WINDOWS, type Trend, type TrendReading } from "./trend";
import { findTrendLines } from "./trendlines";

/**
 * Plano de cada ativo pelas táticas do capítulo 16 de Murphy: a previsão (o quê) vem da tendência
 * intermediária do diário, confirmada pelo semanal (regras 1 e 14); o timing (quando) vem das
 * táticas de entrada (queda de 40–60%, rompimento, suporte, gap, linha de tendência); o stop fica
 * abaixo de um suporte válido e o alvo é a projeção da perna anterior, limitada pela resistência.
 * O lado vendido é o espelho: calculado sobre os preços invertidos. Cálculos puros.
 */

export type PlanSide = "long" | "short";
/** enterNow: entrar agora; enterLimit: na queda até a zona; enterStop: no rompimento; wait: aguardar; stayOut: ficar de fora. */
export type PlanAction = "enterNow" | "enterLimit" | "enterStop" | "wait" | "stayOut";
export type OrderType = "market" | "limit" | "stop";
export type Confluence = "retracement" | "support" | "gap" | "trendline";

export type PlanReason =
  | { key: "trend"; trend: Trend; since: number }
  | { key: "noTrendData" }
  | { key: "weekly"; trend: Trend | null; agrees: boolean | null }
  | { key: "inZone"; retrace: number }
  | { key: "aboveZone"; retrace: number }
  | { key: "deepPullback"; retrace: number }
  | { key: "freshBreakout"; level: number }
  | { key: "extendedBreakout"; level: number }
  | { key: "range"; low: number; high: number }
  | { key: "stopSupport"; level: number }
  | { key: "stopBreakout"; level: number }
  | { key: "stopSwing"; level: number }
  | { key: "targetProjection"; target: number }
  | { key: "targetResistance"; target: number };

export interface TradePlan {
  /** Lado do plano; null sem tendência nem rompimento a esperar. */
  side: PlanSide | null;
  action: PlanAction;
  close: number;
  atr: number;
  dailyTrend: Trend | null;
  weeklyTrend: Trend | null;
  /** Preço de referência da entrada (a zona inteira em entryZone). */
  entry: number | null;
  entryZone: [number, number] | null;
  order: OrderType | null;
  stop: number | null;
  /** Primeiro objetivo (unidade de trading): o topo da perna, ou a metade do caminho. */
  target1: number | null;
  /** Alvo da unidade de tendência. */
  target: number | null;
  rewardRisk: number | null;
  confluence: Confluence[];
  reasons: PlanReason[];
}

/** Janela dos topos e fundos do semanal (3 semanas de cada lado). */
const WEEKLY_WINDOW = 3;
/** Zona de compra na queda: 40% a 60% da perna (Murphy). */
const ZONE = [0.4, 0.6] as const;
/** Rompimento recente: até 5 candles e até 1 ATR acima do nível rompido. */
const FRESH_BARS = 5;
const FRESH_ATRS = 1;
/** Até onde (em ATR) o recuo ao topo rompido ainda é a entrada; mais longe, vale a zona de 40–60% da perna. */
const RETEST_ATRS = 3;
/** Folga do stop abaixo do suporte, em ATR. */
const STOP_ATRS = 0.25;
/** Distância (em ATR) para um nível contar como confluência da zona de entrada. */
const NEAR_ATRS = 0.5;
/** Gaps procurados nos últimos candles. */
const GAP_BARS = 60;

/** Os mesmos candles com os preços invertidos: a baixa vira alta, para reaproveitar a lógica da compra. */
export const invertBars = (bars: Bar[]): Bar[] => bars.map((b) => ({ ...b, open: -b.open, high: -b.low, low: -b.high, close: -b.close }));

/** Gaps de alta ainda abertos abaixo do preço: [topo do candle anterior, fundo do candle do gap]. */
export function openGaps(bars: Bar[], lookback = GAP_BARS): [number, number][] {
  const gaps: [number, number][] = [];
  for (let i = Math.max(1, bars.length - lookback); i < bars.length; i++) {
    const [top, bottom] = [bars[i - 1].high, bars[i].low];
    if (bottom <= top) continue;
    const filled = bars.slice(i + 1).some((b) => b.low <= top);
    if (!filled) gaps.push([top, bottom]);
  }
  return gaps;
}

interface Setup {
  action: PlanAction;
  entry: number;
  entryZone: [number, number] | null;
  order: OrderType;
  stop: number;
  target1: number;
  target: number;
  confluence: Confluence[];
  reasons: PlanReason[];
}

/** Alvo pela projeção da perna, limitado à primeira resistência entre o topo e a projeção. */
function pickTarget(bars: Bar[], entry: number, legHigh: number, projection: number): { target: number; reason: PlanReason } {
  // Logo acima do topo da perna (folga somada, que vale também nos preços invertidos da venda).
  const from = Math.max(entry, legHigh);
  const { resistance } = nearestLevels(bars, from + Math.abs(from) * 1e-4);
  if (resistance && resistance.price < projection && resistance.price > entry) return { target: resistance.price, reason: { key: "targetResistance", target: resistance.price } };
  return { target: projection, reason: { key: "targetProjection", target: projection } };
}

/** Stop abaixo do suporte válido mais próximo da entrada (ou do último fundo), com folga de ATR. */
function pickStop(bars: Bar[], entry: number, swingLow: number, range: number): { stop: number; reason: PlanReason } {
  const { support } = nearestLevels(bars, entry);
  if (support && support.price >= swingLow && support.price < entry) return { stop: support.price - STOP_ATRS * range, reason: { key: "stopSupport", level: support.price } };
  return { stop: swingLow - STOP_ATRS * range, reason: { key: "stopSwing", level: swingLow } };
}

/** Fatores que coincidem com a zona de entrada (Murphy: combine os conceitos). */
function confluenceAt(bars: Bar[], reading: TrendReading, zone: [number, number], range: number, retracement: boolean): Confluence[] {
  const [lo, hi] = [zone[0] - NEAR_ATRS * range, zone[1] + NEAR_ATRS * range];
  const near = (p: number) => p >= lo && p <= hi;
  const factors: Confluence[] = retracement ? ["retracement"] : [];
  const { support } = nearestLevels(bars, zone[1] + NEAR_ATRS * range);
  if (support && near(support.price)) factors.push("support");
  if (openGaps(bars).some(([top, bottom]) => near(top) || near(bottom))) factors.push("gap");
  const swings = findSwings(bars, TREND_WINDOWS.intermediate);
  if (findTrendLines(bars, swings, reading.trend).some((l) => l.side === "support" && near(l.now))) factors.push("trendline");
  return factors;
}

/** Plano de compra numa alta (nos candles já invertidos, para a venda). */
function longSetup(bars: Bar[], reading: TrendReading, range: number): Setup | null {
  const close = bars[bars.length - 1].close;
  const low = reading.lastLow;
  if (!low) return null;
  const legHigh = Math.max(...bars.slice(low.index).map((b) => b.high));
  const leg = legHigh - low.price;
  if (!(leg > 0)) return null;
  const retrace = (legHigh - close) / leg;
  const zone: [number, number] = [legHigh - ZONE[1] * leg, legHigh - ZONE[0] * leg];

  // Rompimento recente do topo anterior: comprar já, com stop logo abaixo do ponto de rompimento.
  const prior = reading.lastHigh && reading.lastHigh.index < low.index ? reading.lastHigh.price : null;
  if (prior !== null && close > prior && close - prior <= RETEST_ATRS * range) {
    const brokeAt = bars.findIndex((b, i) => i > low.index && b.close > prior);
    const fresh = brokeAt >= bars.length - FRESH_BARS && close - prior <= FRESH_ATRS * range;
    const projection = prior + (prior - low.price);
    if (fresh) {
      const entry = close;
      const { target, reason } = pickTarget(bars, entry, legHigh, Math.max(projection, entry + (prior - low.price) / 2));
      return {
        action: "enterNow",
        entry,
        entryZone: null,
        order: "market",
        stop: prior - 2 * STOP_ATRS * range,
        target1: entry + (target - entry) / 2,
        target,
        confluence: confluenceAt(bars, reading, [prior, prior], range, false),
        reasons: [{ key: "freshBreakout", level: prior }, { key: "stopBreakout", level: prior }, reason],
      };
    }
    // Rompeu e correu: esperar o recuo até o topo rompido, que vira suporte.
    const entry = prior + STOP_ATRS * range;
    const { target, reason } = pickTarget(bars, entry, legHigh, legHigh + (prior - low.price) / 2);
    return {
      action: "enterLimit",
      entry,
      entryZone: [prior, entry],
      order: "limit",
      stop: prior - 2 * STOP_ATRS * range,
      target1: legHigh,
      target: Math.max(target, legHigh),
      confluence: confluenceAt(bars, reading, [prior, entry], range, false),
      reasons: [{ key: "extendedBreakout", level: prior }, { key: "stopBreakout", level: prior }, reason],
    };
  }

  // Correção funda (além de 60%): só comprar na retomada, acima do topo do repique recente.
  if (retrace > ZONE[1]) {
    const trigger = Math.max(...bars.slice(-3).map((b) => b.high)) + 0.1 * range;
    const { stop, reason: stopReason } = pickStop(bars, Math.min(close, trigger), low.price, range);
    const { target, reason } = pickTarget(bars, trigger, legHigh, trigger + leg);
    return {
      action: "enterStop",
      entry: trigger,
      entryZone: null,
      order: "stop",
      stop,
      target1: legHigh,
      target,
      confluence: [],
      reasons: [{ key: "deepPullback", retrace }, stopReason, reason],
    };
  }

  const inZone = retrace >= ZONE[0];
  const entry = inZone ? close : zone[1];
  const { stop, reason: stopReason } = pickStop(bars, Math.min(entry, zone[0]), low.price, range);
  const { target, reason } = pickTarget(bars, entry, legHigh, entry + leg);
  return {
    action: inZone ? "enterNow" : "enterLimit",
    entry,
    entryZone: zone,
    order: inZone ? "market" : "limit",
    stop,
    target1: legHigh > entry ? legHigh : entry + (target - entry) / 2,
    target,
    confluence: confluenceAt(bars, reading, zone, range, true),
    reasons: [inZone ? { key: "inZone", retrace } : { key: "aboveZone", retrace }, stopReason, reason],
  };
}

/**
 * Mercado lateral: comprar o rompimento do topo da faixa (o stop no meio dela; o alvo, a altura da
 * faixa). Se o preço já rompeu: entrar agora quando o rompimento é recente, ou no recuo até o topo.
 */
function rangeSetup(reading: TrendReading, close: number, range: number): Setup | null {
  const [high, low] = [reading.lastHigh?.price, reading.lastLow?.price];
  if (high === undefined || low === undefined || high <= low) return null;
  const height = high - low;
  const levels = { stop: high - height / 2, target1: high + height / 2, target: high + height };
  const reasons: PlanReason[] = [{ key: "range", low, high }];
  if (close <= high) return { action: "enterStop", entry: high, entryZone: null, order: "stop", ...levels, confluence: [], reasons };
  if (close - high <= FRESH_ATRS * range) return { action: "enterNow", entry: close, entryZone: null, order: "market", ...levels, confluence: [], reasons };
  return { action: "enterLimit", entry: high + STOP_ATRS * range, entryZone: [high, high + STOP_ATRS * range], order: "limit", ...levels, confluence: [], reasons };
}

const flipPrice = (p: number) => -p;
const flipReason = (r: PlanReason): PlanReason => {
  const out = { ...r } as Record<string, unknown>;
  for (const k of ["level", "target", "low", "high"]) if (typeof out[k] === "number") out[k] = -(out[k] as number);
  if (r.key === "range") return { key: "range", low: -r.high, high: -r.low };
  return out as PlanReason;
};

/** Volta um plano calculado nos preços invertidos para os preços reais (lado vendido). */
function flipSetup(s: Setup): Setup {
  return {
    ...s,
    entry: flipPrice(s.entry),
    entryZone: s.entryZone ? [flipPrice(s.entryZone[1]), flipPrice(s.entryZone[0])] : null,
    stop: flipPrice(s.stop),
    target1: flipPrice(s.target1),
    target: flipPrice(s.target),
    reasons: s.reasons.map(flipReason),
  };
}

const opposite = (a: Trend | null, b: Trend | null) => (a === "up" && b === "down") || (a === "down" && b === "up");

/**
 * Plano do ativo. `daily` são os candles diários (1 ano); `weekly`, os semanais (ou null). Sem
 * tendência intermediária: espera o rompimento da faixa, se o semanal apontar o lado.
 */
export function tradePlan(daily: Bar[], weekly: Bar[] | null): TradePlan {
  const close = daily[daily.length - 1]?.close ?? NaN;
  const range = atr(daily) ?? 0;
  const reading = daily.length ? readTrend(daily, TREND_WINDOWS.intermediate) : null;
  const weeklyTrend = weekly && weekly.length ? (readTrend(weekly, WEEKLY_WINDOW)?.trend ?? null) : null;
  const base: TradePlan = {
    side: null,
    action: "stayOut",
    close,
    atr: range,
    dailyTrend: reading?.trend ?? null,
    weeklyTrend,
    entry: null,
    entryZone: null,
    order: null,
    stop: null,
    target1: null,
    target: null,
    rewardRisk: null,
    confluence: [],
    reasons: [],
  };
  if (!reading || !(range > 0)) return { ...base, reasons: [{ key: "noTrendData" }] };

  const trendReason: PlanReason = { key: "trend", trend: reading.trend, since: daily[reading.since].time };
  const weeklyReason: PlanReason = {
    key: "weekly",
    trend: weeklyTrend,
    agrees: weeklyTrend === null || weeklyTrend === "lateral" || reading.trend === "lateral" ? null : weeklyTrend === reading.trend,
  };

  let side: PlanSide | null = null;
  let setup: Setup | null = null;
  if (reading.trend === "up") {
    side = "long";
    setup = longSetup(daily, reading, range);
  } else if (reading.trend === "down") {
    side = "short";
    const inverted = invertBars(daily);
    const invReading = readTrend(inverted, TREND_WINDOWS.intermediate);
    const raw = invReading && invReading.trend === "up" ? longSetup(inverted, invReading, range) : null;
    setup = raw ? flipSetup(raw) : null;
  } else if (weeklyTrend === "up" || weeklyTrend === "down") {
    // Lateral no diário: o semanal diz para que lado esperar o rompimento.
    side = weeklyTrend === "up" ? "long" : "short";
    if (side === "long") setup = rangeSetup(reading, close, range);
    else {
      const inverted = invertBars(daily);
      const invReading = readTrend(inverted, TREND_WINDOWS.intermediate);
      const raw = invReading ? rangeSetup(invReading, -close, range) : null;
      setup = raw ? flipSetup(raw) : null;
    }
  }

  if (!setup || side === null) return { ...base, side, reasons: [trendReason, weeklyReason] };
  const risk = Math.abs(setup.entry - setup.stop);
  const rewardRisk = risk > 0 ? Math.abs(setup.target - setup.entry) / risk : null;
  // Semanal contra o diário: o plano fica pronto, mas a orientação é aguardar (regra 14).
  const action = opposite(reading.trend, weeklyTrend) ? "wait" : setup.action;
  return {
    ...base,
    side,
    action,
    entry: setup.entry,
    entryZone: setup.entryZone,
    order: setup.order,
    stop: setup.stop,
    target1: setup.target1,
    target: setup.target,
    rewardRisk,
    confluence: setup.confluence,
    reasons: [trendReason, weeklyReason, ...setup.reasons],
  };
}

export interface SizeInput {
  entry: number;
  stop: number;
  /** Capital da conta, na moeda da conta. */
  capital: number;
  maxInvested: number;
  maxPerAsset: number;
  riskPerTrade: number;
  /** Quanto vale 1 unidade da moeda do ativo na moeda da conta. */
  fx: number;
  /** Múltiplo de negociação: 100 (lote da B3), 1 ou fração (cripto). */
  lot: number;
  /** Já investido na carteira, na moeda da conta (as posições abertas, na história seguinte). */
  invested?: number;
}

export interface PositionSize {
  quantity: number;
  /** Valor da posição, na moeda da conta. */
  value: number;
  /** Perda até o stop, na moeda da conta. */
  risk: number;
  /** O limite que definiu a quantidade (Murphy: risco por operação, por ativo e o total investido). */
  limitedBy: "risk" | "asset" | "cash";
}

/** Lote de cada ativo: 100 na B3, fração em cripto, 1 no resto. */
export const lotOf = (symbol: string) => (symbol.endsWith(".SA") ? 100 : /-USD$|-BRL$/.test(symbol) ? 0.0001 : 1);

/**
 * Quantidade pela gestão do dinheiro (Murphy, cap. 16): o menor entre o que o risco por operação
 * permite até o stop, o limite por ativo e o caixa que ainda pode ser investido, em lotes inteiros.
 */
export function sizePosition(input: SizeInput): PositionSize {
  const { entry, stop, capital, fx, lot } = input;
  const unitValue = entry * fx;
  const unitRisk = Math.abs(entry - stop) * fx;
  const pct = (p: number) => (capital * p) / 100;
  const limits = {
    risk: unitRisk > 0 ? pct(input.riskPerTrade) / unitRisk : 0,
    asset: unitValue > 0 ? pct(input.maxPerAsset) / unitValue : 0,
    cash: unitValue > 0 ? Math.max(0, pct(input.maxInvested) - (input.invested ?? 0)) / unitValue : 0,
  };
  const limitedBy = (Object.keys(limits) as (keyof typeof limits)[]).reduce((a, b) => (limits[b] < limits[a] ? b : a));
  // Arredonda para baixo no lote, sem erro de ponto flutuante nas frações (0,0001).
  const steps = Math.floor(limits[limitedBy] / lot + 1e-9);
  const quantity = Number((steps * lot).toFixed(4));
  return { quantity, value: quantity * unitValue, risk: quantity * unitRisk, limitedBy };
}

export type FinalReason = { key: "rewardRiskLow"; rewardRisk: number; min: number } | { key: "shortDisabled" } | { key: "noCapital" };

/**
 * Ação final com a conta: abaixo do ganho/risco mínimo a entrada vira "aguardar" (regra 9); no
 * lado vendido, sem operar vendido, "ficar de fora".
 */
export function finalAction(plan: TradePlan, minRewardRisk: number, allowShort: boolean): { action: PlanAction; reason: FinalReason | null } {
  const entering = plan.action === "enterNow" || plan.action === "enterLimit" || plan.action === "enterStop";
  if (plan.side === "short" && !allowShort) return { action: "stayOut", reason: { key: "shortDisabled" } };
  if (entering && plan.rewardRisk !== null && plan.rewardRisk < minRewardRisk)
    return { action: "wait", reason: { key: "rewardRiskLow", rewardRisk: plan.rewardRisk, min: minRewardRisk } };
  return { action: plan.action, reason: null };
}
